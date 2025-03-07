import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import {
  successResponse,
  errorResponse,
  requireAuth,
  ApiError,
} from "@/lib/utils/api";
import { z } from "zod";
import { authOptions } from "@/lib/auth";

const updateStatusSchema = z.object({
  admissionStatus: z.enum(["PENDING", "APPROVED", "REJECTED", "ENROLLED"]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);

    const data = await req.json();
    const parsedData = updateStatusSchema.parse(data);

    const student = await prisma.student.update({
      where: { id: params.id },
      data: { admissionStatus: parsedData.admissionStatus },
    });

    return successResponse({ student });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN", "TEACHER"]);

    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: { user: true, documents: true },
    });

    if (!student) throw new ApiError("Student not found", 404);

    return successResponse({ student });
  } catch (error) {
    return errorResponse(error);
  }
}
