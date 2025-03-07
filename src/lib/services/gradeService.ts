import { prisma } from "@/lib/db/prisma";
import {
  gradeSchema,
  bulkGradeSchema,
  GradeData,
  BulkOperationResult,
} from "@/lib/validation/gradeSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Grade, Prisma } from "@prisma/client";

export async function createGrade(data: GradeData): Promise<Grade> {
  try {
    const parsedData = gradeSchema.parse(data);
    const grade = await prisma.grade.create({ data: parsedData });
    logger.info(`Created grade ${grade.id}: ${grade.name || grade.id}`);
    return grade;
  } catch (error) {
    logger.error(`Failed to create grade: ${error}`);
    throw new ApiError(`Grade creation failed: ${error}`, 400);
  }
}

export async function createMultipleGrades(
  grades: GradeData[],
): Promise<BulkOperationResult> {
  bulkGradeSchema.parse(grades);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const gradeData of grades) {
    try {
      const createdGrade = await createGrade(gradeData);
      result.succeeded.push(createdGrade);
    } catch (error) {
      result.failed.push({
        data: gradeData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateGrade(id: string, data: GradeData): Promise<Grade> {
  try {
    const parsedData = gradeSchema.parse(data);
    const grade = await prisma.grade.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated grade ${grade.id}: ${grade.name || grade.id}`);
    return grade;
  } catch (error) {
    logger.error(`Failed to update grade ${id}: ${error}`);
    throw new ApiError(`Grade update failed: ${error}`, 400);
  }
}

export async function updateMultipleGrades(
  grades: (GradeData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const gradeData of grades) {
    try {
      const updatedGrade = await updateGrade(gradeData.id, gradeData);
      result.succeeded.push(updatedGrade);
    } catch (error) {
      result.failed.push({
        data: gradeData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteGrade(id: string): Promise<void> {
  try {
    await prisma.grade.delete({ where: { id } });
    logger.info(`Deleted grade ${id}`);
  } catch (error) {
    logger.error(`Failed to delete grade ${id}: ${error}`);
    throw new ApiError(`Grade deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleGrades(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedGrade = await prisma.grade.delete({ where: { id } });
      result.succeeded.push(deletedGrade);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.GradeCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getGradeById(id: string): Promise<Grade> {
  try {
    const grade = await prisma.grade.findUniqueOrThrow({ where: { id } });
    return grade;
  } catch (error) {
    logger.error(`Failed to retrieve grade ${id}: ${error}`);
    throw new ApiError(`Grade retrieval failed: ${error}`, 404);
  }
}

export async function getAllGrades(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ grades: Grade[]; total: number }> {
  try {
    const where: Prisma.GradeWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.grade.count({ where }),
    ]);

    return { grades, total };
  } catch (error) {
    logger.error(`Failed to retrieve grades: ${error}`);
    throw new ApiError(`Grades retrieval failed: ${error}`, 500);
  }
}
