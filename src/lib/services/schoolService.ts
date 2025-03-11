// src/lib/services/schoolService.ts
import { prisma } from "@/lib/db/prisma";
import { School } from "@prisma/client";
import { createService, BulkOperationResult } from "@/lib/utils/serviceFactory";
import {
	schoolCreateSchema,
	schoolUpdateSchema,
	schoolBulkSchema,
} from "@/lib/validation/schoolSchema";

// Create the school service using the factory
const schoolService = createService<School, any, any>({
	modelName: "School",
	validator: {
		createSchema: schoolCreateSchema,
		updateSchema: schoolUpdateSchema,
		bulkSchema: schoolBulkSchema,
	},
	prismaModel: prisma.school,
	searchFields: ["name", "city", "country", "email"],
	defaultOrderBy: { name: "asc" },
});

// Standard service methods
export const createSchool = schoolService.create;
export const updateSchool = schoolService.update;
export const deleteSchool = schoolService.delete;
export const getSchoolById = schoolService.getById;
export const getAllSchools = async (
	page = 1,
	pageSize = 10,
	searchTerm = ""
) => {
	const { items, total } = await schoolService.getAll(
		page,
		pageSize,
		searchTerm
	);
	return { schools: items, total };
};

// Adapter methods to convert between interfaces
export const createMultipleSchools = async (
	data: any[]
): Promise<{
	successful: School[];
	failed: { item: any; error: string }[];
}> => {
	const result = await schoolService.createMultiple(data);
	return {
		successful: result.succeeded,
		failed: result.failed.map((item) => ({
			item: item.data,
			error: item.error,
		})),
	};
};

export const updateMultipleSchools = async (
	data: any[]
): Promise<{
	successful: School[];
	failed: { item: any; error: string }[];
}> => {
	const result = await schoolService.updateMultiple(data);
	return {
		successful: result.succeeded,
		failed: result.failed.map((item) => ({
			item: item.data,
			error: item.error,
		})),
	};
};

export const deleteMultipleSchools = async (
	ids: string[]
): Promise<{
	successful: string[];
	failed: { id: string; error: string }[];
}> => {
	const result = await schoolService.deleteMultiple(ids);
	return {
		successful: result.succeeded.map((school) => school.id),
		failed: result.failed.map((item) => ({
			id: item.data.id,
			error: item.error,
		})),
	};
};

// Export the whole service object as default for specific use cases
export default schoolService;
