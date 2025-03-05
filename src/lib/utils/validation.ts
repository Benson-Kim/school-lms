import { z, ZodError } from "zod";
import { ApiError } from "./api";

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
	try {
		return schema.parse(data);
	} catch (error) {
		if (error instanceof ZodError) {
			throw new ApiError(
				`Validation failed: ${error.errors.map((e) => e.message).join(", ")}`,
				400
			);
		}
		throw error;
	}
}
