import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "@/lib/services/assignmentService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const assignment = await getAssignmentById(params.id);
    return NextResponse.json(assignment, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch assignment: ${error}`);
    return NextResponse.json(
      { error: "Assignment retrieval failed" },
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
    const assignment = await updateAssignment(params.id, body);
    return NextResponse.json(assignment, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update assignment: ${error}`);
    return NextResponse.json(
      { error: "Assignment update failed" },
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
    await deleteAssignment(params.id);
    return NextResponse.json(
      { message: "Assignment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete assignment: ${error}`);
    return NextResponse.json(
      { error: "Assignment deletion failed" },
      { status: 400 },
    );
  }
}
