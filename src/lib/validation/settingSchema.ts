import { z } from "zod";
import { Setting } from "@prisma/client";

export const settingSchema = z.object({});

export const bulkSettingSchema = z.array(settingSchema);

export type SettingData = z.infer<typeof settingSchema>;

export interface BulkOperationResult {
  succeeded: Setting[];
  failed: {
    data: SettingData;
    error: string;
  }[];
}
