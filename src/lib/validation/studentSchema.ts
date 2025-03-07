import { z } from "zod";
import { Student } from "@prisma/client";

export const studentSchema = z.object({});

export const bulkStudentSchema = z.array(studentSchema);

export type StudentData = z.infer<typeof studentSchema>;

export interface BulkOperationResult {
  succeeded: Student[];
  failed: {
    data: StudentData;
    error: string;
  }[];
}
