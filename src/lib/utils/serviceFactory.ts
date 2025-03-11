import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { z } from "zod";
import { Prisma, PrismaClient } from "@prisma/client";

export interface BulkOperationResult<T> {
	succeeded: T[];
	failed: Array<{
		data: any;
		error: string;
	}>;
}

export interface ServiceFactoryOptions<T, CreateInput, UpdateInput> {
	modelName: string;
	validator: {
		createSchema: z.ZodType<CreateInput>;
		updateSchema?: z.ZodType<UpdateInput>;
		bulkSchema?: z.ZodType<CreateInput[]>;
	};
	prismaModel: any; // Reference to Prisma model (e.g., prisma.school)
	searchFields?: string[]; // Fields to search when filtering
	defaultOrderBy?: Record<string, "asc" | "desc">; // Default ordering
}

export function createService<
	T,
	CreateInput extends Record<string, any>,
	UpdateInput extends Record<string, any> = CreateInput
>(options: ServiceFactoryOptions<T, CreateInput, UpdateInput>) {
	const {
		modelName,
		validator,
		prismaModel,
		searchFields = ["name"],
		defaultOrderBy = { name: "asc" },
	} = options;

	// Create a single entity
	async function create(data: CreateInput): Promise<T> {
		try {
			const parsedData = validator.createSchema.parse(data);
			const entity = await prismaModel.create({ data: parsedData });
			logger.info(`Created ${modelName} ${entity.id}: ${entity.name || ""}`);
			return entity;
		} catch (error) {
			logger.error(`Failed to create ${modelName}: ${error}`);
			throw new ApiError(`${modelName} creation failed: ${error}`, 400);
		}
	}

	// Create multiple entities
	async function createMultiple(
		entities: CreateInput[]
	): Promise<BulkOperationResult<T>> {
		if (validator.bulkSchema) {
			validator.bulkSchema.parse(entities);
		}

		const result: BulkOperationResult<T> = {
			succeeded: [],
			failed: [],
		};

		for (const entityData of entities) {
			try {
				const createdEntity = await create(entityData);
				result.succeeded.push(createdEntity);
			} catch (error) {
				result.failed.push({
					data: entityData,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return result;
	}

	// Update a single entity
	async function update(id: string, data: UpdateInput): Promise<T> {
		try {
			const parsedData = validator.updateSchema
				? validator.updateSchema.parse(data)
				: validator.createSchema.parse(data);

			const entity = await prismaModel.update({
				where: { id },
				data: parsedData,
			});
			logger.info(`Updated ${modelName} ${entity.id}: ${entity.name || ""}`);
			return entity;
		} catch (error) {
			logger.error(`Failed to update ${modelName} ${id}: ${error}`);
			throw new ApiError(`${modelName} update failed: ${error}`, 400);
		}
	}

	// Update multiple entities
	async function updateMultiple(
		entities: (UpdateInput & { id: string })[]
	): Promise<BulkOperationResult<T>> {
		const result: BulkOperationResult<T> = {
			succeeded: [],
			failed: [],
		};

		for (const entityData of entities) {
			try {
				const { id, ...updateData } = entityData;
				// Fix: Convert to unknown first, then to UpdateInput
				const updatedEntity = await update(
					id,
					updateData as unknown as UpdateInput
				);
				result.succeeded.push(updatedEntity);
			} catch (error) {
				result.failed.push({
					data: entityData,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return result;
	}

	// Delete a single entity
	async function deleteEntity(id: string): Promise<void> {
		try {
			await prismaModel.delete({ where: { id } });
			logger.info(`Deleted ${modelName} ${id}`);
		} catch (error) {
			logger.error(`Failed to delete ${modelName} ${id}: ${error}`);
			throw new ApiError(`${modelName} deletion failed: ${error}`, 400);
		}
	}

	// Delete multiple entities
	async function deleteMultiple(
		ids: string[]
	): Promise<BulkOperationResult<T>> {
		const result: BulkOperationResult<T> = {
			succeeded: [],
			failed: [],
		};

		for (const id of ids) {
			try {
				const deletedEntity = await prismaModel.delete({ where: { id } });
				result.succeeded.push(deletedEntity);
			} catch (error) {
				result.failed.push({
					data: { id },
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		return result;
	}

	// Get entity by ID
	async function getById(id: string): Promise<T> {
		try {
			const entity = await prismaModel.findUniqueOrThrow({ where: { id } });
			return entity;
		} catch (error) {
			logger.error(`Failed to retrieve ${modelName} ${id}: ${error}`);
			throw new ApiError(`${modelName} retrieval failed: ${error}`, 404);
		}
	}

	// Get all entities with pagination and search
	async function getAll(
		page = 1,
		pageSize = 10,
		searchTerm = ""
	): Promise<{ items: T[]; total: number }> {
		try {
			let where = {};

			if (searchTerm && searchFields.length > 0) {
				const searchConditions = searchFields.map((field) => ({
					[field]: { contains: searchTerm, mode: "insensitive" },
				}));

				where = { OR: searchConditions };
			}

			const [items, total] = await Promise.all([
				prismaModel.findMany({
					where,
					skip: (page - 1) * pageSize,
					take: pageSize,
					orderBy: defaultOrderBy,
				}),
				prismaModel.count({ where }),
			]);

			return { items, total };
		} catch (error) {
			logger.error(`Failed to retrieve ${modelName} list: ${error}`);
			throw new ApiError(`${modelName} list retrieval failed: ${error}`, 500);
		}
	}

	return {
		create,
		createMultiple,
		update,
		updateMultiple,
		delete: deleteEntity,
		deleteMultiple,
		getById,
		getAll,
	};
}
