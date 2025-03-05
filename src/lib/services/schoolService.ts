// src/services/schoolService.ts
import { prisma } from "@/lib/db/prisma";
import {
	schoolSchema,
	bulkSchoolSchema,
	SchoolData,
	BulkOperationResult,
} from "@/lib/validation/schoolSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { School, Prisma } from "@prisma/client";

export async function createSchool(data: SchoolData): Promise<School> {
	try {
		const parsedData = schoolSchema.parse(data);
		const school = await prisma.school.create({ data: parsedData });
		logger.info(`Created school ${school.id}: ${school.name}`);
		return school;
	} catch (error) {
		logger.error(`Failed to create school: ${error}`);
		throw new ApiError(`School creation failed: ${error}`, 400);
	}
}

export async function createMultipleSchools(
	schools: SchoolData[]
): Promise<BulkOperationResult> {
	bulkSchoolSchema.parse(schools);

	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const schoolData of schools) {
		try {
			const createdSchool = await createSchool(schoolData);
			result.succeeded.push(createdSchool);
		} catch (error) {
			result.failed.push({
				data: schoolData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function updateSchool(
	id: string,
	data: SchoolData
): Promise<School> {
	try {
		const parsedData = schoolSchema.parse(data);
		const school = await prisma.school.update({
			where: { id },
			data: parsedData,
		});
		logger.info(`Updated school ${school.id}: ${school.name}`);
		return school;
	} catch (error) {
		logger.error(`Failed to update school ${id}: ${error}`);
		throw new ApiError(`School update failed: ${error}`, 400);
	}
}

export async function updateMultipleSchools(
	schools: (SchoolData & { id: string })[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const schoolData of schools) {
		try {
			const updatedSchool = await updateSchool(schoolData.id, schoolData);
			result.succeeded.push(updatedSchool);
		} catch (error) {
			result.failed.push({
				data: schoolData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function deleteSchool(id: string): Promise<void> {
	try {
		await prisma.school.delete({ where: { id } });
		logger.info(`Deleted school ${id}`);
	} catch (error) {
		logger.error(`Failed to delete school ${id}: ${error}`);
		throw new ApiError(`School deletion failed: ${error}`, 400);
	}
}

export async function deleteMultipleSchools(
	ids: string[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const id of ids) {
		try {
			const deletedSchool = await prisma.school.delete({ where: { id } });
			result.succeeded.push(deletedSchool);
		} catch (error) {
			result.failed.push({
				data: { id } as Prisma.SchoolCreateInput,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function getSchoolById(id: string): Promise<School> {
	try {
		const school = await prisma.school.findUniqueOrThrow({ where: { id } });
		return school;
	} catch (error) {
		logger.error(`Failed to retrieve school ${id}: ${error}`);
		throw new ApiError(`School retrieval failed: ${error}`, 404);
	}
}

export async function getAllSchools(
	page = 1,
	pageSize = 10,
	searchTerm = ""
): Promise<{ schools: School[]; total: number }> {
	try {
		const where: Prisma.SchoolWhereInput = searchTerm
			? {
					OR: [
						{ name: { contains: searchTerm, mode: "insensitive" } },
						{ city: { contains: searchTerm, mode: "insensitive" } },
						{ country: { contains: searchTerm, mode: "insensitive" } },
					],
			  }
			: {};

		const [schools, total] = await Promise.all([
			prisma.school.findMany({
				where,
				skip: (page - 1) * pageSize,
				take: pageSize,
				orderBy: { name: "asc" },
			}),
			prisma.school.count({ where }),
		]);

		return { schools, total };
	} catch (error) {
		logger.error(`Failed to retrieve schools: ${error}`);
		throw new ApiError(`Schools retrieval failed: ${error}`, 500);
	}
}
