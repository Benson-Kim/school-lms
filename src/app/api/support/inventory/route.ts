import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleInventorys,
  createInventory,
  getAllInventorys,
} from "@/lib/services/inventoryService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { inventory, total } = await getAllInventorys(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        inventory,
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
    logger.error(`Failed to fetch inventory: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleInventorys(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const inventory = await createInventory(body);
      return NextResponse.json(inventory, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create inventory(s): ${error}`);
    return NextResponse.json(
      { error: "Inventory creation failed" },
      { status: 400 },
    );
  }
}
