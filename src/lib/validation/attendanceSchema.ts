import { z } from "zod";
import { Attendance } from "@prisma/client";

export const attendanceSchema = z.object({
  date: z.date().min(0, "date is required"),
  studentId: z.string().min(1, "studentId is required"),
  status: z.string().min(1, "status is required"),
  note: z.string().optional().nullable(),
});

export const bulkAttendanceSchema = z.array(attendanceSchema);

export type AttendanceData = z.infer<typeof attendanceSchema>;

export interface BulkOperationResult {
  succeeded: Attendance[];
  failed: {
    data: AttendanceData;
    error: string;
  }[];
}
