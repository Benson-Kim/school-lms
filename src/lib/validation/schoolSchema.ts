// src/lib/validation/schoolSchema.ts
import { School } from "@prisma/client";
import { z } from "zod";

export const schoolSchema = z.object({
	name: z.string().min(1, "School name is required"),
	address: z.string().min(1, "Address is required"),
	city: z.string().optional().nullable(),
	state: z.string().optional().nullable(),
	zipCode: z.string().optional().nullable(),
	country: z.string().min(1, "Country is required"),
	phone: z.string().min(1, "Phone is required"),
	email: z.string().email("Invalid email format"),
	website: z.string().url("Invalid website URL").optional().nullable(),
});

export const bulkSchoolSchema = z.array(schoolSchema);

export type SchoolData = z.infer<typeof schoolSchema>;

export interface BulkOperationResult {
	succeeded: School[];
	failed: {
		data: SchoolData;
		error: string;
	}[];
}
