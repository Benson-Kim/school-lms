import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleAttendances,
  createAttendance,
  getAllAttendances,
} from "@/lib/services/attendanceService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { attendance, total } = await getAllAttendances(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        attendance,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems: total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to fetch attendance: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleAttendances(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const attendance = await createAttendance(body);
      return NextResponse.json(attendance, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create attendance(s): ${error}`);
    return NextResponse.json(
      { error: "Attendance creation failed" },
      { status: 400 },
    );
  }
}
