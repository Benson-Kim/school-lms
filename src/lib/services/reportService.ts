import { prisma } from "@/lib/db/prisma";
import {
  reportSchema,
  bulkReportSchema,
  ReportData,
  BulkOperationResult,
} from "@/lib/validation/reportSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Report, Prisma } from "@prisma/client";

export async function createReport(data: ReportData): Promise<Report> {
  try {
    const parsedData = reportSchema.parse(data);
    const report = await prisma.report.create({ data: parsedData });
    logger.info(`Created report ${report.id}: ${report.name || report.id}`);
    return report;
  } catch (error) {
    logger.error(`Failed to create report: ${error}`);
    throw new ApiError(`Report creation failed: ${error}`, 400);
  }
}

export async function createMultipleReports(
  reports: ReportData[],
): Promise<BulkOperationResult> {
  bulkReportSchema.parse(reports);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const reportData of reports) {
    try {
      const createdReport = await createReport(reportData);
      result.succeeded.push(createdReport);
    } catch (error) {
      result.failed.push({
        data: reportData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateReport(
  id: string,
  data: ReportData,
): Promise<Report> {
  try {
    const parsedData = reportSchema.parse(data);
    const report = await prisma.report.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated report ${report.id}: ${report.name || report.id}`);
    return report;
  } catch (error) {
    logger.error(`Failed to update report ${id}: ${error}`);
    throw new ApiError(`Report update failed: ${error}`, 400);
  }
}

export async function updateMultipleReports(
  reports: (ReportData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const reportData of reports) {
    try {
      const updatedReport = await updateReport(reportData.id, reportData);
      result.succeeded.push(updatedReport);
    } catch (error) {
      result.failed.push({
        data: reportData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteReport(id: string): Promise<void> {
  try {
    await prisma.report.delete({ where: { id } });
    logger.info(`Deleted report ${id}`);
  } catch (error) {
    logger.error(`Failed to delete report ${id}: ${error}`);
    throw new ApiError(`Report deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleReports(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedReport = await prisma.report.delete({ where: { id } });
      result.succeeded.push(deletedReport);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.ReportCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getReportById(id: string): Promise<Report> {
  try {
    const report = await prisma.report.findUniqueOrThrow({ where: { id } });
    return report;
  } catch (error) {
    logger.error(`Failed to retrieve report ${id}: ${error}`);
    throw new ApiError(`Report retrieval failed: ${error}`, 404);
  }
}

export async function getAllReports(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ reports: Report[]; total: number }> {
  try {
    const where: Prisma.ReportWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.report.count({ where }),
    ]);

    return { reports, total };
  } catch (error) {
    logger.error(`Failed to retrieve reports: ${error}`);
    throw new ApiError(`Reports retrieval failed: ${error}`, 500);
  }
}
