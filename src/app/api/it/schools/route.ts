// src/app/api/it/schools/route.ts
import { createApiHandlers } from "@/lib/utils/apiHandlerFactory";
import * as schoolService from "@/lib/services/schoolService";

const { collectionHandlers } = createApiHandlers(
	{
		getAll: async (page, pageSize, searchTerm) => {
			const { schools, total } = await schoolService.getAllSchools(
				page,
				pageSize,
				searchTerm
			);
			return { items: schools, total };
		},
		create: schoolService.createSchool,
		createMultiple: schoolService.createMultipleSchools,
	},
	{
		resourceName: "School",
		requiredRoles: ["IT"],
	}
);

// Export the collection handlers
export const GET = collectionHandlers.GET;
export const POST = collectionHandlers.POST;
