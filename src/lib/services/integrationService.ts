import { prisma } from "@/lib/db/prisma";
import {
  integrationSchema,
  bulkIntegrationSchema,
  IntegrationData,
  BulkOperationResult,
} from "@/lib/validation/integrationSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Integration, Prisma } from "@prisma/client";

export async function createIntegration(
  data: IntegrationData,
): Promise<Integration> {
  try {
    const parsedData = integrationSchema.parse(data);
    const integration = await prisma.integration.create({ data: parsedData });
    logger.info(
      `Created integration ${integration.id}: ${integration.name || integration.id}`,
    );
    return integration;
  } catch (error) {
    logger.error(`Failed to create integration: ${error}`);
    throw new ApiError(`Integration creation failed: ${error}`, 400);
  }
}

export async function createMultipleIntegrations(
  integrations: IntegrationData[],
): Promise<BulkOperationResult> {
  bulkIntegrationSchema.parse(integrations);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const integrationData of integrations) {
    try {
      const createdIntegration = await createIntegration(integrationData);
      result.succeeded.push(createdIntegration);
    } catch (error) {
      result.failed.push({
        data: integrationData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateIntegration(
  id: string,
  data: IntegrationData,
): Promise<Integration> {
  try {
    const parsedData = integrationSchema.parse(data);
    const integration = await prisma.integration.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated integration ${integration.id}: ${integration.name || integration.id}`,
    );
    return integration;
  } catch (error) {
    logger.error(`Failed to update integration ${id}: ${error}`);
    throw new ApiError(`Integration update failed: ${error}`, 400);
  }
}

export async function updateMultipleIntegrations(
  integrations: (IntegrationData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const integrationData of integrations) {
    try {
      const updatedIntegration = await updateIntegration(
        integrationData.id,
        integrationData,
      );
      result.succeeded.push(updatedIntegration);
    } catch (error) {
      result.failed.push({
        data: integrationData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteIntegration(id: string): Promise<void> {
  try {
    await prisma.integration.delete({ where: { id } });
    logger.info(`Deleted integration ${id}`);
  } catch (error) {
    logger.error(`Failed to delete integration ${id}: ${error}`);
    throw new ApiError(`Integration deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleIntegrations(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedIntegration = await prisma.integration.delete({
        where: { id },
      });
      result.succeeded.push(deletedIntegration);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.IntegrationCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getIntegrationById(id: string): Promise<Integration> {
  try {
    const integration = await prisma.integration.findUniqueOrThrow({
      where: { id },
    });
    return integration;
  } catch (error) {
    logger.error(`Failed to retrieve integration ${id}: ${error}`);
    throw new ApiError(`Integration retrieval failed: ${error}`, 404);
  }
}

export async function getAllIntegrations(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ integrations: Integration[]; total: number }> {
  try {
    const where: Prisma.IntegrationWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.integration.count({ where }),
    ]);

    return { integrations, total };
  } catch (error) {
    logger.error(`Failed to retrieve integrations: ${error}`);
    throw new ApiError(`Integrations retrieval failed: ${error}`, 500);
  }
}
