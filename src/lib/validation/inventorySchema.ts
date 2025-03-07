import { z } from "zod";
import { Inventory } from "@prisma/client";

export const inventorySchema = z.object({
  name: z.string().min(1, "name is required"),
  quantity: z.number().min(0, "quantity is required"),
  location: z.string().min(1, "location is required"),
  status: z.string().min(1, "status is required"),
});

export const bulkInventorySchema = z.array(inventorySchema);

export type InventoryData = z.infer<typeof inventorySchema>;

export interface BulkOperationResult {
  succeeded: Inventory[];
  failed: {
    data: InventoryData;
    error: string;
  }[];
}
