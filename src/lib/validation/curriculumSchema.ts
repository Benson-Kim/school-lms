import { Curriculum } from "@prisma/client";
import { z } from "zod";

export const curriculumSchema = z.object({
	name: z.string().min(1, "Curriculum name is required"),
	description: z.string().optional().nullable(),
});

export const bulkCurriculumSchema = z.array(curriculumSchema);

export type CurriculumData = z.infer<typeof curriculumSchema>;

export interface BulkOperationResult {
	succeeded: Curriculum[];
	failed: {
		data: CurriculumData;
		error: string;
	}[];
}
