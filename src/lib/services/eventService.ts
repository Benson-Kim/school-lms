import { prisma } from "@/lib/db/prisma";
import {
  eventSchema,
  bulkEventSchema,
  EventData,
  BulkOperationResult,
} from "@/lib/validation/eventSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Event, Prisma } from "@prisma/client";

export async function createEvent(data: EventData): Promise<Event> {
  try {
    const parsedData = eventSchema.parse(data);
    const event = await prisma.event.create({ data: parsedData });
    logger.info(`Created event ${event.id}: ${event.name || event.id}`);
    return event;
  } catch (error) {
    logger.error(`Failed to create event: ${error}`);
    throw new ApiError(`Event creation failed: ${error}`, 400);
  }
}

export async function createMultipleEvents(
  events: EventData[],
): Promise<BulkOperationResult> {
  bulkEventSchema.parse(events);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const eventData of events) {
    try {
      const createdEvent = await createEvent(eventData);
      result.succeeded.push(createdEvent);
    } catch (error) {
      result.failed.push({
        data: eventData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updateEvent(id: string, data: EventData): Promise<Event> {
  try {
    const parsedData = eventSchema.parse(data);
    const event = await prisma.event.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated event ${event.id}: ${event.name || event.id}`);
    return event;
  } catch (error) {
    logger.error(`Failed to update event ${id}: ${error}`);
    throw new ApiError(`Event update failed: ${error}`, 400);
  }
}

export async function updateMultipleEvents(
  events: (EventData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const eventData of events) {
    try {
      const updatedEvent = await updateEvent(eventData.id, eventData);
      result.succeeded.push(updatedEvent);
    } catch (error) {
      result.failed.push({
        data: eventData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deleteEvent(id: string): Promise<void> {
  try {
    await prisma.event.delete({ where: { id } });
    logger.info(`Deleted event ${id}`);
  } catch (error) {
    logger.error(`Failed to delete event ${id}: ${error}`);
    throw new ApiError(`Event deletion failed: ${error}`, 400);
  }
}

export async function deleteMultipleEvents(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedEvent = await prisma.event.delete({ where: { id } });
      result.succeeded.push(deletedEvent);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.EventCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getEventById(id: string): Promise<Event> {
  try {
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });
    return event;
  } catch (error) {
    logger.error(`Failed to retrieve event ${id}: ${error}`);
    throw new ApiError(`Event retrieval failed: ${error}`, 404);
  }
}

export async function getAllEvents(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ events: Event[]; total: number }> {
  try {
    const where: Prisma.EventWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.event.count({ where }),
    ]);

    return { events, total };
  } catch (error) {
    logger.error(`Failed to retrieve events: ${error}`);
    throw new ApiError(`Events retrieval failed: ${error}`, 500);
  }
}
