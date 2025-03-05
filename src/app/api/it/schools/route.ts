// src/app/api/it/schools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

import {
	createMultipleSchools,
	createSchool,
	getAllSchools,
} from "@/lib/services/schoolService";

export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]);

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const pageSize = parseInt(searchParams.get("pageSize") || "10");
		const searchTerm = searchParams.get("search") || "";

		const { schools, total } = await getAllSchools(page, pageSize, searchTerm);

		return NextResponse.json(
			{
				schools,
				pagination: {
					currentPage: page,
					pageSize,
					totalItems: total,
					totalPages: Math.ceil(total / pageSize),
				},
			},
			{ status: 200 }
		);
	} catch (error) {
		logger.error(`Failed to fetch schools: ${error}`);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]);

		const body = await req.json();

		// Check if it's a bulk or single school creation
		if (Array.isArray(body)) {
			const result = await createMultipleSchools(body);
			return NextResponse.json(result, {
				status: result.failed.length > 0 ? 206 : 201,
			});
		} else {
			const school = await createSchool(body);
			return NextResponse.json(school, { status: 201 });
		}
	} catch (error) {
		logger.error(`Failed to create school(s): ${error}`);
		return NextResponse.json(
			{ error: "School creation failed" },
			{ status: 400 }
		);
	}
}
