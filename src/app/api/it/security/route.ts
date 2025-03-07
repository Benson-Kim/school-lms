import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleSecuritys,
  createSecurity,
  getAllSecuritys,
} from "@/lib/services/securityService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { security, total } = await getAllSecuritys(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        security,
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
    logger.error(`Failed to fetch security: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleSecuritys(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const security = await createSecurity(body);
      return NextResponse.json(security, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create security(s): ${error}`);
    return NextResponse.json(
      { error: "Security creation failed" },
      { status: 400 },
    );
  }
}
