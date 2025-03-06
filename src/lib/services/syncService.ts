import Dexie, { Table } from "dexie";
import logger from "@/lib/utils/logger";
import { ApiError } from "@/lib/utils/api";
import { Student, StudentDocument } from "../types/prisma";

// Define the SyncQueue entry type
interface SyncQueueEntry {
	id: string;
	entityType: string;
	operation: "create" | "update" | "delete"; // Restrict operations
	payload: Student | any; // Use specific type or interface based on entity
	timestamp: number;
	status: "pending" | "synced" | "failed";
	retryCount?: number; // For retry logic
}

// Initialize Dexie database
const db = new Dexie("SchoolManagementSystem") as Dexie & {
	syncQueue: Table<SyncQueueEntry>;
};
db.version(1).stores({
	syncQueue: "id,entityType,operation,timestamp,status", // Added 'status' for filtering
});

// Valid entity types (extend as needed)
const VALID_ENTITY_TYPES = [
	"student",
	"teacher",
	"attendance",
	"grade",
	"curriculum",
] as const;
type EntityType = (typeof VALID_ENTITY_TYPES)[number];

// Valid operations
const VALID_OPERATIONS = ["create", "update", "delete"] as const;
type Operation = (typeof VALID_OPERATIONS)[number];

/**
 * Adds an entry to the sync queue for offline operations.
 * @param entityType - The type of entity (e.g., "student")
 * @param operation - The operation type (e.g., "create")
 * @param payload - The data to sync (e.g., Student object)
 * @returns Promise<void>
 * @throws ApiError if validation or storage fails
 */
export async function addToSyncQueue(
	entityType: string,
	operation: string,
	payload: any
): Promise<void> {
	try {
		// Validate entityType and operation
		if (!VALID_ENTITY_TYPES.includes(entityType as EntityType)) {
			throw new ApiError(`Invalid entity type: ${entityType}`, 400);
		}
		if (!VALID_OPERATIONS.includes(operation as Operation)) {
			throw new ApiError(`Invalid operation: ${operation}`, 400);
		}

		const entry: SyncQueueEntry = {
			id: crypto.randomUUID(),
			entityType,
			operation: operation as Operation,
			payload, // Ensure payload is properly typed (e.g., Student)
			timestamp: Date.now(),
			status: "pending",
			retryCount: 0,
		};

		await db.syncQueue.add(entry);
		logger.info(`Added to sync queue: ${entityType} - ${operation}`);
	} catch (error) {
		logger.error(`Failed to add to sync queue: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to queue sync operation: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Synchronizes pending queue items with the server.
 * @returns Promise<void>
 * @throws ApiError if sync fails
 */
export async function syncWithServer(): Promise<void> {
	if (!navigator.onLine) {
		logger.info("Offline; skipping sync with server");
		return;
	}

	try {
		const queue = await db.syncQueue
			.where("status")
			.equals("pending")
			.sortBy("timestamp"); // Sort by timestamp for order

		if (queue.length === 0) {
			logger.info("No pending sync items");
			return;
		}

		// Batch sync requests (e.g., 10 items at a time for performance)
		const batchSize = 10;
		for (let i = 0; i < queue.length; i += batchSize) {
			const batch = queue.slice(i, i + batchSize);
			await Promise.all(
				batch.map(async (entry) => {
					try {
						await syncItemWithServer(entry);
						await db.syncQueue.update(entry.id, { status: "synced" });
						logger.info(
							`Synced ${entry.entityType} - ${entry.operation} with ID ${entry.id}`
						);
					} catch (error) {
						await handleSyncFailure(entry, error as Error);
					}
				})
			);
		}
	} catch (error) {
		logger.error(`Sync with server failed: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to sync with server: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Syncs a single queue item with the server via API.
 * @param entry - The SyncQueueEntry to sync
 * @returns Promise<void>
 * @throws Error if API call fails
 */
async function syncItemWithServer(entry: SyncQueueEntry): Promise<void> {
	const response = await fetch("/api/sync", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			entityType: entry.entityType,
			operation: entry.operation,
			payload: entry.payload,
		}),
	});

	if (!response.ok) {
		throw new Error(`Server error: ${response.statusText}`);
	}
}

/**
 * Handles sync failures by updating retry count and status.
 * @param entry - The failed SyncQueueEntry
 * @param error - The error that occurred
 * @returns Promise<void>
 */
async function handleSyncFailure(
	entry: SyncQueueEntry,
	error: Error
): Promise<void> {
	const maxRetries = 3;
	const currentRetry = (entry.retryCount || 0) + 1;

	if (currentRetry >= maxRetries) {
		await db.syncQueue.update(entry.id, { status: "failed" });
		logger.error(
			`Sync failed after ${maxRetries} retries for ${entry.entityType} - ${entry.operation}: ${error.message}`,
			{ error }
		);
		throw new ApiError(`Sync failed after retries: ${error.message}`, 500);
	}

	await db.syncQueue.update(entry.id, {
		retryCount: currentRetry,
		status: "pending",
	});
	logger.warn(
		`Sync failed for ${entry.entityType} - ${entry.operation}, retrying (${currentRetry}/${maxRetries}): ${error.message}`,
		{ error }
	);
}

// Optional: Add periodic sync or event-based sync
export function startPeriodicSync(intervalMs: number = 30000) {
	setInterval(syncWithServer, intervalMs);
}

// Optional: Trigger sync on online event
if (typeof window !== "undefined") {
	window.addEventListener("online", syncWithServer);
}
