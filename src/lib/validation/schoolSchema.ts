// src/lib/validation/schoolSchema.ts
import { z } from "zod";
import { createValidationSchema } from "@/lib/utils/validationFactory";
import { School } from "@prisma/client";

// Define base fields with their validators
const schoolBaseFields = {
	name: z.string().min(1, "School name is required"),
	address: z.string().min(1, "Address is required"),
	city: z.string(),
	state: z.string(),
	zipCode: z.string(),
	country: z.string().min(1, "Country is required"),
	phone: z.string().min(1, "Phone is required"),
	email: z.string().email("Invalid email format"),
	website: z.string().url("Invalid website URL"),
};

// Create the schema using the factory
export const schoolValidation = createValidationSchema<School>({
	entityName: "School",
	baseFields: schoolBaseFields,
	requiredFields: ["name", "address", "country", "phone", "email"],
	optionalFields: ["city", "state", "zipCode", "website"],
});

// Export the schemas for use elsewhere
export const {
	createSchema: schoolCreateSchema,
	updateSchema: schoolUpdateSchema,
	bulkSchema: schoolBulkSchema,
} = schoolValidation;

// Export the types
export type SchoolCreateData = z.infer<typeof schoolCreateSchema>;
export type SchoolUpdateData = z.infer<typeof schoolUpdateSchema>;
