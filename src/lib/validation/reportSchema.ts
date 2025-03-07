import { z } from "zod";
import { Report } from "@prisma/client";

export const reportSchema = z.object({});

export const bulkReportSchema = z.array(reportSchema);

export type ReportData = z.infer<typeof reportSchema>;

export interface BulkOperationResult {
  succeeded: Report[];
  failed: {
    data: ReportData;
    error: string;
  }[];
}
