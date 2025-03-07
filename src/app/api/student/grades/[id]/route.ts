import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getGradeById,
  updateGrade,
  deleteGrade,
} from "@/lib/services/gradeService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const grade = await getGradeById(params.id);
    return NextResponse.json(grade, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch grade: ${error}`);
    return NextResponse.json(
      { error: "Grade retrieval failed" },
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
    const grade = await updateGrade(params.id, body);
    return NextResponse.json(grade, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update grade: ${error}`);
    return NextResponse.json({ error: "Grade update failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    await deleteGrade(params.id);
    return NextResponse.json(
      { message: "Grade deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete grade: ${error}`);
    return NextResponse.json(
      { error: "Grade deletion failed" },
      { status: 400 },
    );
  }
}
