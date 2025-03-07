import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleIntegrations,
  updateMultipleIntegrations,
  deleteMultipleIntegrations,
} from "@/lib/services/integrationService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const integrations = await req.json();
    const result = await updateMultipleIntegrations(integrations);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple integrations: ${error}`);
    return NextResponse.json(
      { error: "Bulk integration update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const { ids } = await req.json();
    const result = await deleteMultipleIntegrations(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple integrations: ${error}`);
    return NextResponse.json(
      { error: "Bulk integration deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["IT"]);
    const integrations = await req.json();
    const result = await createMultipleIntegrations(integrations);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple integrations: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
