import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleClasss,
  updateMultipleClasss,
  deleteMultipleClasss,
} from "@/lib/services/classService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const courses = await req.json();
    const result = await updateMultipleClasss(courses);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple courses: ${error}`);
    return NextResponse.json(
      { error: "Bulk class update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const { ids } = await req.json();
    const result = await deleteMultipleClasss(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple courses: ${error}`);
    return NextResponse.json(
      { error: "Bulk class deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const courses = await req.json();
    const result = await createMultipleClasss(courses);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple courses: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
