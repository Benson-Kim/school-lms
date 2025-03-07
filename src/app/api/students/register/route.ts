import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { registerStudent } from "@/lib/services/studentService";
import { successResponse, errorResponse, requireAuth } from "@/lib/utils/api";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);

    const formData = await req.formData();
    const student = await registerStudent(formData);

    return successResponse({ student }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
