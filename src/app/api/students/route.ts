import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]); // Only allow admins

    const students = await prisma.student.findMany({
      select: {
        studentId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch students: ${(error as Error).message}`, {
      error,
    });
    return new ApiError(
      error instanceof ApiError ? error.message : "Internal Server Error",
      error instanceof ApiError ? error.status : 500,
    );
  }
}
