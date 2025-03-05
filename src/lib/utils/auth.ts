import { NextResponse } from "next/server";
import logger from "./logger";
import { Session } from "next-auth";

/**
 * Custom error class for API errors with HTTP status codes.
 */
export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number = 400) {
		super(message);
		this.status = status;
		this.name = "ApiError"; // Ensure proper error name for instanceof checks
	}
}

/**
 * Creates a successful API response with JSON data.
 * @param data - The data to return (must be JSON-serializable)
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON payload
 * @throws ApiError if data is not JSON-serializable
 */
export function successResponse<T>(
	data: T,
	status: number = 200
): NextResponse {
	try {
		return NextResponse.json(data, { status });
	} catch (error) {
		logger.error(
			`Failed to serialize success response: ${(error as Error).message}`,
			{ error }
		);
		throw new ApiError("Invalid response data: not JSON-serializable", 500);
	}
}

/**
 * Creates an error API response with a default or custom message.
 * @param error - The error object or message
 * @param defaultMessage - Default error message if error is not an ApiError (default: "Internal Server Error")
 * @returns NextResponse with JSON error payload
 */
export function errorResponse(
	error: unknown,
	defaultMessage: string = "Internal Server Error"
): NextResponse {
	if (error instanceof ApiError) {
		logger.warn(`API Error: ${error.message}`, { status: error.status });
		return NextResponse.json(
			{ error: error.message },
			{ status: error.status }
		);
	}

	logger.error(
		`Unexpected Error: ${
			error instanceof Error ? error.message : String(error)
		}`,
		{ error }
	);
	return NextResponse.json({ error: defaultMessage }, { status: 500 });
}

/**
 * Checks if a session is authenticated and has the required role(s).
 * @param session - The NextAuth session object
 * @param allowedRoles - Array of allowed roles (e.g., ["ADMIN", "TEACHER"])
 * @throws ApiError if session is missing or user lacks required role
 */
export function requireAuth(
	session: Session | null,
	allowedRoles: string[]
): void {
	if (!session?.user || !allowedRoles.includes(session.user.role)) {
		throw new ApiError("Unauthorized", 403);
	}

	// Validate allowedRoles to ensure they are non-empty strings
	if (
		!allowedRoles.every((role) => typeof role === "string" && role.length > 0)
	) {
		throw new ApiError("Invalid roles specified", 500);
	}
}
