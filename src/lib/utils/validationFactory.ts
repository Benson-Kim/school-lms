import { z } from "zod";

export interface ValidationFactoryOptions<T> {
	entityName: string;
	baseFields: Record<string, z.ZodTypeAny>;
	requiredFields: string[];
	optionalFields?: string[];
	customValidators?: {
		create?: (schema: z.ZodObject<any>) => z.ZodObject<any>;
		update?: (schema: z.ZodObject<any>) => z.ZodObject<any>;
	};
}

export function createValidationSchema<T>(
	options: ValidationFactoryOptions<T>
) {
	const {
		entityName,
		baseFields,
		requiredFields,
		optionalFields = [],
		customValidators = {},
	} = options;

	// Build the base schema with all fields
	const schemaFields: Record<string, z.ZodTypeAny> = {};

	// Process required fields
	for (const field of requiredFields) {
		if (baseFields[field]) {
			schemaFields[field] = baseFields[field];
		} else {
			throw new Error(
				`Required field '${field}' not found in baseFields for ${entityName}`
			);
		}
	}

	// Process optional fields
	for (const field of optionalFields) {
		if (baseFields[field]) {
			schemaFields[field] = baseFields[field].optional().nullable();
		} else {
			throw new Error(
				`Optional field '${field}' not found in baseFields for ${entityName}`
			);
		}
	}

	// Create base schema
	let createSchema = z.object(schemaFields).passthrough();

	// Apply custom validators for create schema
	if (customValidators.create) {
		// Fix: Use type assertion to accommodate different ZodObject configurations
		createSchema = customValidators.create(createSchema) as typeof createSchema;
	}

	// Create update schema - all fields are optional for updates
	const updateSchemaFields: Record<string, z.ZodTypeAny> = {};
	for (const [key, value] of Object.entries(schemaFields)) {
		updateSchemaFields[key] = value.optional();
	}

	let updateSchema = z.object(updateSchemaFields).passthrough();

	// Apply custom validators for update schema
	if (customValidators.update) {
		// Fix: Use type assertion to accommodate different ZodObject configurations
		updateSchema = customValidators.update(updateSchema) as typeof updateSchema;
	}

	// Create bulk schema
	const bulkSchema = z.array(createSchema);

	// Fix: Only return the schema objects, not the types
	return {
		createSchema,
		updateSchema,
		bulkSchema,
	};
}

// Fix: Define types separately for consumption by other modules
export type EntityData<T extends z.ZodObject<any>> = z.infer<T>;
export type EntityUpdateData<T extends z.ZodObject<any>> = z.infer<T>;
// BulkOperationResult is already defined in serviceFactory.ts, so we don't need to redefine it here
