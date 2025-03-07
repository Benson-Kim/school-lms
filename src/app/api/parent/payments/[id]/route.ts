import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getPaymentById,
  updatePayment,
  deletePayment,
} from "@/lib/services/paymentService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["PARENT"]);
    const payment = await getPaymentById(params.id);
    return NextResponse.json(payment, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch payment: ${error}`);
    return NextResponse.json(
      { error: "Payment retrieval failed" },
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
    requireAuth(session, ["PARENT"]);
    const body = await req.json();
    const payment = await updatePayment(params.id, body);
    return NextResponse.json(payment, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update payment: ${error}`);
    return NextResponse.json(
      { error: "Payment update failed" },
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
    requireAuth(session, ["PARENT"]);
    await deletePayment(params.id);
    return NextResponse.json(
      { message: "Payment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete payment: ${error}`);
    return NextResponse.json(
      { error: "Payment deletion failed" },
      { status: 400 },
    );
  }
}
