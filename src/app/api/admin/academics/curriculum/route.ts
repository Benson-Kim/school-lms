// src/app/api/admin/academics/curriculum/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

import {
	createCurriculum,
	createMultipleCurricula,
	getAllCurricula,
} from "@/lib/services/curriculumService";

export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN"]);

		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const pageSize = parseInt(searchParams.get("pageSize") || "10");
		const searchTerm = searchParams.get("search") || "";

		const { curricula, total } = await getAllCurricula(
			page,
			pageSize,
			searchTerm
		);

		return NextResponse.json(
			{
				curricula,
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
		logger.error(`Failed to fetch curriculums: ${error}`);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const body = await req.json();

		// Check if it's a bulk or single curriculum creation
		if (Array.isArray(body)) {
			const result = await createMultipleCurricula(body);
			return NextResponse.json(result, {
				status: result.failed.length > 0 ? 206 : 201,
			});
		} else {
			const curriculum = await createCurriculum(body);
			return NextResponse.json(curriculum, { status: 201 });
		}
	} catch (error) {
		logger.error(`Failed to create curriculum(s): ${error}`);
		return NextResponse.json(
			{ error: "Curriculum creation failed" },
			{ status: 400 }
		);
	}
}
