import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleMaintenances,
  createMaintenance,
  getAllMaintenances,
} from "@/lib/services/maintenanceService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["SUPPORT_STAFF"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { maintenance, total } = await getAllMaintenances(
      page,
      pageSize,
      searchTerm,
    );
    return NextResponse.json(
      {
        maintenance,
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
    logger.error(`Failed to fetch maintenance: ${error}`);
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
      const result = await createMultipleMaintenances(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const maintenance = await createMaintenance(body);
      return NextResponse.json(maintenance, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create maintenance(s): ${error}`);
    return NextResponse.json(
      { error: "Maintenance creation failed" },
      { status: 400 },
    );
  }
}
