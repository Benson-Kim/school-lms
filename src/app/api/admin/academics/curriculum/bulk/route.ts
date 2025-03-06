// src/app/api/admin/academics/curriculum/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	createMultipleCurricula,
	deleteMultipleCurricula,
	updateMultipleCurricula,
} from "@/lib/services/curriculumService";
import { CurriculumData } from "@/lib/validation/curriculumSchema";

export async function PUT(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const curricula = await req.json();
		const result = await updateMultipleCurricula(curricula);

		return NextResponse.json(result, {
			status: result.failed.length > 0 ? 206 : 200,
		});
	} catch (error) {
		logger.error(`Failed to update multiple curricula: ${error}`);
		return NextResponse.json(
			{ error: "Bulk school update failed" },
			{ status: 400 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const { ids } = await req.json();
		const result = await deleteMultipleCurricula(ids);

		return NextResponse.json(result, {
			status: result.failed.length > 0 ? 206 : 200,
		});
	} catch (error) {
		logger.error(`Failed to delete multiple curricula: ${error}`);
		return NextResponse.json(
			{ error: "Bulk school deletion failed" },
			{ status: 400 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const curricula = await req.json();
		const result = await createMultipleCurricula(curricula);

		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
	}
}
