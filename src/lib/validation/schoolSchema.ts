import { z } from "zod";

export const schoolSchema = z.object({
	name: z.string().min(1, "School name is required"),
	address: z.string().min(1, "Address is required"),
	city: z.string().optional(),
	state: z.string().optional(),
	zipCode: z.string().optional(),
	country: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email().optional(),
	website: z.string().url().optional(),
});
