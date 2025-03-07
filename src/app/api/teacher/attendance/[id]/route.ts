import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "@/lib/services/attendanceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const attendance = await getAttendanceById(params.id);
    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch attendance: ${error}`);
    return NextResponse.json(
      { error: "Attendance retrieval failed" },
      { status: 404 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const body = await req.json();
    const attendance = await updateAttendance(params.id, body);
    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update attendance: ${error}`);
    return NextResponse.json(
      { error: "Attendance update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    await deleteAttendance(params.id);
    return NextResponse.json(
      { message: "Attendance deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete attendance: ${error}`);
    return NextResponse.json(
      { error: "Attendance deletion failed" },
      { status: 400 },
    );
  }
}
