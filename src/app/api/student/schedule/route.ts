import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleSchedules,
  createSchedule,
  getAllSchedules,
} from "@/lib/services/scheduleService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { schedule, total } = await getAllSchedules(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        schedule,
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
    logger.error(`Failed to fetch schedule: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleSchedules(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const schedule = await createSchedule(body);
      return NextResponse.json(schedule, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create schedule(s): ${error}`);
    return NextResponse.json(
      { error: "Schedule creation failed" },
      { status: 400 },
    );
  }
}
