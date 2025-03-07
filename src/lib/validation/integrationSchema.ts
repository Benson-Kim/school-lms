import { z } from "zod";
import { Integration } from "@prisma/client";

export const integrationSchema = z.object({});

export const bulkIntegrationSchema = z.array(integrationSchema);

export type IntegrationData = z.infer<typeof integrationSchema>;

export interface BulkOperationResult {
  succeeded: Integration[];
  failed: {
    data: IntegrationData;
    error: string;
  }[];
}
