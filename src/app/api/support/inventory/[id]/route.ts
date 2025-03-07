import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getInventoryById,
  updateInventory,
  deleteInventory,
} from "@/lib/services/inventoryService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const inventory = await getInventoryById(params.id);
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch inventory: ${error}`);
    return NextResponse.json(
      { error: "Inventory retrieval failed" },
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
    const inventory = await updateInventory(params.id, body);
    return NextResponse.json(inventory, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update inventory: ${error}`);
    return NextResponse.json(
      { error: "Inventory update failed" },
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
    await deleteInventory(params.id);
    return NextResponse.json(
      { message: "Inventory deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete inventory: ${error}`);
    return NextResponse.json(
      { error: "Inventory deletion failed" },
      { status: 400 },
    );
  }
}
