import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "@/lib/services/userService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    const user = await getUserById(params.id);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch user: ${error}`);
    return NextResponse.json(
      { error: "User retrieval failed" },
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
    requireAuth(session, ["ADMIN"]);
    const body = await req.json();
    const user = await updateUser(params.id, body);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update user: ${error}`);
    return NextResponse.json({ error: "User update failed" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    await deleteUser(params.id);
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete user: ${error}`);
    return NextResponse.json(
      { error: "User deletion failed" },
      { status: 400 },
    );
  }
}
