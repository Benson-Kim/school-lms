// src/app/api/it/schools/bulk/route.ts
import { createApiHandlers } from "@/lib/utils/apiHandlerFactory";
import * as schoolService from "@/lib/services/schoolService";

const { bulkHandlers } = createApiHandlers(
	{
		createMultiple: schoolService.createMultipleSchools,
		updateMultiple: schoolService.updateMultipleSchools,
		deleteMultiple: schoolService.deleteMultipleSchools,
	},
	{
		resourceName: "School",
		requiredRoles: ["IT"],
	}
);

// Export the bulk handlers
export const POST = bulkHandlers.POST;
export const PUT = bulkHandlers.PUT;
export const DELETE = bulkHandlers.DELETE;
