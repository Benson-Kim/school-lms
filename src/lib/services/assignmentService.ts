import { prisma } from "@/lib/db/prisma";
import {
  assignmentSchema,
  bulkAssignmentSchema,
  AssignmentData,
  BulkOperationResult,
} from "@/lib/validation/assignmentSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Assignment, Prisma } from "@prisma/client";

export async function createAssignment(
  data: AssignmentData,
): Promise<Assignment> {
  try {
    const parsedData = assignmentSchema.parse(data);
    const assignment = await prisma.assignment.create({ data: parsedData });
    logger.info(
      `Created assignment ${assignment.id}: ${assignment.name || assignment.id}`,
    );
    return assignment;
  } catch (error) {
    logger.error(`Failed to create assignment: ${error}`);
    throw new ApiError(`Assignment creation failed: ${error}`, 400);
  }
}

export async function createMultipleAssignments(
  assignments: AssignmentData[],
): Promise<BulkOperationResult> {
  bulkAssignmentSchema.parse(assignments);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const assignmentData of assignments) {
    try {
      const createdAssignment = await createAssignment(assignmentData);
      result.succeeded.push(createdAssignment);
    } catch (error) {
      result.failed.push({
        data: assignmentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateAssignment(
  id: string,
  data: AssignmentData,
): Promise<Assignment> {
  try {
    const parsedData = assignmentSchema.parse(data);
    const assignment = await prisma.assignment.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated assignment ${assignment.id}: ${assignment.name || assignment.id}`,
    );
    return assignment;
  } catch (error) {
    logger.error(`Failed to update assignment ${id}: ${error}`);
    throw new ApiError(`Assignment update failed: ${error}`, 400);
  }
}

export async function updateMultipleAssignments(
  assignments: (AssignmentData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const assignmentData of assignments) {
    try {
      const updatedAssignment = await updateAssignment(
        assignmentData.id,
        assignmentData,
      );
      result.succeeded.push(updatedAssignment);
    } catch (error) {
      result.failed.push({
        data: assignmentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteAssignment(id: string): Promise<void> {
  try {
    await prisma.assignment.delete({ where: { id } });
    logger.info(`Deleted assignment ${id}`);
  } catch (error) {
    logger.error(`Failed to delete assignment ${id}: ${error}`);
    throw new ApiError(`Assignment deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleAssignments(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedAssignment = await prisma.assignment.delete({
        where: { id },
      });
      result.succeeded.push(deletedAssignment);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.AssignmentCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getAssignmentById(id: string): Promise<Assignment> {
  try {
    const assignment = await prisma.assignment.findUniqueOrThrow({
      where: { id },
    });
    return assignment;
  } catch (error) {
    logger.error(`Failed to retrieve assignment ${id}: ${error}`);
    throw new ApiError(`Assignment retrieval failed: ${error}`, 404);
  }
}

export async function getAllAssignments(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ assignments: Assignment[]; total: number }> {
  try {
    const where: Prisma.AssignmentWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.assignment.count({ where }),
    ]);

    return { assignments, total };
  } catch (error) {
    logger.error(`Failed to retrieve assignments: ${error}`);
    throw new ApiError(`Assignments retrieval failed: ${error}`, 500);
  }
}
