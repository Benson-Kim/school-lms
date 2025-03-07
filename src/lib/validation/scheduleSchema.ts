import { z } from "zod";
import { Schedule } from "@prisma/client";

export const scheduleSchema = z.object({});

export const bulkScheduleSchema = z.array(scheduleSchema);

export type ScheduleData = z.infer<typeof scheduleSchema>;

export interface BulkOperationResult {
  succeeded: Schedule[];
  failed: {
    data: ScheduleData;
    error: string;
  }[];
}
