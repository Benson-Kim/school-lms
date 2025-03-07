import { prisma } from "@/lib/db/prisma";
import {
  scheduleSchema,
  bulkScheduleSchema,
  ScheduleData,
  BulkOperationResult,
} from "@/lib/validation/scheduleSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Schedule, Prisma } from "@prisma/client";

export async function createSchedule(data: ScheduleData): Promise<Schedule> {
  try {
    const parsedData = scheduleSchema.parse(data);
    const schedule = await prisma.schedule.create({ data: parsedData });
    logger.info(
      `Created schedule ${schedule.id}: ${schedule.name || schedule.id}`,
    );
    return schedule;
  } catch (error) {
    logger.error(`Failed to create schedule: ${error}`);
    throw new ApiError(`Schedule creation failed: ${error}`, 400);
  }
}

export async function createMultipleSchedules(
  schedule: ScheduleData[],
): Promise<BulkOperationResult> {
  bulkScheduleSchema.parse(schedule);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const scheduleData of schedule) {
    try {
      const createdSchedule = await createSchedule(scheduleData);
      result.succeeded.push(createdSchedule);
    } catch (error) {
      result.failed.push({
        data: scheduleData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateSchedule(
  id: string,
  data: ScheduleData,
): Promise<Schedule> {
  try {
    const parsedData = scheduleSchema.parse(data);
    const schedule = await prisma.schedule.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated schedule ${schedule.id}: ${schedule.name || schedule.id}`,
    );
    return schedule;
  } catch (error) {
    logger.error(`Failed to update schedule ${id}: ${error}`);
    throw new ApiError(`Schedule update failed: ${error}`, 400);
  }
}

export async function updateMultipleSchedules(
  schedule: (ScheduleData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const scheduleData of schedule) {
    try {
      const updatedSchedule = await updateSchedule(
        scheduleData.id,
        scheduleData,
      );
      result.succeeded.push(updatedSchedule);
    } catch (error) {
      result.failed.push({
        data: scheduleData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteSchedule(id: string): Promise<void> {
  try {
    await prisma.schedule.delete({ where: { id } });
    logger.info(`Deleted schedule ${id}`);
  } catch (error) {
    logger.error(`Failed to delete schedule ${id}: ${error}`);
    throw new ApiError(`Schedule deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleSchedules(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedSchedule = await prisma.schedule.delete({ where: { id } });
      result.succeeded.push(deletedSchedule);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.ScheduleCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getScheduleById(id: string): Promise<Schedule> {
  try {
    const schedule = await prisma.schedule.findUniqueOrThrow({ where: { id } });
    return schedule;
  } catch (error) {
    logger.error(`Failed to retrieve schedule ${id}: ${error}`);
    throw new ApiError(`Schedule retrieval failed: ${error}`, 404);
  }
}

export async function getAllSchedules(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ schedule: Schedule[]; total: number }> {
  try {
    const where: Prisma.ScheduleWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [schedule, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.schedule.count({ where }),
    ]);

    return { schedule, total };
  } catch (error) {
    logger.error(`Failed to retrieve schedule: ${error}`);
    throw new ApiError(`Schedules retrieval failed: ${error}`, 500);
  }
}
