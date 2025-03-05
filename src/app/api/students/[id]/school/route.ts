import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/utils/api";
import { addStudentToSchool } from "@/lib/services/studentService";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

export async function POST(
	req: NextRequest,
	{ params }: { params: { studentId: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["ADMIN"]); // Only allow admins

		const { studentId } = params;
		const { schoolId } = await req.json();

		const student = await addStudentToSchool(studentId, schoolId);

		logger.info(
			`Successfully added student ${studentId} to school ${schoolId}`
		);
		return NextResponse.json(
			{ student, message: "Student added to school successfully" },
			{ status: 200 }
		);
	} catch (error) {
		logger.error(
			`Failed to add student to school: ${(error as Error).message}`,
			{ error }
		);
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}
