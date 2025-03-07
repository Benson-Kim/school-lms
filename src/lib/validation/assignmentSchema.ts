import { z } from "zod";
import { Assignment } from "@prisma/client";

export const assignmentSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  dueDate: z.date().min(0, "dueDate is required"),
  totalPoints: z.number().min(0, "totalPoints is required"),
});

export const bulkAssignmentSchema = z.array(assignmentSchema);

export type AssignmentData = z.infer<typeof assignmentSchema>;

export interface BulkOperationResult {
  succeeded: Assignment[];
  failed: {
    data: AssignmentData;
    error: string;
  }[];
}
