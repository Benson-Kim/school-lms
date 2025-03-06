// src/app/api/it/schools/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	getCurriculumById,
	updateCurriculum,
	deleteCurriculum,
} from "@/lib/services/curriculumService";

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const curriculum = await getCurriculumById(params.id);
		return NextResponse.json(curriculum, { status: 200 });
	} catch (error) {
		logger.error(`Failed to fetch curriculum: ${error}`);
		return NextResponse.json(
			{ error: "Curriculum retrieval failed" },
			{ status: 404 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		const body = await req.json();
		const curriculum = await updateCurriculum(params.id, body);
		return NextResponse.json(curriculum, { status: 200 });
	} catch (error) {
		logger.error(`Failed to update curriculum: ${error}`);
		return NextResponse.json(
			{ error: "Curriculum update failed" },
			{ status: 400 }
		);
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT", "ADMIN", "TEACHER"]);

		await deleteCurriculum(params.id);
		return NextResponse.json(
			{ message: "Curriculum deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		logger.error(`Failed to delete curriculum: ${error}`);
		return NextResponse.json(
			{ error: "Curriculum deletion failed" },
			{ status: 400 }
		);
	}
}
