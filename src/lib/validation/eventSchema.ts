import { z } from "zod";
import { Event } from "@prisma/client";

export const eventSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  date: z.date().min(0, "date is required"),
  location: z.string().min(1, "location is required"),
});

export const bulkEventSchema = z.array(eventSchema);

export type EventData = z.infer<typeof eventSchema>;

export interface BulkOperationResult {
  succeeded: Event[];
  failed: {
    data: EventData;
    error: string;
  }[];
}
