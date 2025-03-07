import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  createMultiplePayments,
  updateMultiplePayments,
  deleteMultiplePayments,
} from "@/lib/services/paymentService";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const payments = await req.json();
    const result = await updateMultiplePayments(payments);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to update multiple payments: ${error}`);
    return NextResponse.json(
      { error: "Bulk payment update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const { ids } = await req.json();
    const result = await deleteMultiplePayments(ids);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 200,
    });
  } catch (error) {
    logger.error(`Failed to delete multiple payments: ${error}`);
    return NextResponse.json(
      { error: "Bulk payment deletion failed" },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const payments = await req.json();
    const result = await createMultiplePayments(payments);
    return NextResponse.json(result, {
      status: result.failed.length > 0 ? 206 : 201,
    });
  } catch (error) {
    logger.error(`Failed to create multiple payments: ${error}`);
    return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
  }
}
