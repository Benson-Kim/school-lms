import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getIntegrationById,
  updateIntegration,
  deleteIntegration,
} from "@/lib/services/integrationService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const integration = await getIntegrationById(params.id);
    return NextResponse.json(integration, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch integration: ${error}`);
    return NextResponse.json(
      { error: "Integration retrieval failed" },
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
    const integration = await updateIntegration(params.id, body);
    return NextResponse.json(integration, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update integration: ${error}`);
    return NextResponse.json(
      { error: "Integration update failed" },
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
    await deleteIntegration(params.id);
    return NextResponse.json(
      { message: "Integration deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete integration: ${error}`);
    return NextResponse.json(
      { error: "Integration deletion failed" },
      { status: 400 },
    );
  }
}
