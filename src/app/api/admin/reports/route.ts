import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultipleReports,
  createReport,
  getAllReports,
} from "@/lib/services/reportService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const searchTerm = searchParams.get("search") || "";
    const { reports, total } = await getAllReports(page, pageSize, searchTerm);
    return NextResponse.json(
      {
        reports,
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
    logger.error(`Failed to fetch reports: ${error}`);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    const body = await req.json();
    if (Array.isArray(body)) {
      const result = await createMultipleReports(body);
      return NextResponse.json(result, {
        status: result.failed.length > 0 ? 206 : 201,
      });
    } else {
      const report = await createReport(body);
      return NextResponse.json(report, { status: 201 });
    }
  } catch (error) {
    logger.error(`Failed to create report(s): ${error}`);
    return NextResponse.json(
      { error: "Report creation failed" },
      { status: 400 },
    );
  }
}
