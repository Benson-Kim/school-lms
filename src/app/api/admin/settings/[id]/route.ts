import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
  getSettingById,
  updateSetting,
  deleteSetting,
} from "@/lib/services/settingService";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    requireAuth(session, ["ADMIN"]);
    const setting = await getSettingById(params.id);
    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    logger.error(`Failed to fetch setting: ${error}`);
    return NextResponse.json(
      { error: "Setting retrieval failed" },
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
    const setting = await updateSetting(params.id, body);
    return NextResponse.json(setting, { status: 200 });
  } catch (error) {
    logger.error(`Failed to update setting: ${error}`);
    return NextResponse.json(
      { error: "Setting update failed" },
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
    await deleteSetting(params.id);
    return NextResponse.json(
      { message: "Setting deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    logger.error(`Failed to delete setting: ${error}`);
    return NextResponse.json(
      { error: "Setting deletion failed" },
      { status: 400 },
    );
  }
}
