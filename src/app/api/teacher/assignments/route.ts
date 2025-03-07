import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleAssignments,
  createAssignment,
  getAllAssignments,
} from "@/lib/services/assignmentService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { assignments, total } = await getAllAssignments(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        assignments,
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
    logger.error(`Failed to fetch assignments: ${error}`);
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
      const result = await createMultipleAssignments(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const assignment = await createAssignment(body);
      return NextResponse.json(assignment, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create assignment(s): ${error}`);
    return NextResponse.json(
      { error: "Assignment creation failed" },
      { status: 400 },
    );
  }
}
