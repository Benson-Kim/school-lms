import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
} from "@/lib/services/maintenanceService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const maintenance = await getMaintenanceById(params.id);
    return NextResponse.json(maintenance, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch maintenance: ${error}`);
    return NextResponse.json(
      { error: "Maintenance retrieval failed" },
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
    requireAuth(session, ["SUPPORT_STAFF"]);
    const body = await req.json();
    const maintenance = await updateMaintenance(params.id, body);
    return NextResponse.json(maintenance, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update maintenance: ${error}`);
    return NextResponse.json(
      { error: "Maintenance update failed" },
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
    requireAuth(session, ["SUPPORT_STAFF"]);
    await deleteMaintenance(params.id);
    return NextResponse.json(
      { message: "Maintenance deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete maintenance: ${error}`);
    return NextResponse.json(
      { error: "Maintenance deletion failed" },
      { status: 400 },
    );
  }
}
