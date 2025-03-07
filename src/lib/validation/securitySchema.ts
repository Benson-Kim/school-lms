import { z } from "zod";
import { Security } from "@prisma/client";

export const securitySchema = z.object({});

export const bulkSecuritySchema = z.array(securitySchema);

export type SecurityData = z.infer<typeof securitySchema>;

export interface BulkOperationResult {
  succeeded: Security[];
  failed: {
    data: SecurityData;
    error: string;
  }[];
}
