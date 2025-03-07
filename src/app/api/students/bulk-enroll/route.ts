import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { bulkEnrollStudents } from "@/lib/services/studentService";
import { successResponse, errorResponse, requireAuth } from "@/lib/utils/api";
import { validate } from "@/lib/utils/validation";
import { authOptions } from "@/lib/auth";
import { bulkEnrollSchema } from "@/lib/validation/studentSchema";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);

    const data = await req.json();
    const parsedData = validate(bulkEnrollSchema, data);
    const students = await bulkEnrollStudents(parsedData);

    return successResponse({ students }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
