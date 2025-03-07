import { prisma } from "@/lib/db/prisma";
import {
  inventorySchema,
  bulkInventorySchema,
  InventoryData,
  BulkOperationResult,
} from "@/lib/validation/inventorySchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Inventory, Prisma } from "@prisma/client";

export async function createInventory(data: InventoryData): Promise<Inventory> {
  try {
    const parsedData = inventorySchema.parse(data);
    const inventory = await prisma.inventory.create({ data: parsedData });
    logger.info(
      `Created inventory ${inventory.id}: ${inventory.name || inventory.id}`,
    );
    return inventory;
  } catch (error) {
    logger.error(`Failed to create inventory: ${error}`);
    throw new ApiError(`Inventory creation failed: ${error}`, 400);
  }
}

export async function createMultipleInventorys(
  inventory: InventoryData[],
): Promise<BulkOperationResult> {
  bulkInventorySchema.parse(inventory);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const inventoryData of inventory) {
    try {
      const createdInventory = await createInventory(inventoryData);
      result.succeeded.push(createdInventory);
    } catch (error) {
      result.failed.push({
        data: inventoryData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateInventory(
  id: string,
  data: InventoryData,
): Promise<Inventory> {
  try {
    const parsedData = inventorySchema.parse(data);
    const inventory = await prisma.inventory.update({
      where: { id },
      data: parsedData,
    });
    logger.info(
      `Updated inventory ${inventory.id}: ${inventory.name || inventory.id}`,
    );
    return inventory;
  } catch (error) {
    logger.error(`Failed to update inventory ${id}: ${error}`);
    throw new ApiError(`Inventory update failed: ${error}`, 400);
  }
}

export async function updateMultipleInventorys(
  inventory: (InventoryData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const inventoryData of inventory) {
    try {
      const updatedInventory = await updateInventory(
        inventoryData.id,
        inventoryData,
      );
      result.succeeded.push(updatedInventory);
    } catch (error) {
      result.failed.push({
        data: inventoryData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteInventory(id: string): Promise<void> {
  try {
    await prisma.inventory.delete({ where: { id } });
    logger.info(`Deleted inventory ${id}`);
  } catch (error) {
    logger.error(`Failed to delete inventory ${id}: ${error}`);
    throw new ApiError(`Inventory deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleInventorys(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedInventory = await prisma.inventory.delete({ where: { id } });
      result.succeeded.push(deletedInventory);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.InventoryCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getInventoryById(id: string): Promise<Inventory> {
  try {
    const inventory = await prisma.inventory.findUniqueOrThrow({
      where: { id },
    });
    return inventory;
  } catch (error) {
    logger.error(`Failed to retrieve inventory ${id}: ${error}`);
    throw new ApiError(`Inventory retrieval failed: ${error}`, 404);
  }
}

export async function getAllInventorys(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ inventory: Inventory[]; total: number }> {
  try {
    const where: Prisma.InventoryWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.inventory.count({ where }),
    ]);

    return { inventory, total };
  } catch (error) {
    logger.error(`Failed to retrieve inventory: ${error}`);
    throw new ApiError(`Inventorys retrieval failed: ${error}`, 500);
  }
}
