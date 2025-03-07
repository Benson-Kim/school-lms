"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
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
	TableCaption,
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

// Fetcher function with error handling
const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch");
	}
	return response.json();
};

interface School {
	id: string;
	name: string;
	address: string;
	city?: string | null;
	state?: string | null;
	zipCode?: string | null;
	country: string;
	phone: string;
	email: string;
	website?: string | null;
}

interface ModalState {
	isOpen: boolean;
	type:
		| "add"
		| "view"
		| "update"
		| "delete"
		| "bulk-update"
		| "bulk-delete"
		| null;
	school?: School | null;
}

interface BulkOperationResult {
	success: number;
	failed: Array<{
		data: School;
		error: string;
	}>;
}

interface EditFormProps {
	school?: School | null;
	onSubmit: SubmitHandler<SchoolFormData>;
	onClose: () => void;
}

// Zod schema for school validation
const schoolSchema = z.object({
	name: z.string().min(1, "School name is required"),
	address: z.string().min(1, "Address is required"),
	city: z.string().nullable().optional(),
	state: z.string().nullable().optional(),
	zipCode: z.string().nullable().optional(),
	country: z.string().min(1, "Country is required"),
	phone: z.string().min(1, "Phone is required"),
	email: z.string().email("Invalid email").min(1, "Email is required"),
	website: z.string().url().nullable().optional(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

export default function SchoolManagement() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [modal, setModal] = useState<ModalState>({
		isOpen: false,
		type: null,
		school: null,
	});
	const [filterStatus, setFilterStatus] = useState<
		"active" | "inactive" | "all"
	>("all");
	const [sortConfig, setSortConfig] = useState<{
		key: keyof School;
		direction: "asc" | "desc";
	}>({
		key: "name",
		direction: "asc",
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const {
		data: schoolsResponse,
		error,
		mutate,
	} = useSWR<{
		schools: School[];
		pagination: {
			currentPage: number;
			pageSize: number;
			totalItems: number;
			totalPages: number;
		};
	}>(
		status === "authenticated"
			? `/api/it/schools?page=${currentPage}&pageSize=${itemsPerPage}&search=${searchTerm}&status=${filterStatus}`
			: null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
		}
	);

	const schools = schoolsResponse?.schools || [];
	const pagination = schoolsResponse?.pagination;

	const sortedSchools = useMemo(() => {
		if (!schools) return [];

		return [...schools].sort((a, b) => {
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
	}, [schools, sortConfig]);

	useEffect(() => {
		if (status === "unauthenticated") {
			showToast({
				title: "Authentication Error",
				description: "Please sign in as IT to manage schools.",
				variant: "error",
			});
			router.push("/auth/signin");
		}
	}, [status, router]);

	const handleSort = (key: keyof School) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const openModal = (
		type: ModalState["type"],
		school: School | null = null
	) => {
		if (type === "update" && school) {
			methods.reset({
				name: school.name,
				address: school.address,
				city: school.city || null,
				state: school.state || null,
				zipCode: school.zipCode || null,
				country: school.country,
				phone: school.phone,
				email: school.email,
				website: school.website || null,
			});
		}
		setModal({ isOpen: true, type, school });
	};

	const closeModal = () => {
		setModal({ isOpen: false, type: null, school: null });
	};

	// Form methods for modal interactions
	const methods = useForm<SchoolFormData>({
		resolver: zodResolver(schoolSchema),
		defaultValues: {
			name: "",
			address: "",
			city: null,
			state: null,
			zipCode: null,
			country: "",
			phone: "",
			email: "",
			website: null,
		},
	});

	// Handle single school creation
	const onSubmit: SubmitHandler<SchoolFormData> = async (data) => {
		try {
			const endpoint =
				modal.type === "add"
					? "/api/it/schools"
					: `/api/it/schools/${modal.school?.id}`;

			const method = modal.type === "add" ? "POST" : "PUT";

			const response = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: `School ${
					modal.type === "add" ? "added" : "updated"
				} successfully!`,
				variant: "success",
			});

			mutate(); // Refresh data
			setModal({ isOpen: false, type: null });
		} catch (error) {
			console.error(error); // Log the error for debugging
			showToast({
				title: "Error",
				description: `Failed to ${modal.type} school. Please try again.`,
				variant: "error",
			});
		}
	};

	// Bulk update schools
	const handleBulkUpdate = async () => {
		try {
			const response = await fetch("/api/it/schools/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					selectedSchools.map((id) => {
						const school = schoolsResponse?.schools.find((s) => s.id === id);
						return { id, name: school?.name, address: school?.address }; // Example: Only send necessary fields
					})
				),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: "Selected schools updated successfully!",
				variant: "success",
			});

			mutate();
			setSelectedSchools([]);
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

	// Bulk delete schools
	const handleBulkDelete = async () => {
		const confirmed = window.confirm(
			`Are you sure you want to delete ${selectedSchools.length} schools?`
		);
		if (!confirmed) return;

		try {
			const response = await fetch("/api/it/schools/bulk", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: selectedSchools }),
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: "Selected schools deleted successfully!",
				variant: "success",
			});

			mutate();
			setSelectedSchools([]);
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

	// Handle single school deletion
	const handleDeleteSchool = async (schoolId: string) => {
		try {
			const response = await fetch(`/api/it/schools/${schoolId}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error(await response.text());

			showToast({
				title: "Success",
				description: "School deleted successfully!",
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

	// Toggle school selection for bulk operations
	const toggleSchoolSelection = (schoolId: string) => {
		setSelectedSchools((prev) =>
			prev.includes(schoolId)
				? prev.filter((id) => id !== schoolId)
				: [...prev, schoolId]
		);
	};

	const convertToXML = (schools: School[]): string => {
		const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
		const xmlBody = schools
			.map(
				(school) => `
        <school>
            ${Object.entries(school)
							.map(([key, value]) => `<${key}>${value}</${key}>`)
							.join("")}
        </school>`
			)
			.join("");
		return `${xmlHeader}<schools>${xmlBody}</schools>`;
	};

	const convertToCSV = (schools: School[]): string => {
		const headers = Object.keys(schools[0]).join(",");
		const rows = schools.map((school) => Object.values(school).join(","));
		return `${headers}\n${rows.join("\n")}`;
	};

	const downloadFile = (data: string, filename: string) => {
		const blob = new Blob([data], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	};

	const fetchSchools = async (): Promise<School[]> => {
		try {
			const response = await fetch("/api/it/schools");
			if (!response.ok) throw new Error("Failed to fetch schools");
			return await response.json();
		} catch (error) {
			console.error("Error fetching schools:", error);
			return [];
		}
	};

	const parseCSV = (csvContent: string): School[] => {
		const results = Papa.parse(csvContent, {
			header: true,
			skipEmptyLines: true,
			transform: (value, header) => {
				// Convert empty strings to null for optional fields
				if (header === "website" && value.trim() === "") return null;
				return value.trim();
			},
		});

		return results.data as School[];
	};

	const parseXML = (xmlContent: string): School[] => {
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: "",
			parseTagValue: false,
			trimValues: true,
			allowBooleanAttributes: true,
			transformTagName: (tagName) => tagName.toLowerCase(), // Ensure consistent field names
		});

		const parsed = parser.parse(xmlContent);
		const schools = parsed.schools.school;

		// Convert empty website fields to null
		return schools.map((school: any) => ({
			...school,
			website: school.website?.trim() || null,
		}));
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const text = await file.text();
			let schools: School[] = [];

			if (file.name.endsWith(".csv")) {
				schools = parseCSV(text);
			} else if (file.name.endsWith(".xml")) {
				schools = parseXML(text);
			} else if (file.name.endsWith(".json")) {
				schools = JSON.parse(text);
			}

			const result = await handleBulkImport(schools);

			if (result.failed.length > 0) {
				showToast({
					title: "Partial Success",
					description: `${result.success} schools imported, ${result.failed.length} failed.`,
					variant: "warning",
				});
			} else {
				showToast({
					title: "Success",
					description: `${result.success} schools imported successfully!`,
					variant: "success",
				});
			}
		} catch (error) {
			showToast({
				title: "Import Error",
				description:
					error instanceof Error ? error.message : "Invalid file format",
				variant: "destructive",
			});
		}
	};

	const handleExport = async (format: "json" | "csv" | "xml") => {
		try {
			const schools = await fetchSchools();

			let data: string;
			switch (format) {
				case "json":
					data = JSON.stringify(schools, null, 2);
					break;

				case "csv":
					data = Papa.unparse(schools);
					break;

				case "xml":
					data = `<schools>${schools
						.map(
							(school) =>
								`<school>${Object.entries(school)
									.map(([key, value]) => `<${key}>${value}</${key}>`)
									.join("")}</school>`
						)
						.join("")}</schools>`;
					break;
			}

			const blob = new Blob([data], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `schools-${new Date().toISOString()}.${format}`;
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

	const handleBulkImport = async (schools: School[]) => {
		const results: BulkOperationResult = {
			success: 0,
			failed: [],
		};

		for (const school of schools) {
			try {
				const response = await fetch("/api/it/schools/bulk", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(schools),
				});

				if (!response.ok) throw new Error(await response.text());

				mutate(); // Refresh data
			} catch (error) {
				results.failed.push({
					data: school,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return results;
	};

	const AddSchoolForm = ({
		onSubmit,
		onClose,
	}: {
		onSubmit: SubmitHandler<SchoolFormData>;
		onClose: () => void;
	}) => {
		const methods = useForm<SchoolFormData>({
			resolver: zodResolver(schoolSchema),
			defaultValues: {
				name: "",
				address: "",
				city: "",
				state: "",
				zipCode: "",
				country: "",
				phone: "",
				email: "",
				website: "",
			},
		});

		return (
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
					<Input
						label="School Name"
						{...methods.register("name")}
						error={methods.formState.errors.name?.message}
					/>
					<Input
						label="Address"
						{...methods.register("address")}
						error={methods.formState.errors.address?.message}
					/>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="City"
							{...methods.register("city")}
							error={methods.formState.errors.city?.message}
						/>
						<Input
							label="State"
							{...methods.register("state")}
							error={methods.formState.errors.state?.message}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Zip Code"
							{...methods.register("zipCode")}
							error={methods.formState.errors.zipCode?.message}
						/>
						<Input
							label="Country"
							{...methods.register("country")}
							error={methods.formState.errors.country?.message}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Phone"
							{...methods.register("phone")}
							error={methods.formState.errors.phone?.message}
						/>
						<Input
							label="Email"
							type="email"
							{...methods.register("email")}
							error={methods.formState.errors.email?.message}
						/>
					</div>
					<Input
						label="Website"
						{...methods.register("website")}
						error={methods.formState.errors.website?.message}
					/>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Create School</Button>
					</div>
				</form>
			</FormProvider>
		);
	};

	const EditSchoolForm = ({ school, onSubmit, onClose }: EditFormProps) => {
		const methods = useForm<SchoolFormData>({
			resolver: zodResolver(schoolSchema),
			defaultValues: {
				name: school?.name || "",
				address: school?.address || "",
				city: school?.city || "",
				state: school?.state || "",
				zipCode: school?.zipCode || "",
				country: school?.country || "",
				phone: school?.phone || "",
				email: school?.email || "",
				website: school?.website || "",
			},
		});

		return (
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
					<Input
						label="School Name"
						{...methods.register("name")}
						error={methods.formState.errors.name?.message}
					/>
					<Input
						label="Address"
						{...methods.register("address")}
						error={methods.formState.errors.address?.message}
					/>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="City"
							{...methods.register("city")}
							error={methods.formState.errors.city?.message}
						/>
						<Input
							label="State"
							{...methods.register("state")}
							error={methods.formState.errors.state?.message}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Zip Code"
							{...methods.register("zipCode")}
							error={methods.formState.errors.zipCode?.message}
						/>
						<Input
							label="Country"
							{...methods.register("country")}
							error={methods.formState.errors.country?.message}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<Input
							label="Phone"
							{...methods.register("phone")}
							error={methods.formState.errors.phone?.message}
						/>
						<Input
							label="Email"
							type="email"
							{...methods.register("email")}
							error={methods.formState.errors.email?.message}
						/>
					</div>
					<Input
						label="Website"
						{...methods.register("website")}
						error={methods.formState.errors.website?.message}
					/>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</div>
				</form>
			</FormProvider>
		);
	};

	// Render logic with pagination and error handling
	if (status === "loading") {
		return <div className="text-center p-4">Loading...</div>;
	}

	if (status === "unauthenticated" || session?.user.role !== "IT") {
		return null;
	}

	if (error) {
		return (
			<div className="text-center p-4 text-[var(--color-destructive)]">
				Error loading schools: {error.message}
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />

			{/* Bulk Actions Section */}
			{selectedSchools.length > 0 && (
				<div className="mb-4 flex justify-between items-center bg-[var(--color-accent)] p-3 rounded">
					<span>{selectedSchools.length} schools selected</span>
					<div className="space-x-2">
						<Button
							onClick={() =>
								setModal({
									isOpen: true,
									type: "bulk-update",
								})
							}
							className="bg-[var(--color-primary)] text-white px-4 py-2 rounded"
						>
							Bulk Update
						</Button>
						<Button
							onClick={() =>
								setModal({
									isOpen: true,
									type: "bulk-delete",
								})
							}
							className="bg-[var(--color-destructive)] text-white px-4 py-2 rounded"
						>
							Bulk Delete
						</Button>
					</div>
				</div>
			)}

			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-[var(--color-foreground)]">
					School Management
				</h2>
				<div className="space-x-2">
					<Button onClick={() => openModal("add")}>Add New School</Button>
				</div>
			</div>

			<h4 className="text-base font-medium text-[var(--color-foreground)]">
				Bulk Operations
			</h4>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-1.5">
					<label htmlFor="">Import schools from a file</label>
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
					placeholder="Search schools by name, address, or city..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full sm:flex-1 focus:border-[var(--color-primary)] p-2 rounded"
				/>
				<select
					value={filterStatus}
					onChange={(e) =>
						setFilterStatus(e.target.value as "active" | "inactive" | "all")
					}
					className="border border-gray-300 rounded p-2 focus:outline-none focus:border-[var(--color-primary)]"
				>
					<option value="all">All Schools</option>
					<option value="active">Active Schools</option>
					<option value="inactive">Inactive Schools</option>
				</select>
			</div>

			{/* School Table */}
			<Table className="w-full border-collapse">
				<TableHeader>
					<TableRow>
						<TableHead>
							<Checkbox
								checked={
									selectedSchools.length === schools.length &&
									schools.length > 0
								}
								onCheckedChange={(checked) =>
									setSelectedSchools(checked ? schools.map((s) => s.id) : [])
								}
							/>
						</TableHead>
						<TableHead
							className="cursor-pointer"
							onClick={() => handleSort("name")}
						>
							School Name{" "}
							{sortConfig.key === "name" &&
								(sortConfig.direction === "asc" ? "↑" : "↓")}
						</TableHead>
						<TableHead
							className="cursor-pointer"
							onClick={() => handleSort("address")}
						>
							Address{" "}
							{sortConfig.key === "address" &&
								(sortConfig.direction === "asc" ? "↑" : "↓")}
						</TableHead>
						<TableHead>City</TableHead>
						<TableHead>Country</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedSchools.map((school) => (
						<TableRow key={school.id}>
							<TableCell>
								<Checkbox
									checked={selectedSchools.includes(school.id)}
									onCheckedChange={() => toggleSchoolSelection(school.id)}
								/>
							</TableCell>
							<TableCell>{school.name}</TableCell>
							<TableCell>{school.address}</TableCell>
							<TableCell>{school.city || "N/A"}</TableCell>
							<TableCell>{school.country}</TableCell>
							<TableCell>
								<div className="flex space-x-2">
									<Button size="sm" onClick={() => openModal("view", school)}>
										Manage
									</Button>
									<Button size="sm" onClick={() => openModal("view", school)}>
										View
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onClick={() => openModal("update", school)}
									>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => openModal("delete", school)}
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
			<div className="mt-4 flex justify-between items-center">
				<span>
					Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
					{Math.min(currentPage * itemsPerPage, pagination?.totalItems || 0)} of{" "}
					{pagination?.totalItems || 0} schools
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

			{/* School Form Modal */}
			<ModalCard
				isOpen={modal.type === "add" || modal.type === "update"}
				onClose={closeModal}
				title={modal.type === "add" ? "Add New School" : "Edit School"}
			>
				{modal.type === "add" ? (
					<AddSchoolForm onSubmit={onSubmit} onClose={closeModal} />
				) : (
					<EditSchoolForm
						school={modal.school}
						onSubmit={onSubmit}
						onClose={closeModal}
					/>
				)}
			</ModalCard>

			{/* View School Modal */}
			<ModalCard
				isOpen={modal.type === "view"}
				onClose={closeModal}
				title="School Details"
			>
				{modal.school && (
					<div className="space-y-2">
						<p>
							<strong>Name:</strong> {modal.school.name}
						</p>
						<p>
							<strong>Address:</strong> {modal.school.address}
						</p>
						<p>
							<strong>City:</strong> {modal.school.city || "N/A"}
						</p>
						<p>
							<strong>Country:</strong> {modal.school.country}
						</p>
						<p>
							<strong>Phone:</strong> {modal.school.phone}
						</p>
						<p>
							<strong>Email:</strong> {modal.school.email}
						</p>
						<p>
							<strong>Website:</strong> {modal.school.website || "N/A"}
						</p>
					</div>
				)}
			</ModalCard>

			{/* Delete Confirmation Modal */}
			<ModalCard
				isOpen={modal.type === "delete"}
				onClose={closeModal}
				title="Confirm Deletion"
			>
				{modal.school && (
					<div className="space-y-4">
						<p>
							Are you sure you want to delete{" "}
							<strong>{modal.school.name}</strong>? This action cannot be
							undone.
						</p>
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={closeModal}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => handleDeleteSchool(modal.school!.id)}
							>
								Delete School
							</Button>
						</div>
					</div>
				)}
			</ModalCard>

			{/* Bulk Actions Modals */}
			<ModalCard
				isOpen={modal.type === "bulk-update"}
				onClose={closeModal}
				title="Bulk Update Schools"
			>
				<div className="space-y-4">
					<p>Update common fields for {selectedSchools.length} schools</p>
					<Input
						label="Common Address"
						onChange={(e) => {
							/* Implement bulk address update logic */
						}}
					/>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={closeModal}>
							Cancel
						</Button>
						<Button onClick={handleBulkUpdate}>Apply Changes</Button>
					</div>
				</div>
			</ModalCard>

			<ModalCard
				isOpen={modal.type === "bulk-delete"}
				onClose={closeModal}
				title="Bulk Delete Schools"
			>
				<div className="space-y-4">
					<p>
						Are you sure you want to delete {selectedSchools.length} schools?
						This action cannot be undone.
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
