import { prisma } from "@/lib/db/prisma";
import {
  userSchema,
  bulkUserSchema,
  UserData,
  BulkOperationResult,
} from "@/lib/validation/userSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { User, Prisma } from "@prisma/client";

export async function createUser(data: UserData): Promise<User> {
  try {
    const parsedData = userSchema.parse(data);
    const user = await prisma.user.create({ data: parsedData });
    logger.info(`Created user ${user.id}: ${user.name || user.id}`);
    return user;
  } catch (error) {
    logger.error(`Failed to create user: ${error}`);
    throw new ApiError(`User creation failed: ${error}`, 400);
  }
}

export async function createMultipleUsers(
  users: UserData[],
): Promise<BulkOperationResult> {
  bulkUserSchema.parse(users);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const userData of users) {
    try {
      const createdUser = await createUser(userData);
      result.succeeded.push(createdUser);
    } catch (error) {
      result.failed.push({
        data: userData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateUser(id: string, data: UserData): Promise<User> {
  try {
    const parsedData = userSchema.parse(data);
    const user = await prisma.user.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated user ${user.id}: ${user.name || user.id}`);
    return user;
  } catch (error) {
    logger.error(`Failed to update user ${id}: ${error}`);
    throw new ApiError(`User update failed: ${error}`, 400);
  }
}

export async function updateMultipleUsers(
  users: (UserData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const userData of users) {
    try {
      const updatedUser = await updateUser(userData.id, userData);
      result.succeeded.push(updatedUser);
    } catch (error) {
      result.failed.push({
        data: userData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await prisma.user.delete({ where: { id } });
    logger.info(`Deleted user ${id}`);
  } catch (error) {
    logger.error(`Failed to delete user ${id}: ${error}`);
    throw new ApiError(`User deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleUsers(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedUser = await prisma.user.delete({ where: { id } });
      result.succeeded.push(deletedUser);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.UserCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getUserById(id: string): Promise<User> {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    return user;
  } catch (error) {
    logger.error(`Failed to retrieve user ${id}: ${error}`);
    throw new ApiError(`User retrieval failed: ${error}`, 404);
  }
}

export async function getAllUsers(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ users: User[]; total: number }> {
  try {
    const where: Prisma.UserWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  } catch (error) {
    logger.error(`Failed to retrieve users: ${error}`);
    throw new ApiError(`Users retrieval failed: ${error}`, 500);
  }
}
