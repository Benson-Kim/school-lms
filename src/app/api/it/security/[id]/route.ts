import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getSecurityById,
  updateSecurity,
  deleteSecurity,
} from "@/lib/services/securityService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const security = await getSecurityById(params.id);
    return NextResponse.json(security, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch security: ${error}`);
    return NextResponse.json(
      { error: "Security retrieval failed" },
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
    requireAuth(session, ["IT"]);
    const body = await req.json();
    const security = await updateSecurity(params.id, body);
    return NextResponse.json(security, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update security: ${error}`);
    return NextResponse.json(
      { error: "Security update failed" },
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
    requireAuth(session, ["IT"]);
    await deleteSecurity(params.id);
    return NextResponse.json(
      { message: "Security deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete security: ${error}`);
    return NextResponse.json(
      { error: "Security deletion failed" },
      { status: 400 },
    );
  }
}
