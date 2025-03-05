import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { validate } from "@/lib/utils/validation";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { School, Department, AcademicYear, Staff } from "@prisma/client";
import { schoolSchema } from "../validation/schoolSchema";

interface SchoolData {
	name: string;
	address: string;
	city?: string;
	state?: string;
	zipCode?: string;
	country?: string;
	phone?: string;
	email?: string;
	website?: string;
	contactInfo?: string;
}

/**
 * Creates a new school.
 * @param data - School data conforming to schoolSchema
 * @returns Created school object
 * @throws ApiError for validation or database errors
 */
export async function createSchool(data: SchoolData): Promise<School> {
	try {
		const parsedData = validate(schoolSchema, data);
		const school = await prisma.school.create({
			data: {
				name: parsedData.name,
				address: parsedData.address,
				city: parsedData.city,
				state: parsedData.state,
				zipCode: parsedData.zipCode,
				country: parsedData.country,
				phone: parsedData.phone,
				email: parsedData.email,
				website: parsedData.website,
				contactInfo: parsedData.contactInfo,
			},
		});

		logger.info(`Created school ${school.id}: ${school.name}`);
		return school;
	} catch (error) {
		logger.error(`Failed to create school: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to create school: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Updates an existing school.
 * @param id - School ID
 * @param data - Updated school data
 * @returns Updated school object
 * @throws ApiError if school not found or database error occurs
 */
export async function updateSchool(
	id: string,
	data: SchoolData
): Promise<School> {
	try {
		const parsedData = validate(schoolSchema, data);
		const school = await prisma.school.update({
			where: { id },
			data: {
				name: parsedData.name,
				address: parsedData.address,
				city: parsedData.city,
				state: parsedData.state,
				zipCode: parsedData.zipCode,
				country: parsedData.country,
				phone: parsedData.phone,
				email: parsedData.email,
				website: parsedData.website,
				contactInfo: parsedData.contactInfo,
			},
		});

		logger.info(`Updated school ${school.id}: ${school.name}`);
		return school;
	} catch (error) {
		logger.error(`Failed to update school ${id}: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to update school: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Deletes a school.
 * @param id - School ID
 * @throws ApiError if school not found or database error occurs
 */
export async function deleteSchool(id: string): Promise<void> {
	try {
		await prisma.school.delete({ where: { id } });
		logger.info(`Deleted school ${id}`);
	} catch (error) {
		logger.error(`Failed to delete school ${id}: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to delete school: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Gets all schools.
 * @returns Array of schools
 * @throws ApiError for database errors
 */
export async function getSchools(): Promise<School[]> {
	try {
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
				contactInfo: true,
			},
		});
		return schools;
	} catch (error) {
		logger.error(`Failed to fetch schools: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to fetch schools: ${(error as Error).message}`,
			500
		);
	}
}
