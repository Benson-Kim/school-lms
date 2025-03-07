import { prisma } from "@/lib/db/prisma";
import {
  securitySchema,
  bulkSecuritySchema,
  SecurityData,
  BulkOperationResult,
} from "@/lib/validation/securitySchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Security, Prisma } from "@prisma/client";

export async function createSecurity(data: SecurityData): Promise<Security> {
  try {
    const parsedData = securitySchema.parse(data);
    const security = await prisma.security.create({ data: parsedData });
    logger.info(
      `Created security ${security.id}: ${security.name || security.id}`,
    );
    return security;
  } catch (error) {
    logger.error(`Failed to create security: ${error}`);
    throw new ApiError(`Security creation failed: ${error}`, 400);
  }
}

export async function createMultipleSecuritys(
  security: SecurityData[],
): Promise<BulkOperationResult> {
  bulkSecuritySchema.parse(security);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const securityData of security) {
    try {
      const createdSecurity = await createSecurity(securityData);
      result.succeeded.push(createdSecurity);
    } catch (error) {
      result.failed.push({
        data: securityData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateSecurity(
  id: string,
  data: SecurityData,
): Promise<Security> {
  try {
    const parsedData = securitySchema.parse(data);
    const security = await prisma.security.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated security ${security.id}: ${security.name || security.id}`,
    );
    return security;
  } catch (error) {
    logger.error(`Failed to update security ${id}: ${error}`);
    throw new ApiError(`Security update failed: ${error}`, 400);
  }
}

export async function updateMultipleSecuritys(
  security: (SecurityData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const securityData of security) {
    try {
      const updatedSecurity = await updateSecurity(
        securityData.id,
        securityData,
      );
      result.succeeded.push(updatedSecurity);
    } catch (error) {
      result.failed.push({
        data: securityData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteSecurity(id: string): Promise<void> {
  try {
    await prisma.security.delete({ where: { id } });
    logger.info(`Deleted security ${id}`);
  } catch (error) {
    logger.error(`Failed to delete security ${id}: ${error}`);
    throw new ApiError(`Security deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleSecuritys(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedSecurity = await prisma.security.delete({ where: { id } });
      result.succeeded.push(deletedSecurity);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.SecurityCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getSecurityById(id: string): Promise<Security> {
  try {
    const security = await prisma.security.findUniqueOrThrow({ where: { id } });
    return security;
  } catch (error) {
    logger.error(`Failed to retrieve security ${id}: ${error}`);
    throw new ApiError(`Security retrieval failed: ${error}`, 404);
  }
}

export async function getAllSecuritys(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ security: Security[]; total: number }> {
  try {
    const where: Prisma.SecurityWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [security, total] = await Promise.all([
      prisma.security.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.security.count({ where }),
    ]);

    return { security, total };
  } catch (error) {
    logger.error(`Failed to retrieve security: ${error}`);
    throw new ApiError(`Securitys retrieval failed: ${error}`, 500);
  }
}
