import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	createMultipleClasss,
	createClass,
	getAllClasss,
} from "@/lib/services/classService";

export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["STUDENT"]);
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const pageSize = parseInt(searchParams.get("pageSize") || "10");
		const searchTerm = searchParams.get("search") || "";
		const { courses, total } = await getAllClasss(page, pageSize, searchTerm);
		return NextResponse.json(
			{
				courses,
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
		logger.error(`Failed to fetch courses: ${error}`);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["STUDENT"]);
		const body = await req.json();
		if (Array.isArray(body)) {
			const result = await createMultipleClasss(body);
			return NextResponse.json(result, {
				status: result.failed.length > 0 ? 206 : 201,
			});
		} else {
			const _class = await createClass(body);
			return NextResponse.json(_class, { status: 201 });
		}
	} catch (error) {
		logger.error(`Failed to create class(s): ${error}`);
		return NextResponse.json(
			{ error: "Class creation failed" },
			{ status: 400 }
		);
	}
}
