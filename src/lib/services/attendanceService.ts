import { prisma } from "@/lib/db/prisma";
import {
  attendanceSchema,
  bulkAttendanceSchema,
  AttendanceData,
  BulkOperationResult,
} from "@/lib/validation/attendanceSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Attendance, Prisma } from "@prisma/client";

export async function createAttendance(
  data: AttendanceData,
): Promise<Attendance> {
  try {
    const parsedData = attendanceSchema.parse(data);
    const attendance = await prisma.attendance.create({ data: parsedData });
    logger.info(
      `Created attendance ${attendance.id}: ${attendance.name || attendance.id}`,
    );
    return attendance;
  } catch (error) {
    logger.error(`Failed to create attendance: ${error}`);
    throw new ApiError(`Attendance creation failed: ${error}`, 400);
  }
}

export async function createMultipleAttendances(
  attendance: AttendanceData[],
): Promise<BulkOperationResult> {
  bulkAttendanceSchema.parse(attendance);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const attendanceData of attendance) {
    try {
      const createdAttendance = await createAttendance(attendanceData);
      result.succeeded.push(createdAttendance);
    } catch (error) {
      result.failed.push({
        data: attendanceData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateAttendance(
  id: string,
  data: AttendanceData,
): Promise<Attendance> {
  try {
    const parsedData = attendanceSchema.parse(data);
    const attendance = await prisma.attendance.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated attendance ${attendance.id}: ${attendance.name || attendance.id}`,
    );
    return attendance;
  } catch (error) {
    logger.error(`Failed to update attendance ${id}: ${error}`);
    throw new ApiError(`Attendance update failed: ${error}`, 400);
  }
}

export async function updateMultipleAttendances(
  attendance: (AttendanceData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const attendanceData of attendance) {
    try {
      const updatedAttendance = await updateAttendance(
        attendanceData.id,
        attendanceData,
      );
      result.succeeded.push(updatedAttendance);
    } catch (error) {
      result.failed.push({
        data: attendanceData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteAttendance(id: string): Promise<void> {
  try {
    await prisma.attendance.delete({ where: { id } });
    logger.info(`Deleted attendance ${id}`);
  } catch (error) {
    logger.error(`Failed to delete attendance ${id}: ${error}`);
    throw new ApiError(`Attendance deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleAttendances(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedAttendance = await prisma.attendance.delete({
        where: { id },
      });
      result.succeeded.push(deletedAttendance);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.AttendanceCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getAttendanceById(id: string): Promise<Attendance> {
  try {
    const attendance = await prisma.attendance.findUniqueOrThrow({
      where: { id },
    });
    return attendance;
  } catch (error) {
    logger.error(`Failed to retrieve attendance ${id}: ${error}`);
    throw new ApiError(`Attendance retrieval failed: ${error}`, 404);
  }
}

export async function getAllAttendances(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ attendance: Attendance[]; total: number }> {
  try {
    const where: Prisma.AttendanceWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    return { attendance, total };
  } catch (error) {
    logger.error(`Failed to retrieve attendance: ${error}`);
    throw new ApiError(`Attendances retrieval failed: ${error}`, 500);
  }
}
