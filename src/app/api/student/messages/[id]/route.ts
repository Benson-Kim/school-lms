import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getMessageById,
  updateMessage,
  deleteMessage,
} from "@/lib/services/messageService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const message = await getMessageById(params.id);
    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch message: ${error}`);
    return NextResponse.json(
      { error: "Message retrieval failed" },
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
    const message = await updateMessage(params.id, body);
    return NextResponse.json(message, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update message: ${error}`);
    return NextResponse.json(
      { error: "Message update failed" },
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
    requireAuth(session, ["STUDENT"]);
    await deleteMessage(params.id);
    return NextResponse.json(
      { message: "Message deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete message: ${error}`);
    return NextResponse.json(
      { error: "Message deletion failed" },
      { status: 400 },
    );
  }
}
