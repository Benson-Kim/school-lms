import { z } from "zod";
import { Payment } from "@prisma/client";

export const paymentSchema = z.object({
  amount: z.number().min(0, "amount is required"),
  description: z.string().min(1, "description is required"),
  date: z.date().min(0, "date is required"),
  status: z.string().min(1, "status is required"),
});

export const bulkPaymentSchema = z.array(paymentSchema);

export type PaymentData = z.infer<typeof paymentSchema>;

export interface BulkOperationResult {
  succeeded: Payment[];
  failed: {
    data: PaymentData;
    error: string;
  }[];
}
