import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT

		return NextResponse.json(
			{ message: "Security settings retrieved" },
			{ status: 200 }
		);
	} catch (error) {
		logger.error(
			`Failed to fetch security settings: ${(error as Error).message}`,
			{ error }
		);
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}
