// src/app/api/it/schools/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	getSchoolById,
	updateSchool,
	deleteSchool,
} from "@/lib/services/schoolService";

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]);

		const school = await getSchoolById(params.id);
		return NextResponse.json(school, { status: 200 });
	} catch (error) {
		logger.error(`Failed to fetch school: ${error}`);
		return NextResponse.json(
			{ error: "School retrieval failed" },
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
		requireAuth(session, ["IT"]);

		const body = await req.json();
		const school = await updateSchool(params.id, body);
		return NextResponse.json(school, { status: 200 });
	} catch (error) {
		logger.error(`Failed to update school: ${error}`);
		return NextResponse.json(
			{ error: "School update failed" },
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
		requireAuth(session, ["IT"]);

		await deleteSchool(params.id);
		return NextResponse.json(
			{ message: "School deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		logger.error(`Failed to delete school: ${error}`);
		return NextResponse.json(
			{ error: "School deletion failed" },
			{ status: 400 }
		);
	}
}
