"use client";

import useSWR from "swr";
import { showToast } from "@/components/ui/Toaster";

interface UseEntitiesParams {
	endpoint: string; // e.g., "/api/student/courses" or "/api/teacher/students"
	page?: number;
	pageSize?: number;
	searchTerm?: string;
}

interface BulkOperationResult<T> {
	succeeded: T[];
	failed: { data: any; error: string }[];
}

interface UseEntitiesResult<T> {
	entities: T[] | undefined;
	totalItems: number | undefined;
	totalPages: number | undefined;
	isLoading: boolean;
	isError: boolean;
	refetch: () => void;
	deleteEntities: (ids: string[]) => Promise<void>;
}

const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || `Failed to fetch data from ${url}`);
	}
	return response.json();
};

export function useEntities<T>({
	endpoint,
	page = 1,
	pageSize = 10,
	searchTerm = "",
}: UseEntitiesParams): UseEntitiesResult<T> {
	const url = `${endpoint}?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
		searchTerm
	)}`;

	const { data, error, mutate } = useSWR(url, fetcher, {
		revalidateOnFocus: false,
		onError: (err) => {
			showToast({
				title: "Error fetching data",
				description: err.message,
				variant: "error",
			});
		},
	});

	const deleteEntities = async (ids: string[]) => {
		try {
			const response = await fetch(`${endpoint}/bulk`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete entities");
			}

			const result: BulkOperationResult<T> = await response.json();
			showToast({
				title: "Entities deleted",
				description: `Successfully deleted ${result.succeeded.length} items`,
				variant: "success",
			});
			if (result.failed.length > 0) {
				showToast({
					title: "Partial deletion failure",
					description: `${result.failed.length} items failed to delete`,
					variant: "warning",
				});
			}

			// Revalidate data after deletion
			mutate();
		} catch (err) {
			showToast({
				title: "Deletion error",
				description: err instanceof Error ? err.message : "An error occurred",
				variant: "error",
			});
			throw err;
		}
	};

	return {
		entities: data?.[endpoint.split("/").pop() as string], // e.g., "courses" or "students"
		totalItems: data?.pagination.totalItems,
		totalPages: data?.pagination.totalPages,
		isLoading: !error && !data,
		isError: !!error,
		refetch: () => mutate(),
		deleteEntities,
	};
}
