import { prisma } from "@/lib/db/prisma";
import {
  settingSchema,
  bulkSettingSchema,
  SettingData,
  BulkOperationResult,
} from "@/lib/validation/settingSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Setting, Prisma } from "@prisma/client";

export async function createSetting(data: SettingData): Promise<Setting> {
  try {
    const parsedData = settingSchema.parse(data);
    const setting = await prisma.setting.create({ data: parsedData });
    logger.info(`Created setting ${setting.id}: ${setting.name || setting.id}`);
    return setting;
  } catch (error) {
    logger.error(`Failed to create setting: ${error}`);
    throw new ApiError(`Setting creation failed: ${error}`, 400);
  }
}

export async function createMultipleSettings(
  settings: SettingData[],
): Promise<BulkOperationResult> {
  bulkSettingSchema.parse(settings);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const settingData of settings) {
    try {
      const createdSetting = await createSetting(settingData);
      result.succeeded.push(createdSetting);
    } catch (error) {
      result.failed.push({
        data: settingData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateSetting(
  id: string,
  data: SettingData,
): Promise<Setting> {
  try {
    const parsedData = settingSchema.parse(data);
    const setting = await prisma.setting.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated setting ${setting.id}: ${setting.name || setting.id}`);
    return setting;
  } catch (error) {
    logger.error(`Failed to update setting ${id}: ${error}`);
    throw new ApiError(`Setting update failed: ${error}`, 400);
  }
}

export async function updateMultipleSettings(
  settings: (SettingData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const settingData of settings) {
    try {
      const updatedSetting = await updateSetting(settingData.id, settingData);
      result.succeeded.push(updatedSetting);
    } catch (error) {
      result.failed.push({
        data: settingData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteSetting(id: string): Promise<void> {
  try {
    await prisma.setting.delete({ where: { id } });
    logger.info(`Deleted setting ${id}`);
  } catch (error) {
    logger.error(`Failed to delete setting ${id}: ${error}`);
    throw new ApiError(`Setting deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleSettings(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedSetting = await prisma.setting.delete({ where: { id } });
      result.succeeded.push(deletedSetting);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.SettingCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getSettingById(id: string): Promise<Setting> {
  try {
    const setting = await prisma.setting.findUniqueOrThrow({ where: { id } });
    return setting;
  } catch (error) {
    logger.error(`Failed to retrieve setting ${id}: ${error}`);
    throw new ApiError(`Setting retrieval failed: ${error}`, 404);
  }
}

export async function getAllSettings(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ settings: Setting[]; total: number }> {
  try {
    const where: Prisma.SettingWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [settings, total] = await Promise.all([
      prisma.setting.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.setting.count({ where }),
    ]);

    return { settings, total };
  } catch (error) {
    logger.error(`Failed to retrieve settings: ${error}`);
    throw new ApiError(`Settings retrieval failed: ${error}`, 500);
  }
}
