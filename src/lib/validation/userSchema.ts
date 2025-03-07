import { z } from "zod";
import { User } from "@prisma/client";

export const userSchema = z.object({
  email: z.string().min(1, "email is required").email("Invalid email format"),
  firstName: z.string().min(1, "firstName is required"),
  lastName: z.string().min(1, "lastName is required"),
  role: z.string().min(1, "role is required"),
  phoneNumber: z.string().optional().nullable(),
  active: z.boolean().min(0, "active is required"),
});

export const bulkUserSchema = z.array(userSchema);

export type UserData = z.infer<typeof userSchema>;

export interface BulkOperationResult {
  succeeded: User[];
  failed: {
    data: UserData;
    error: string;
  }[];
}
