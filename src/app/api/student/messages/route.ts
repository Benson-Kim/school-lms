import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleMessages,
  createMessage,
  getAllMessages,
} from "@/lib/services/messageService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { messages, total } = await getAllMessages(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        messages,
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
    logger.error(`Failed to fetch messages: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["STUDENT"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleMessages(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const message = await createMessage(body);
      return NextResponse.json(message, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create message(s): ${error}`);
    return NextResponse.json(
      { error: "Message creation failed" },
      { status: 400 },
    );
  }
}
