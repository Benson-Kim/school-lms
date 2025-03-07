import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	getClassById,
	updateClass,
	deleteClass,
} from "@/lib/services/classService";

export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["STUDENT"]);
		const _class = await getClassById(params.id);
		return NextResponse.json(_class, { status: 200 });
	} catch (error) {
		logger.error(`Failed to fetch class: ${error}`);
		return NextResponse.json(
			{ error: "Class retrieval failed" },
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
		requireAuth(session, ["STUDENT"]);
		const body = await req.json();
		const _class = await updateClass(params.id, body);
		return NextResponse.json(_class, { status: 200 });
	} catch (error) {
		logger.error(`Failed to update class: ${error}`);
		return NextResponse.json({ error: "Class update failed" }, { status: 400 });
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["STUDENT"]);
		await deleteClass(params.id);
		return NextResponse.json(
			{ message: "Class deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		logger.error(`Failed to delete class: ${error}`);
		return NextResponse.json(
			{ error: "Class deletion failed" },
			{ status: 400 }
		);
	}
}
