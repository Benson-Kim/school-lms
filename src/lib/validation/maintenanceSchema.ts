import { z } from "zod";
import { Maintenance } from "@prisma/client";

export const maintenanceSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  priority: z.string().min(1, "priority is required"),
  status: z.string().min(1, "status is required"),
  requestedBy: z.string().min(1, "requestedBy is required"),
  location: z.string().min(1, "location is required"),
});

export const bulkMaintenanceSchema = z.array(maintenanceSchema);

export type MaintenanceData = z.infer<typeof maintenanceSchema>;

export interface BulkOperationResult {
  succeeded: Maintenance[];
  failed: {
    data: MaintenanceData;
    error: string;
  }[];
}
