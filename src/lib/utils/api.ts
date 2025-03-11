//src/lib/utils/api.ts
import { NextResponse } from "next/server";
import logger from "./logger";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
  }
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  error: unknown,
  defaultMessage: string = "Internal Server Error",
) {
  if (error instanceof ApiError) {
    logger.warn(`API Error: ${error.message}`, { status: error.status });
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  logger.error(
    `Unexpected Error: ${(error as Error)?.message || String(error)}`,
    { error },
  );
  return NextResponse.json({ error: defaultMessage }, { status: 500 });
}

export function requireAuth(session: any, allowedRoles: string[]) {
  if (!session || !allowedRoles.includes(session.user.role)) {
    throw new ApiError("Unauthorized", 403);
  }
}
