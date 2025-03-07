import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getScheduleById,
  updateSchedule,
  deleteSchedule,
} from "@/lib/services/scheduleService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const schedule = await getScheduleById(params.id);
    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch schedule: ${error}`);
    return NextResponse.json(
      { error: "Schedule retrieval failed" },
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
    requireAuth(session, ["STUDENT"]);
    const body = await req.json();
    const schedule = await updateSchedule(params.id, body);
    return NextResponse.json(schedule, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update schedule: ${error}`);
    return NextResponse.json(
      { error: "Schedule update failed" },
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
    requireAuth(session, ["STUDENT"]);
    await deleteSchedule(params.id);
    return NextResponse.json(
      { message: "Schedule deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete schedule: ${error}`);
    return NextResponse.json(
      { error: "Schedule deletion failed" },
      { status: 400 },
    );
  }
}
