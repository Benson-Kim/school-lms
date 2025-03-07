import { z } from "zod";
import { Class } from "@prisma/client";

export const classSchema = z.object({
  name: z.string().min(1, "name is required"),
});

export const bulkClassSchema = z.array(classSchema);

export type ClassData = z.infer<typeof classSchema>;

export interface BulkOperationResult {
  succeeded: Class[];
  failed: {
    data: ClassData;
    error: string;
  }[];
}
