// src/app/api/it/schools/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import {
	createMultipleSchools,
	updateMultipleSchools,
	deleteMultipleSchools,
} from "@/lib/services/schoolService";

// src/app/api/it/schools/bulk/route.ts
export async function PUT(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]);

		const schools = await req.json();
		const result = await updateMultipleSchools(schools);

		return NextResponse.json(result, {
			status: result.failed.length > 0 ? 206 : 200,
		});
	} catch (error) {
		logger.error(`Failed to update multiple schools: ${error}`);
		return NextResponse.json(
			{ error: "Bulk school update failed" },
			{ status: 400 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]);

		const { ids } = await req.json();
		const result = await deleteMultipleSchools(ids);

		return NextResponse.json(result, {
			status: result.failed.length > 0 ? 206 : 200,
		});
	} catch (error) {
		logger.error(`Failed to delete multiple schools: ${error}`);
		return NextResponse.json(
			{ error: "Bulk school deletion failed" },
			{ status: 400 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const schools = await req.json();
		const result = await createMultipleSchools(schools);
		return NextResponse.json(result, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: "Bulk import failed" }, { status: 400 });
	}
}
