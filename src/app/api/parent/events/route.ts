import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleEvents,
  createEvent,
  getAllEvents,
} from "@/lib/services/eventService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { events, total } = await getAllEvents(page, pageSize, searchTerm);
    return NextResponse.json(
      {
        events,
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
    logger.error(`Failed to fetch events: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleEvents(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const event = await createEvent(body);
      return NextResponse.json(event, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create event(s): ${error}`);
    return NextResponse.json(
      { error: "Event creation failed" },
      { status: 400 },
    );
  }
}
