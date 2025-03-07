import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getReportById,
  updateReport,
  deleteReport,
} from "@/lib/services/reportService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    const report = await getReportById(params.id);
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch report: ${error}`);
    return NextResponse.json(
      { error: "Report retrieval failed" },
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
    requireAuth(session, ["ADMIN"]);
    const body = await req.json();
    const report = await updateReport(params.id, body);
    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update report: ${error}`);
    return NextResponse.json(
      { error: "Report update failed" },
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
    requireAuth(session, ["ADMIN"]);
    await deleteReport(params.id);
    return NextResponse.json(
      { message: "Report deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete report: ${error}`);
    return NextResponse.json(
      { error: "Report deletion failed" },
      { status: 400 },
    );
  }
}
