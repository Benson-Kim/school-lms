import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleStudents,
  createStudent,
  getAllStudents,
} from "@/lib/services/studentService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["TEACHER"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { students, total } = await getAllStudents(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        students,
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
    logger.error(`Failed to fetch students: ${error}`);
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
      const result = await createMultipleStudents(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const student = await createStudent(body);
      return NextResponse.json(student, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create student(s): ${error}`);
    return NextResponse.json(
      { error: "Student creation failed" },
      { status: 400 },
    );
  }
}
