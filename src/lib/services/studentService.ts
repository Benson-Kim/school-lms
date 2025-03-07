import { prisma } from "@/lib/db/prisma";
import {
  studentSchema,
  bulkStudentSchema,
  StudentData,
  BulkOperationResult,
} from "@/lib/validation/studentSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Student, Prisma } from "@prisma/client";

export async function createStudent(data: StudentData): Promise<Student> {
  try {
    const parsedData = studentSchema.parse(data);
    const student = await prisma.student.create({ data: parsedData });
    logger.info(`Created student ${student.id}: ${student.name || student.id}`);
    return student;
  } catch (error) {
    logger.error(`Failed to create student: ${error}`);
    throw new ApiError(`Student creation failed: ${error}`, 400);
  }
}

export async function createMultipleStudents(
  progress: StudentData[],
): Promise<BulkOperationResult> {
  bulkStudentSchema.parse(progress);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const studentData of progress) {
    try {
      const createdStudent = await createStudent(studentData);
      result.succeeded.push(createdStudent);
    } catch (error) {
      result.failed.push({
        data: studentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateStudent(
  id: string,
  data: StudentData,
): Promise<Student> {
  try {
    const parsedData = studentSchema.parse(data);
    const student = await prisma.student.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated student ${student.id}: ${student.name || student.id}`);
    return student;
  } catch (error) {
    logger.error(`Failed to update student ${id}: ${error}`);
    throw new ApiError(`Student update failed: ${error}`, 400);
  }
}

export async function updateMultipleStudents(
  progress: (StudentData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const studentData of progress) {
    try {
      const updatedStudent = await updateStudent(studentData.id, studentData);
      result.succeeded.push(updatedStudent);
    } catch (error) {
      result.failed.push({
        data: studentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    await prisma.student.delete({ where: { id } });
    logger.info(`Deleted student ${id}`);
  } catch (error) {
    logger.error(`Failed to delete student ${id}: ${error}`);
    throw new ApiError(`Student deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleStudents(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedStudent = await prisma.student.delete({ where: { id } });
      result.succeeded.push(deletedStudent);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.StudentCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getStudentById(id: string): Promise<Student> {
  try {
    const student = await prisma.student.findUniqueOrThrow({ where: { id } });
    return student;
  } catch (error) {
    logger.error(`Failed to retrieve student ${id}: ${error}`);
    throw new ApiError(`Student retrieval failed: ${error}`, 404);
  }
}

export async function getAllStudents(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ progress: Student[]; total: number }> {
  try {
    const where: Prisma.StudentWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [progress, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return { progress, total };
  } catch (error) {
    logger.error(`Failed to retrieve progress: ${error}`);
    throw new ApiError(`Students retrieval failed: ${error}`, 500);
  }
}
