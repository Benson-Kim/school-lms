import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleMaintenances,
  updateMultipleMaintenances,
  deleteMultipleMaintenances,
} from "@/lib/services/maintenanceService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const maintenance = await req.json();
    const result = await updateMultipleMaintenances(maintenance);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple maintenance: ${error}`);
    return NextResponse.json(
      { error: "Bulk maintenance update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const { ids } = await req.json();
    const result = await deleteMultipleMaintenances(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple maintenance: ${error}`);
    return NextResponse.json(
      { error: "Bulk maintenance deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const maintenance = await req.json();
    const result = await createMultipleMaintenances(maintenance);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple maintenance: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
