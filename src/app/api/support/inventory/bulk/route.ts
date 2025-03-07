import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleInventorys,
  updateMultipleInventorys,
  deleteMultipleInventorys,
} from "@/lib/services/inventoryService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const inventory = await req.json();
    const result = await updateMultipleInventorys(inventory);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple inventory: ${error}`);
    return NextResponse.json(
      { error: "Bulk inventory update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const { ids } = await req.json();
    const result = await deleteMultipleInventorys(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple inventory: ${error}`);
    return NextResponse.json(
      { error: "Bulk inventory deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const inventory = await req.json();
    const result = await createMultipleInventorys(inventory);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple inventory: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
