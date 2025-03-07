import { prisma } from "@/lib/db/prisma";
import {
  paymentSchema,
  bulkPaymentSchema,
  PaymentData,
  BulkOperationResult,
} from "@/lib/validation/paymentSchema";
import { ApiError } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";
import { Payment, Prisma } from "@prisma/client";

export async function createPayment(data: PaymentData): Promise<Payment> {
  try {
    const parsedData = paymentSchema.parse(data);
    const payment = await prisma.payment.create({ data: parsedData });
    logger.info(`Created payment ${payment.id}: ${payment.name || payment.id}`);
    return payment;
  } catch (error) {
    logger.error(`Failed to create payment: ${error}`);
    throw new ApiError(`Payment creation failed: ${error}`, 400);
  }
}

export async function createMultiplePayments(
  payments: PaymentData[],
): Promise<BulkOperationResult> {
  bulkPaymentSchema.parse(payments);

  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const paymentData of payments) {
    try {
      const createdPayment = await createPayment(paymentData);
      result.succeeded.push(createdPayment);
    } catch (error) {
      result.failed.push({
        data: paymentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function updatePayment(
  id: string,
  data: PaymentData,
): Promise<Payment> {
  try {
    const parsedData = paymentSchema.parse(data);
    const payment = await prisma.payment.update({
      where: { id },
      data: parsedData,
    });
    logger.info(`Updated payment ${payment.id}: ${payment.name || payment.id}`);
    return payment;
  } catch (error) {
    logger.error(`Failed to update payment ${id}: ${error}`);
    throw new ApiError(`Payment update failed: ${error}`, 400);
  }
}

export async function updateMultiplePayments(
  payments: (PaymentData & { id: string })[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const paymentData of payments) {
    try {
      const updatedPayment = await updatePayment(paymentData.id, paymentData);
      result.succeeded.push(updatedPayment);
    } catch (error) {
      result.failed.push({
        data: paymentData,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function deletePayment(id: string): Promise<void> {
  try {
    await prisma.payment.delete({ where: { id } });
    logger.info(`Deleted payment ${id}`);
  } catch (error) {
    logger.error(`Failed to delete payment ${id}: ${error}`);
    throw new ApiError(`Payment deletion failed: ${error}`, 400);
  }
}

export async function deleteMultiplePayments(
  ids: string[],
): Promise<BulkOperationResult> {
  const result: BulkOperationResult = { succeeded: [], failed: [] };

  for (const id of ids) {
    try {
      const deletedPayment = await prisma.payment.delete({ where: { id } });
      result.succeeded.push(deletedPayment);
    } catch (error) {
      result.failed.push({
        data: { id } as Prisma.PaymentCreateInput,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}

export async function getPaymentById(id: string): Promise<Payment> {
  try {
    const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
    return payment;
  } catch (error) {
    logger.error(`Failed to retrieve payment ${id}: ${error}`);
    throw new ApiError(`Payment retrieval failed: ${error}`, 404);
  }
}

export async function getAllPayments(
  page = 1,
  pageSize = 10,
  searchTerm = "",
): Promise<{ payments: Payment[]; total: number }> {
  try {
    const where: Prisma.PaymentWhereInput = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Add additional searchable fields here based on entity
          ],
        }
      : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total };
  } catch (error) {
    logger.error(`Failed to retrieve payments: ${error}`);
    throw new ApiError(`Payments retrieval failed: ${error}`, 500);
  }
}
