import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/utils/api";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

interface SchoolData {
	name: string;
	address: string;
	city?: string | null;
	state?: string | null;
	zipCode?: string | null;
	country: string;
	phone: string;
	email: string;
	website?: string | null;
}

export async function GET(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT users

		const schools = await prisma.school.findMany({
			select: {
				id: true,
				name: true,
				address: true,
				city: true,
				state: true,
				zipCode: true,
				country: true,
				phone: true,
				email: true,
				website: true,
			},
		});

		return NextResponse.json(schools, { status: 200 });
	} catch (error) {
		logger.error(`Failed to fetch schools: ${(error as Error).message}`, {
			error,
		});
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT users

		const body = (await req.json()) as SchoolData;
		const school = await prisma.school.create({
			data: {
				name: body.name,
				address: body.address,
				city: body.city,
				state: body.state,
				zipCode: body.zipCode,
				country: body.country,
				phone: body.phone,
				email: body.email,
				website: body.website,
			},
		});

		logger.info(`Created school ${school.id}: ${school.name}`);
		return NextResponse.json(
			{ school, message: "School created successfully" },
			{ status: 201 }
		);
	} catch (error) {
		logger.error(`Failed to create school: ${(error as Error).message}`, {
			error,
		});
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}
