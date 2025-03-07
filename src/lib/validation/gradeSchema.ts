import { z } from "zod";
import { Grade } from "@prisma/client";

export const gradeSchema = z.object({
  assignmentName: z.string().min(1, "assignmentName is required"),
  score: z.number().min(0, "score is required"),
  feedback: z.string().optional().nullable(),
});

export const bulkGradeSchema = z.array(gradeSchema);

export type GradeData = z.infer<typeof gradeSchema>;

export interface BulkOperationResult {
  succeeded: Grade[];
  failed: {
    data: GradeData;
    error: string;
  }[];
}
