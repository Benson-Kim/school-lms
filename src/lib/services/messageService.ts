import { prisma } from "@/lib/db/prisma";
import {
  messageSchema,
  bulkMessageSchema,
  MessageData,
  BulkOperationResult,
} from "@/lib/validation/messageSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Message, Prisma } from "@prisma/client";

export async function createMessage(data: MessageData): Promise<Message> {
  try {
    const parsedData = messageSchema.parse(data);
    const message = await prisma.message.create({ data: parsedData });
    logger.info(`Created message ${message.id}: ${message.name || message.id}`);
    return message;
  } catch (error) {
    logger.error(`Failed to create message: ${error}`);
    throw new ApiError(`Message creation failed: ${error}`, 400);
  }
}

export async function createMultipleMessages(
  messages: MessageData[],
): Promise<BulkOperationResult> {
  bulkMessageSchema.parse(messages);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const messageData of messages) {
    try {
      const createdMessage = await createMessage(messageData);
      result.succeeded.push(createdMessage);
    } catch (error) {
      result.failed.push({
        data: messageData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateMessage(
  id: string,
  data: MessageData,
): Promise<Message> {
  try {
    const parsedData = messageSchema.parse(data);
    const message = await prisma.message.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated message ${message.id}: ${message.name || message.id}`);
    return message;
  } catch (error) {
    logger.error(`Failed to update message ${id}: ${error}`);
    throw new ApiError(`Message update failed: ${error}`, 400);
  }
}

export async function updateMultipleMessages(
  messages: (MessageData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const messageData of messages) {
    try {
      const updatedMessage = await updateMessage(messageData.id, messageData);
      result.succeeded.push(updatedMessage);
    } catch (error) {
      result.failed.push({
        data: messageData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteMessage(id: string): Promise<void> {
  try {
    await prisma.message.delete({ where: { id } });
    logger.info(`Deleted message ${id}`);
  } catch (error) {
    logger.error(`Failed to delete message ${id}: ${error}`);
    throw new ApiError(`Message deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleMessages(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedMessage = await prisma.message.delete({ where: { id } });
      result.succeeded.push(deletedMessage);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.MessageCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getMessageById(id: string): Promise<Message> {
  try {
    const message = await prisma.message.findUniqueOrThrow({ where: { id } });
    return message;
  } catch (error) {
    logger.error(`Failed to retrieve message ${id}: ${error}`);
    throw new ApiError(`Message retrieval failed: ${error}`, 404);
  }
}

export async function getAllMessages(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ messages: Message[]; total: number }> {
  try {
    const where: Prisma.MessageWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.message.count({ where }),
    ]);

    return { messages, total };
  } catch (error) {
    logger.error(`Failed to retrieve messages: ${error}`);
    throw new ApiError(`Messages retrieval failed: ${error}`, 500);
  }
}
