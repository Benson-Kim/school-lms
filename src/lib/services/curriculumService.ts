import { prisma } from "@/lib/db/prisma";
import {
	curriculumSchema,
	bulkCurriculumSchema,
	CurriculumData,
	BulkOperationResult,
} from "@/lib/validation/curriculumSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Curriculum, Prisma } from "@prisma/client";
import { addToSyncQueue } from "./syncService";

export async function createCurriculum(
	data: CurriculumData
): Promise<Curriculum> {
	try {
		const parsedData = curriculumSchema.parse(data);
		const curriculum = await prisma.curriculum.create({ data: parsedData });
		logger.info(`Created curriculum ${curriculum.id}: ${curriculum.name}`);
		return curriculum;
	} catch (error) {
		logger.error(`Failed to create curriculum: ${error}`);
		throw new ApiError(`curriculum creation failed: ${error}`, 400);
	}
}

export async function createMultipleCurricula(
	curricula: CurriculumData[]
): Promise<BulkOperationResult> {
	bulkCurriculumSchema.parse(curricula);

	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const curriculumData of curricula) {
		try {
			const createdCurriculum = await createCurriculum(curriculumData);
			result.succeeded.push(createdCurriculum);
		} catch (error) {
			result.failed.push({
				data: curriculumData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function updateCurriculum(
	id: string,
	data: CurriculumData
): Promise<Curriculum> {
	try {
		const parsedData = curriculumSchema.parse(data);
		const curriculum = await prisma.curriculum.update({
			where: { id },
			data: parsedData,
		});
		logger.info(`Updated curriculum ${curriculum.id}: ${curriculum.name}`);
		return curriculum;
	} catch (error) {
		logger.error(`Failed to update curriculum ${id}: ${error}`);
		throw new ApiError(`Curriculum update failed: ${error}`, 400);
	}
}

export async function updateMultipleCurricula(
	curricula: (CurriculumData & { id: string })[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const curriculumData of curricula) {
		try {
			const updatedCurriculum = await updateCurriculum(
				curriculumData.id,
				curriculumData
			);
			result.succeeded.push(updatedCurriculum);
		} catch (error) {
			result.failed.push({
				data: curriculumData,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function deleteCurriculum(id: string): Promise<void> {
	try {
		await prisma.curriculum.delete({ where: { id } });
		logger.info(`Deleted curriculum ${id}`);
	} catch (error) {
		logger.error(`Failed to delete curriculum ${id}: ${error}`);
		throw new ApiError(`Curriculum deletion failed: ${error}`, 400);
	}
}

export async function deleteMultipleCurricula(
	ids: string[]
): Promise<BulkOperationResult> {
	const result: BulkOperationResult = {
		succeeded: [],
		failed: [],
	};

	for (const id of ids) {
		try {
			const deleteCurriculum = await prisma.curriculum.delete({
				where: { id },
			});
			result.succeeded.push(deleteCurriculum);
		} catch (error) {
			result.failed.push({
				data: { id } as Prisma.CurriculumCreateInput,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return result;
}

export async function getCurriculumById(id: string): Promise<Curriculum> {
	try {
		const curriculum = await prisma.curriculum.findUniqueOrThrow({
			where: { id },
			include: { gradeLevels: true },
		});
		return curriculum;
	} catch (error) {
		logger.error(`Failed to retrieve curriculum ${id}: ${error}`);
		throw new ApiError(`Curriculum retrieval failed: ${error}`, 404);
	}
}

export async function getAllCurricula(
	page = 1,
	pageSize = 10,
	searchTerm = ""
): Promise<{ curricula: Curriculum[]; total: number }> {
	try {
		const where: Prisma.CurriculumWhereInput = searchTerm
			? {
					OR: [
						{ name: { contains: searchTerm, mode: "insensitive" } },
						{ description: { contains: searchTerm, mode: "insensitive" } },
					],
			  }
			: {};

		const [curricula, total] = await Promise.all([
			prisma.curriculum.findMany({
				where,
				skip: (page - 1) * pageSize,
				take: pageSize,
				orderBy: { name: "asc" },
				include: { gradeLevels: true },
			}),
			prisma.curriculum.count({ where }),
		]);

		return { curricula, total };
	} catch (error) {
		logger.error(`Failed to retrieve curricula: ${error}`);
		throw new ApiError(`Curricula retrieval failed: ${error}`, 500);
	}
}
