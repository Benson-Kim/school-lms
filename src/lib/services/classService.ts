import { prisma } from "@/lib/db/prisma";
import {
	classSchema,
	bulkClassSchema,
	ClassData,
	BulkOperationResult,
} from "@/lib/validation/classSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Class, Prisma } from "@prisma/client";

export async function createClass(data: ClassData): Promise<Class> {
	try {
		const parsedData = classSchema.parse(data);
		const _class = await prisma.class.create({ data: parsedData });
		logger.info(`Created class ${_class.id}: ${_class.name || _class.id}`);
		return _class;
	} catch (error) {
		logger.error(`Failed to create class: ${error}`);
		throw new ApiError(`Class creation failed: ${error}`, 400);
	}
}

export async function createMultipleClasss(
	courses: ClassData[]
): Promise<BulkOperationResult> {
	bulkClassSchema.parse(courses);

	const result: BulkOperationResult = { succeeded: [], failed: [] };

	for (const classData of courses) {
		try {
			const createdClass = await createClass(classData);
			result.succeeded.push(createdClass);
		} catch (error) {
			result.failed.push({
				data: classData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function updateClass(id: string, data: ClassData): Promise<Class> {
	try {
		const parsedData = classSchema.parse(data);
		const _class = await prisma.class.update({
			where: { id },
			data: parsedData,
		});
		logger.info(`Updated class ${_class.id}: ${_class.name || _class.id}`);
		return _class;
	} catch (error) {
		logger.error(`Failed to update class ${id}: ${error}`);
		throw new ApiError(`Class update failed: ${error}`, 400);
	}
}

export async function updateMultipleClasss(
	courses: (ClassData & { id: string })[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = { succeeded: [], failed: [] };

	for (const classData of courses) {
		try {
			const updatedClass = await updateClass(classData.id, classData);
			result.succeeded.push(updatedClass);
		} catch (error) {
			result.failed.push({
				data: classData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function deleteClass(id: string): Promise<void> {
	try {
		await prisma.class.delete({ where: { id } });
		logger.info(`Deleted class ${id}`);
	} catch (error) {
		logger.error(`Failed to delete class ${id}: ${error}`);
		throw new ApiError(`Class deletion failed: ${error}`, 400);
	}
}

export async function deleteMultipleClasss(
	ids: string[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = { succeeded: [], failed: [] };

	for (const id of ids) {
		try {
			const deletedClass = await prisma.class.delete({ where: { id } });
			result.succeeded.push(deletedClass);
		} catch (error) {
			result.failed.push({
				data: { id } as Prisma.ClassCreateInput,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function getClassById(id: string): Promise<Class> {
	try {
		const _class = await prisma.class.findUniqueOrThrow({ where: { id } });
		return _class;
	} catch (error) {
		logger.error(`Failed to retrieve class ${id}: ${error}`);
		throw new ApiError(`Class retrieval failed: ${error}`, 404);
	}
}

export async function getAllClasss(
	page = 1,
	pageSize = 10,
	searchTerm = ""
): Promise<{ courses: Class[]; total: number }> {
	try {
		const where: Prisma.ClassWhereInput = searchTerm
			? {
					OR: [
						{ name: { contains: searchTerm, mode: "insensitive" } },
						// Add additional searchable fields here based on entity
					],
			  }
			: {};

		const [courses, total] = await Promise.all([
			prisma.class.findMany({
				where,
				skip: (page - 1) * pageSize,
				take: pageSize,
				orderBy: { name: "asc" },
			}),
			prisma.class.count({ where }),
		]);

		return { courses, total };
	} catch (error) {
		logger.error(`Failed to retrieve courses: ${error}`);
		throw new ApiError(`Classs retrieval failed: ${error}`, 500);
	}
}
