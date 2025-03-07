import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

// Define the dashboard data structure for admins
interface AdminDashboardData {
  totalStudents: number;
  activeClasses: number;
  pendingAdmissions: number;
  recentRegistrations: {
    studentId: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
  }[];
}

export async function GET(req: NextRequest) {
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]); // Only allow admins

    const dashboardData: AdminDashboardData = {
      totalStudents: await prisma.student.count(),
      activeClasses: await prisma.class.count({ where: { active: true } }),
      pendingAdmissions: await prisma.student.count({
        where: { admissionStatus: "PENDING" },
      }),
      recentRegistrations: await prisma.student
        .findMany({
          select: {
            studentId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Show the 5 most recent registrations
        })
        .then((students) =>
          students.map((student) => ({
            studentId: student.studentId,
            firstName: student.user.firstName,
            lastName: student.user.lastName,
            createdAt: student.createdAt,
          })),
        ),
    };

    return NextResponse.json(dashboardData, { status: 200 });
  } catch (error) {
    logger.error(`Admin dashboard error: ${(error as Error).message}`, {
      error,
    });
    return new ApiError(
      error instanceof ApiError ? error.message : "Internal Server Error",
      error instanceof ApiError ? error.status : 500,
    );
  }
}
