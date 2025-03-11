// src/app/api/it/schools/[id]/route.ts
import { createApiHandlers } from "@/lib/utils/apiHandlerFactory";
import * as schoolService from "@/lib/services/schoolService";

const { itemHandlers } = createApiHandlers(
	{
		getById: schoolService.getSchoolById,
		update: schoolService.updateSchool,
		delete: schoolService.deleteSchool,
	},
	{
		resourceName: "School",
		requiredRoles: ["IT"],
	}
);

// Export the item handlers
export const GET = itemHandlers.GET;
export const PUT = itemHandlers.PUT;
export const DELETE = itemHandlers.DELETE;
