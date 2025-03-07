import { z } from "zod";
import { Message } from "@prisma/client";

export const messageSchema = z.object({});

export const bulkMessageSchema = z.array(messageSchema);

export type MessageData = z.infer<typeof messageSchema>;

export interface BulkOperationResult {
  succeeded: Message[];
  failed: {
    data: MessageData;
    error: string;
  }[];
}
