import { prisma } from "@/lib/db/prisma";
import {
  maintenanceSchema,
  bulkMaintenanceSchema,
  MaintenanceData,
  BulkOperationResult,
} from "@/lib/validation/maintenanceSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Maintenance, Prisma } from "@prisma/client";

export async function createMaintenance(
  data: MaintenanceData,
): Promise<Maintenance> {
  try {
    const parsedData = maintenanceSchema.parse(data);
    const maintenance = await prisma.maintenance.create({ data: parsedData });
    logger.info(
      `Created maintenance ${maintenance.id}: ${maintenance.name || maintenance.id}`,
    );
    return maintenance;
  } catch (error) {
    logger.error(`Failed to create maintenance: ${error}`);
    throw new ApiError(`Maintenance creation failed: ${error}`, 400);
  }
}

export async function createMultipleMaintenances(
  maintenance: MaintenanceData[],
): Promise<BulkOperationResult> {
  bulkMaintenanceSchema.parse(maintenance);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const maintenanceData of maintenance) {
    try {
      const createdMaintenance = await createMaintenance(maintenanceData);
      result.succeeded.push(createdMaintenance);
    } catch (error) {
      result.failed.push({
        data: maintenanceData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateMaintenance(
  id: string,
  data: MaintenanceData,
): Promise<Maintenance> {
  try {
    const parsedData = maintenanceSchema.parse(data);
    const maintenance = await prisma.maintenance.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated maintenance ${maintenance.id}: ${maintenance.name || maintenance.id}`,
    );
    return maintenance;
  } catch (error) {
    logger.error(`Failed to update maintenance ${id}: ${error}`);
    throw new ApiError(`Maintenance update failed: ${error}`, 400);
  }
}

export async function updateMultipleMaintenances(
  maintenance: (MaintenanceData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const maintenanceData of maintenance) {
    try {
      const updatedMaintenance = await updateMaintenance(
        maintenanceData.id,
        maintenanceData,
      );
      result.succeeded.push(updatedMaintenance);
    } catch (error) {
      result.failed.push({
        data: maintenanceData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteMaintenance(id: string): Promise<void> {
  try {
    await prisma.maintenance.delete({ where: { id } });
    logger.info(`Deleted maintenance ${id}`);
  } catch (error) {
    logger.error(`Failed to delete maintenance ${id}: ${error}`);
    throw new ApiError(`Maintenance deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleMaintenances(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedMaintenance = await prisma.maintenance.delete({
        where: { id },
      });
      result.succeeded.push(deletedMaintenance);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.MaintenanceCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getMaintenanceById(id: string): Promise<Maintenance> {
  try {
    const maintenance = await prisma.maintenance.findUniqueOrThrow({
      where: { id },
    });
    return maintenance;
  } catch (error) {
    logger.error(`Failed to retrieve maintenance ${id}: ${error}`);
    throw new ApiError(`Maintenance retrieval failed: ${error}`, 404);
  }
}

export async function getAllMaintenances(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ maintenance: Maintenance[]; total: number }> {
  try {
    const where: Prisma.MaintenanceWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [maintenance, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.maintenance.count({ where }),
    ]);

    return { maintenance, total };
  } catch (error) {
    logger.error(`Failed to retrieve maintenance: ${error}`);
    throw new ApiError(`Maintenances retrieval failed: ${error}`, 500);
  }
}
