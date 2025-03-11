// src/lib/utils/apiHandlerFactory.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAuth } from "@/lib/utils/api";
import logger from "@/lib/utils/logger";

type Role = "IT" | "ADMIN" | "TEACHER" | "STUDENT"; // Add all your roles here

interface ServiceMethods<T> {
	getAll?: (
		page: number,
		pageSize: number,
		searchTerm: string
	) => Promise<{ items: T[]; total: number }>;
	getById?: (id: string) => Promise<T>;
	create?: (data: any) => Promise<T>;
	update?: (id: string, data: any) => Promise<T>;
	delete?: (id: string) => Promise<void>;
	createMultiple?: (data: any[]) => Promise<{
		successful: T[];
		failed: Array<{ item: any; error: string }>;
	}>;
	updateMultiple?: (data: any[]) => Promise<{
		successful: T[];
		failed: Array<{ item: any; error: string }>;
	}>;
	deleteMultiple?: (ids: string[]) => Promise<{
		successful: string[];
		failed: Array<{ id: string; error: string }>;
	}>;
}

interface HandlerOptions {
	resourceName: string;
	requiredRoles: Role[];
}

export function createApiHandlers<T>(
	service: ServiceMethods<T>,
	options: HandlerOptions
) {
	const { resourceName, requiredRoles } = options;

	// Collection handlers (GET, POST for the collection)
	const collectionHandlers = {
		async GET(req: NextRequest) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.getAll) {
					return NextResponse.json(
						{ error: `${resourceName} listing not implemented` },
						{ status: 501 }
					);
				}

				const { searchParams } = new URL(req.url);
				const page = parseInt(searchParams.get("page") || "1");
				const pageSize = parseInt(searchParams.get("pageSize") || "10");
				const searchTerm = searchParams.get("search") || "";

				const { items, total } = await service.getAll(
					page,
					pageSize,
					searchTerm
				);

				return NextResponse.json(
					{
						[resourceName.toLowerCase()]: items,
						pagination: {
							currentPage: page,
							pageSize,
							totalItems: total,
							totalPages: Math.ceil(total / pageSize),
						},
					},
					{ status: 200 }
				);
			} catch (error) {
				logger.error(`Failed to fetch ${resourceName.toLowerCase()}: ${error}`);
				return NextResponse.json(
					{ error: "Internal Server Error" },
					{ status: 500 }
				);
			}
		},

		async POST(req: NextRequest) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				const body = await req.json();

				// Check if it's a bulk or single creation
				if (Array.isArray(body) && service.createMultiple) {
					const result = await service.createMultiple(body);
					return NextResponse.json(result, {
						status: result.failed.length > 0 ? 206 : 201,
					});
				} else if (service.create) {
					const item = await service.create(body);
					return NextResponse.json(item, { status: 201 });
				} else {
					return NextResponse.json(
						{ error: `${resourceName} creation not implemented` },
						{ status: 501 }
					);
				}
			} catch (error) {
				logger.error(
					`Failed to create ${resourceName.toLowerCase()}(s): ${error}`
				);
				return NextResponse.json(
					{ error: `${resourceName} creation failed` },
					{ status: 400 }
				);
			}
		},
	};

	// Single item handlers (GET, PUT, DELETE for individual items)
	const itemHandlers = {
		async GET(req: NextRequest, { params }: { params: { id: string } }) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.getById) {
					return NextResponse.json(
						{ error: `${resourceName} retrieval not implemented` },
						{ status: 501 }
					);
				}

				const item = await service.getById(params.id);
				return NextResponse.json(item, { status: 200 });
			} catch (error) {
				logger.error(`Failed to fetch ${resourceName.toLowerCase()}: ${error}`);
				return NextResponse.json(
					{ error: `${resourceName} retrieval failed` },
					{ status: 404 }
				);
			}
		},

		async PUT(req: NextRequest, { params }: { params: { id: string } }) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.update) {
					return NextResponse.json(
						{ error: `${resourceName} update not implemented` },
						{ status: 501 }
					);
				}

				const body = await req.json();
				const item = await service.update(params.id, body);
				return NextResponse.json(item, { status: 200 });
			} catch (error) {
				logger.error(
					`Failed to update ${resourceName.toLowerCase()}: ${error}`
				);
				return NextResponse.json(
					{ error: `${resourceName} update failed` },
					{ status: 400 }
				);
			}
		},

		async DELETE(req: NextRequest, { params }: { params: { id: string } }) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.delete) {
					return NextResponse.json(
						{ error: `${resourceName} deletion not implemented` },
						{ status: 501 }
					);
				}

				await service.delete(params.id);
				return NextResponse.json(
					{ message: `${resourceName} deleted successfully` },
					{ status: 200 }
				);
			} catch (error) {
				logger.error(
					`Failed to delete ${resourceName.toLowerCase()}: ${error}`
				);
				return NextResponse.json(
					{ error: `${resourceName} deletion failed` },
					{ status: 400 }
				);
			}
		},
	};

	// Bulk operation handlers
	const bulkHandlers = {
		async PUT(req: NextRequest) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.updateMultiple) {
					return NextResponse.json(
						{ error: `Bulk ${resourceName} update not implemented` },
						{ status: 501 }
					);
				}

				const items = await req.json();
				const result = await service.updateMultiple(items);
				return NextResponse.json(result, {
					status: result.failed.length > 0 ? 206 : 200,
				});
			} catch (error) {
				logger.error(
					`Failed to update multiple ${resourceName.toLowerCase()}: ${error}`
				);
				return NextResponse.json(
					{ error: `Bulk ${resourceName} update failed` },
					{ status: 400 }
				);
			}
		},

		async DELETE(req: NextRequest) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.deleteMultiple) {
					return NextResponse.json(
						{ error: `Bulk ${resourceName} deletion not implemented` },
						{ status: 501 }
					);
				}

				const { ids } = await req.json();
				const result = await service.deleteMultiple(ids);
				return NextResponse.json(result, {
					status: result.failed.length > 0 ? 206 : 200,
				});
			} catch (error) {
				logger.error(
					`Failed to delete multiple ${resourceName.toLowerCase()}: ${error}`
				);
				return NextResponse.json(
					{ error: `Bulk ${resourceName} deletion failed` },
					{ status: 400 }
				);
			}
		},

		async POST(req: NextRequest) {
			try {
				const session = await getServerSession(authOptions);
				requireAuth(session, requiredRoles);

				if (!service.createMultiple) {
					return NextResponse.json(
						{ error: `Bulk ${resourceName} creation not implemented` },
						{ status: 501 }
					);
				}

				const items = await req.json();
				const result = await service.createMultiple(items);
				return NextResponse.json(result, {
					status: result.failed.length > 0 ? 206 : 201,
				});
			} catch (error) {
				logger.error(
					`Failed to create multiple ${resourceName.toLowerCase()}: ${error}`
				);
				return NextResponse.json(
					{ error: `Bulk ${resourceName} import failed` },
					{ status: 400 }
				);
			}
		},
	};

	return {
		collectionHandlers,
		itemHandlers,
		bulkHandlers,
	};
}
