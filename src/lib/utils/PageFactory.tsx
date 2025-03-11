// Generic types for the management component
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
	useForm,
	SubmitHandler,
	FormProvider,
	FieldValues,
	DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";
import { Button } from "@/components/ui/Button";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";
import { ModalCard } from "@/components/ui/ModalCard";
import {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import Loading from "@/components/ui/Loading";

// Fetcher function with error handling
const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch");
	}
	return response.json();
};

// Modal state types
export type ModalType =
	| "add"
	| "view"
	| "update"
	| "delete"
	| "bulk-update"
	| "bulk-delete"
	| null;

export interface ModalState<T> {
	isOpen: boolean;
	type: ModalType;
	item?: T | null;
}

// Bulk operation result types
export interface BulkOperationResult<T> {
	success: number;
	failed: Array<{
		data: T;
		error: string;
	}>;
}

// Props for the management component
export interface DataManagementProps<T, FormData extends FieldValues> {
	title: string;
	apiEndpoint: string;
	schema: z.ZodType<FormData>;
	requiredRole?: string;
	columns: Array<{
		key: keyof T;
		label: string;
		sortable?: boolean;
		render?: (value: any, item: T) => React.ReactNode;
		hide?: boolean;
	}>;
	defaultValues: DefaultValues<FormData>;
	FormComponent: React.FC<{
		item?: T | null;
		onSubmit: SubmitHandler<FormData>;
		onClose: () => void;
	}>;
	ViewComponent: React.FC<{ item: T; onClose: () => void }>;
	convertItemForUpdate?: (item: T) => FormData;
	onBeforeSave?: (data: FormData) => FormData;
	onBeforeDelete?: (id: string) => boolean | Promise<boolean>;
	itemsPerPage?: number;
	filterOptions?: Array<{ value: string; label: string }>;
}

export default function PageFactory<
	T extends { id: string },
	FormData extends FieldValues
>({
	title,
	apiEndpoint,
	schema,
	requiredRole,
	columns,
	defaultValues,
	FormComponent,
	ViewComponent,
	convertItemForUpdate,
	onBeforeSave,
	onBeforeDelete,
	itemsPerPage = 10,
	filterOptions,
}: DataManagementProps<T, FormData>) {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [modal, setModal] = useState<ModalState<T>>({
		isOpen: false,
		type: null,
	});
	const [filterStatus, setFilterStatus] = useState<string>("all");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof T;
		direction: "asc" | "desc";
	}>({
		key:
			columns.find((col) => col.sortable !== false)?.key || ("id" as keyof T),
		direction: "asc",
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);

	const {
		data: response,
		error,
		mutate,
	} = useSWR<{
		items: T[];
		pagination: {
			currentPage: number;
			pageSize: number;
			totalItems: number;
			totalPages: number;
		};
	}>(
		status === "authenticated"
			? `${apiEndpoint}?page=${currentPage}&pageSize=${itemsPerPage}&search=${searchTerm}&status=${filterStatus}`
			: null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
		}
	);

	const items = response?.items || [];
	const pagination = response?.pagination;

	const sortedItems = useMemo(() => {
		if (!items.length) return [];

		return [...items].sort((a, b) => {
			const valueA = a[sortConfig.key] ?? "";
			const valueB = b[sortConfig.key] ?? "";

			if (valueA < valueB) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (valueA > valueB) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [items, sortConfig]);

	useEffect(() => {
		if (status === "unauthenticated") {
			showToast({
				title: "Authentication Error",
				description: `Please sign in${
					requiredRole ? ` as ${requiredRole}` : ""
				} to manage ${title.toLowerCase()}.`,
				variant: "error",
			});
			router.push("/auth/signin");
		}
	}, [status, router, requiredRole, title]);

	const handleSort = (key: keyof T) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const openModal = (type: ModalType, item: T | null = null) => {
		if (type === "update" && item && convertItemForUpdate) {
			const formData = convertItemForUpdate(item);
			methods.reset(formData);
		}
		setModal({ isOpen: true, type, item });
	};

	const closeModal = () => {
		setModal({ isOpen: false, type: null, item: null });
	};

	// Form methods for modal interactions
	const methods = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues,
	});

	// Handle single item creation/update
	const onSubmit: SubmitHandler<FormData> = async (data) => {
		try {
			let processedData = data;
			if (onBeforeSave) {
				processedData = onBeforeSave(data);
			}

			const endpoint =
				modal.type === "add" ? apiEndpoint : `${apiEndpoint}/${modal.item?.id}`;

			const method = modal.type === "add" ? "POST" : "PUT";

			const response = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(processedData),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: `${title} ${
					modal.type === "add" ? "added" : "updated"
				} successfully!`,
				variant: "success",
			});

			mutate(); // Refresh data
			setModal({ isOpen: false, type: null });
		} catch (error) {
			console.error(error);
			showToast({
				title: "Error",
				description: `Failed to ${
					modal.type
				} ${title.toLowerCase()}. Please try again.`,
				variant: "error",
			});
		}
	};

	// Bulk update items
	const handleBulkUpdate = async (updateData: Partial<T>) => {
		try {
			const response = await fetch(`${apiEndpoint}/bulk`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ids: selectedItems,
					data: updateData,
				}),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: `Selected ${title.toLowerCase()} updated successfully!`,
				variant: "success",
			});

			mutate();
			setSelectedItems([]);
			setModal({ isOpen: false, type: null });
		} catch (error) {
			showToast({
				title: "Error",
				description: `Bulk update failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				variant: "error",
			});
		}
	};

	// Bulk delete items
	const handleBulkDelete = async () => {
		const confirmed = window.confirm(
			`Are you sure you want to delete ${
				selectedItems.length
			} ${title.toLowerCase()}?`
		);
		if (!confirmed) return;

		try {
			const response = await fetch(`${apiEndpoint}/bulk`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: selectedItems }),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: `Selected ${title.toLowerCase()} deleted successfully!`,
				variant: "success",
			});

			mutate();
			setSelectedItems([]);
			setModal({ isOpen: false, type: null });
		} catch (error) {
			showToast({
				title: "Error",
				description: `Bulk deletion failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				variant: "error",
			});
		}
	};

	// Handle single item deletion
	const handleDeleteItem = async (itemId: string) => {
		try {
			if (onBeforeDelete) {
				const shouldContinue = await onBeforeDelete(itemId);
				if (!shouldContinue) return;
			}

			const response = await fetch(`${apiEndpoint}/${itemId}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: `${title} deleted successfully!`,
				variant: "success",
			});

			mutate();
			setModal({ isOpen: false, type: null });
		} catch (error) {
			showToast({
				title: "Error",
				description: `Deletion failed: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				variant: "error",
			});
		}
	};

	// Toggle item selection for bulk operations
	const toggleItemSelection = (itemId: string) => {
		setSelectedItems((prev) =>
			prev.includes(itemId)
				? prev.filter((id) => id !== itemId)
				: [...prev, itemId]
		);
	};

	// Export functions
	const fetchAllItems = async (): Promise<T[]> => {
		try {
			const response = await fetch(`${apiEndpoint}/all`);
			if (!response.ok)
				throw new Error(`Failed to fetch ${title.toLowerCase()}`);
			return await response.json();
		} catch (error) {
			console.error(`Error fetching ${title.toLowerCase()}:`, error);
			return [];
		}
	};

	const convertToXML = (items: T[]): string => {
		const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
		const itemTag = title.toLowerCase().replace(/\s+/g, "");
		const xmlBody = items
			.map(
				(item) => `
        <${itemTag}>
            ${Object.entries(item)
							.map(([key, value]) => `<${key}>${value}</${key}>`)
							.join("")}
        </${itemTag}>`
			)
			.join("");
		return `${xmlHeader}<${itemTag}s>${xmlBody}</${itemTag}s>`;
	};

	const handleExport = async (format: "json" | "csv" | "xml") => {
		try {
			const items = await fetchAllItems();

			let data: string;
			switch (format) {
				case "json":
					data = JSON.stringify(items, null, 2);
					break;

				case "csv":
					data = Papa.unparse(items);
					break;

				case "xml":
					data = convertToXML(items);
					break;
			}

			const blob = new Blob([data], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${title
				.toLowerCase()
				.replace(/\s+/g, "-")}-${new Date().toISOString()}.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Export failed:", error);
			showToast({
				title: "Export Error",
				description: "Failed to generate export file",
				variant: "destructive",
			});
		}
	};

	// Import functions
	const parseCSV = (csvContent: string): T[] => {
		const results = Papa.parse(csvContent, {
			header: true,
			skipEmptyLines: true,
			transform: (value) => value.trim() || null,
		});

		return results.data as T[];
	};

	const parseXML = (xmlContent: string): T[] => {
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "",
			parseTagValue: false,
			trimValues: true,
			allowBooleanAttributes: true,
			transformTagName: (tagName) => tagName.toLowerCase(),
		});

		const parsed = parser.parse(xmlContent);
		const itemTag = title.toLowerCase().replace(/\s+/g, "");
		const itemsTag = `${itemTag}s`;

		return Array.isArray(parsed[itemsTag][itemTag])
			? parsed[itemsTag][itemTag]
			: [parsed[itemsTag][itemTag]];
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			let items: T[] = [];

			if (file.name.endsWith(".csv")) {
				items = parseCSV(text);
			} else if (file.name.endsWith(".xml")) {
				items = parseXML(text);
			} else if (file.name.endsWith(".json")) {
				items = JSON.parse(text);
			}

			const response = await fetch(`${apiEndpoint}/bulk/import`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(items),
			});

			if (!response.ok) throw new Error(await response.text());

			const result: BulkOperationResult<T> = await response.json();

			if (result.failed.length > 0) {
				showToast({
					title: "Partial Success",
					description: `${result.success} ${title.toLowerCase()} imported, ${
						result.failed.length
					} failed.`,
					variant: "warning",
				});
			} else {
				showToast({
					title: "Success",
					description: `${
						result.success
					} ${title.toLowerCase()} imported successfully!`,
					variant: "success",
				});
			}

			mutate();
		} catch (error) {
			showToast({
				title: "Import Error",
				description:
					error instanceof Error ? error.message : "Invalid file format",
				variant: "destructive",
			});
		}
	};

	// Render logic
	if (status === "loading") {
		return <Loading text="Loading ..." />;
	}

	if (
		status === "unauthenticated" ||
		(requiredRole && session?.user.role !== requiredRole)
	) {
		return null;
	}

	if (error) {
		return (
			<div className="text-center p-4 text-[var(--color-destructive)]">
				Error loading {title.toLowerCase()}: {error.message}
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />

			{/* Bulk Actions Section */}
			{selectedItems.length > 0 && (
				<div className="mb-4 flex justify-between items-center bg-[var(--color-accent)] p-3 rounded">
					<span>
						{selectedItems.length} {title.toLowerCase()} selected
					</span>
					<div className="space-x-2">
						<Button
							onClick={() => setModal({ isOpen: true, type: "bulk-update" })}
							className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
						>
							Bulk Update
						</Button>
						<Button
							onClick={() => setModal({ isOpen: true, type: "bulk-delete" })}
							className="bg-[var(--color-destructive)] text-white px-4 py-2 rounded"
						>
							Bulk Delete
						</Button>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-[var(--color-foreground)]">
					{title} Management
				</h2>
				<div className="space-x-2">
					<Button onClick={() => openModal("add")}>Add New {title}</Button>
				</div>
			</div>

			<h4 className="text-base font-medium text-[var(--color-foreground)]">
				Bulk Operations
			</h4>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-1.5">
					<label htmlFor="">Import {title.toLowerCase()} from a file</label>
					<Input
						type="file"
						accept=".json,.xml,.csv"
						onChange={handleFileUpload}
						className="w-xl max-w-2xl"
					/>
				</div>

				<div className="space-x-2">
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("json")}
					>
						Export as JSON
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("csv")}
					>
						Export as CSV
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("xml")}
					>
						Export as XML
					</Button>
				</div>
			</div>

			{/* Search and Filter */}
			<div className="mb-6 w-full flex flex-col sm:flex-row gap-4 sm:items-center">
				<Input
					type="text"
					placeholder={`Search ${title.toLowerCase()} by name, address, or other fields...`}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full sm:flex-1 focus:border-[var(--color-primary)] p-2 rounded"
				/>
				{filterOptions && (
					<select
						value={filterStatus}
						onChange={(e) => setFilterStatus(e.target.value)}
						className="border border-gray-300 rounded p-2 focus:outline-none focus:border-[var(--color-primary)]"
					>
						{filterOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				)}
			</div>

			{/* Table */}
			<Table className="w-full border-collapse">
				<TableHeader>
					<TableRow>
						<TableHead>
							<Checkbox
								checked={
									selectedItems.length === items.length && items.length > 0
								}
								onCheckedChange={(checked) =>
									setSelectedItems(checked ? items.map((item) => item.id) : [])
								}
							/>
						</TableHead>
						{columns
							.filter((col) => !col.hide)
							.map((column) => (
								<TableHead
									key={String(column.key)}
									className={column.sortable !== false ? "cursor-pointer" : ""}
									onClick={() =>
										column.sortable !== false && handleSort(column.key)
									}
								>
									{column.label}{" "}
									{sortConfig.key === column.key &&
										(sortConfig.direction === "asc" ? "↑" : "↓")}
								</TableHead>
							))}
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedItems.map((item) => (
						<TableRow key={item.id}>
							<TableCell>
								<Checkbox
									checked={selectedItems.includes(item.id)}
									onCheckedChange={() => toggleItemSelection(item.id)}
								/>
							</TableCell>
							{columns
								.filter((col) => !col.hide)
								.map((column) => (
									<TableCell key={String(column.key)}>
										{column.render
											? column.render(item[column.key], item)
											: (item[column.key] as string) || "N/A"}
									</TableCell>
								))}
							<TableCell>
								<div className="flex space-x-2">
									<Button size="sm" onClick={() => openModal("view", item)}>
										View
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onClick={() => openModal("update", item)}
									>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => openModal("delete", item)}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Pagination */}
			{pagination && (
				<div className="mt-4 flex justify-between items-center">
					<span>
						Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
						{Math.min(currentPage * itemsPerPage, pagination?.totalItems || 0)}{" "}
						of {pagination?.totalItems || 0} {title.toLowerCase()}
					</span>
					<div className="space-x-2">
						<Button
							variant="outline"
							onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							onClick={() => setCurrentPage((prev) => prev + 1)}
							disabled={currentPage === (pagination?.totalPages || 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Form Modal */}
			<ModalCard
				isOpen={modal.type === "add" || modal.type === "update"}
				onClose={closeModal}
				title={modal.type === "add" ? `Add New ${title}` : `Edit ${title}`}
			>
				<FormComponent
					item={modal.item}
					onSubmit={onSubmit}
					onClose={closeModal}
				/>
			</ModalCard>

			{/* View Modal */}
			<ModalCard
				isOpen={modal.type === "view"}
				onClose={closeModal}
				title={`${title} Details`}
			>
				{modal.item && <ViewComponent item={modal.item} onClose={closeModal} />}
			</ModalCard>

			{/* Delete Confirmation Modal */}
			<ModalCard
				isOpen={modal.type === "delete"}
				onClose={closeModal}
				title="Confirm Deletion"
			>
				{modal.item && (
					<div className="space-y-4">
						<p>
							Are you sure you want to delete this {title.toLowerCase()}? This
							action cannot be undone.
						</p>
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={closeModal}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => handleDeleteItem(modal.item!.id)}
							>
								Delete {title}
							</Button>
						</div>
					</div>
				)}
			</ModalCard>

			{/* Bulk Update Modal */}
			<ModalCard
				isOpen={modal.type === "bulk-update"}
				onClose={closeModal}
				title={`Bulk Update ${title}`}
			>
				<div className="space-y-4">
					<p>
						Update common fields for {selectedItems.length}{" "}
						{title.toLowerCase()}
					</p>
					{/* Implement bulk update form here, specific to your entity */}
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={closeModal}>
							Cancel
						</Button>
						<Button onClick={() => handleBulkUpdate({})}>Apply Changes</Button>
					</div>
				</div>
			</ModalCard>

			{/* Bulk Delete Modal */}
			<ModalCard
				isOpen={modal.type === "bulk-delete"}
				onClose={closeModal}
				title={`Bulk Delete ${title}`}
			>
				<div className="space-y-4">
					<p>
						Are you sure you want to delete {selectedItems.length}{" "}
						{title.toLowerCase()}? This action cannot be undone.
					</p>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={closeModal}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleBulkDelete}>
							Confirm Delete
						</Button>
					</div>
				</div>
			</ModalCard>
		</div>
	);
}
