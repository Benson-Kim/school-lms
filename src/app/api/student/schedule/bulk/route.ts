import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleSchedules,
  updateMultipleSchedules,
  deleteMultipleSchedules,
} from "@/lib/services/scheduleService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const schedule = await req.json();
    const result = await updateMultipleSchedules(schedule);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple schedule: ${error}`);
    return NextResponse.json(
      { error: "Bulk schedule update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const { ids } = await req.json();
    const result = await deleteMultipleSchedules(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple schedule: ${error}`);
    return NextResponse.json(
      { error: "Bulk schedule deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const schedule = await req.json();
    const result = await createMultipleSchedules(schedule);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple schedule: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
