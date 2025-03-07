import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getEventById,
  updateEvent,
  deleteEvent,
} from "@/lib/services/eventService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const event = await getEventById(params.id);
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch event: ${error}`);
    return NextResponse.json(
      { error: "Event retrieval failed" },
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
    requireAuth(session, ["PARENT"]);
    const body = await req.json();
    const event = await updateEvent(params.id, body);
    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update event: ${error}`);
    return NextResponse.json({ error: "Event update failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    await deleteEvent(params.id);
    return NextResponse.json(
      { message: "Event deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete event: ${error}`);
    return NextResponse.json(
      { error: "Event deletion failed" },
      { status: 400 },
    );
  }
}
