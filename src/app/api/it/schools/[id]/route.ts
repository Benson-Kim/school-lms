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

// GET a specific school by ID
export async function GET(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT users

		const { id } = params;

		logger.info(`Fetching school with ID: ${id}`);

		const school = await prisma.school.findUnique({
			where: { id },
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

		if (!school) {
			logger.error(`School not found with ID: ${id}`);
			return new ApiError("School not found", 404);
		}

		logger.info(`Retrieved school ${school.id}: ${school.name}`);
		return NextResponse.json(school, { status: 200 });
	} catch (error) {
		logger.error(`Failed to fetch school: ${(error as Error).message}`, {
			error,
		});
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}

// PUT (update) a specific school by ID
export async function PUT(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT users

		const { id } = params;
		const body = (await req.json()) as SchoolData;

		logger.info(`Updating school with ID: ${id}`, { body });

		const school = await prisma.school.update({
			where: { id },
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
				updatedAt: new Date(), // Update the timestamp
			},
		});

		logger.info(`Updated school ${school.id}: ${school.name}`);
		return NextResponse.json(
			{ school, message: "School updated successfully" },
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof Error && error.message.includes("RecordNotFound")) {
			logger.error(`School not found with ID: ${params.id}`, { error });
			return new ApiError("School not found", 404);
		}
		logger.error(`Failed to update school: ${(error as Error).message}`, {
			error,
		});
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}

// DELETE a specific school by ID
export async function DELETE(
	req: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const session = await getServerSession(authOptions);
		requireAuth(session, ["IT"]); // Only allow IT users

		const { id } = params;

		logger.info(`Deleting school with ID: ${id}`);

		await prisma.school.delete({
			where: { id },
		});

		logger.info(`Deleted school ${id}`);
		return NextResponse.json(
			{ message: "School deleted successfully" },
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof Error && error.message.includes("RecordNotFound")) {
			logger.error(`School not found with ID: ${params.id}`, { error });
			return new ApiError("School not found", 404);
		}
		logger.error(`Failed to delete school: ${(error as Error).message}`, {
			error,
		});
		return new ApiError(
			error instanceof ApiError ? error.message : "Internal Server Error",
			error instanceof ApiError ? error.status : 500
		);
	}
}
