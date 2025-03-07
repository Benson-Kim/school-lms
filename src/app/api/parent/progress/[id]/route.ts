import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getStudentById,
  updateStudent,
  deleteStudent,
} from "@/lib/services/studentService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const student = await getStudentById(params.id);
    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch student: ${error}`);
    return NextResponse.json(
      { error: "Student retrieval failed" },
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
    const student = await updateStudent(params.id, body);
    return NextResponse.json(student, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update student: ${error}`);
    return NextResponse.json(
      { error: "Student update failed" },
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
    requireAuth(session, ["PARENT"]);
    await deleteStudent(params.id);
    return NextResponse.json(
      { message: "Student deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete student: ${error}`);
    return NextResponse.json(
      { error: "Student deletion failed" },
      { status: 400 },
    );
  }
}
