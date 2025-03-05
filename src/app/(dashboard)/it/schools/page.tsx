"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import useSWR from "swr";
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

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
	type: "add" | "view" | "update" | "delete" | null;
	school: School | null;
}

// Define the school schema using Zod, aligned with validation requirements
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

export default function ITSchools() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [modal, setModal] = useState<ModalState>({
		isOpen: false,
		type: null,
		school: null,
	});
	const [searchTerm, setSearchTerm] = useState("");
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
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const {
		data: schools,
		error,
		mutate,
	} = useSWR<School[]>(
		status === "authenticated" ? "/api/it/schools" : null,
		fetcher,
		{ revalidateOnFocus: false, revalidateOnReconnect: true }
	);

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

	// Filter, search, and sort schools
	const filteredSchools = useMemo(() => {
		let filtered = schools || [];

		// Search
		if (searchTerm) {
			filtered = filtered.filter(
				(school) =>
					school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
					school.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
					(school.city?.toLowerCase() || "").includes(
						searchTerm.toLowerCase()
					) ||
					(school.state?.toLowerCase() || "").includes(searchTerm.toLowerCase())
			);
		}

		// Filter by status (simplified for this example; assume all schools are active unless specified)
		if (filterStatus === "active") {
			filtered = filtered.filter((school) => true);
		} else if (filterStatus === "inactive") {
			filtered = filtered.filter((school) => false);
		}

		// Sort
		filtered.sort((a, b) => {
			const valueA = a[sortConfig.key] ?? "";
			const valueB = b[sortConfig.key] ?? "";
			const comparisonResult = valueA
				.toString()
				.localeCompare(valueB.toString());
			return sortConfig.direction === "asc"
				? comparisonResult
				: -comparisonResult;
		});

		return filtered;
	}, [schools, searchTerm, filterStatus, sortConfig]);

	// Pagination
	const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
	const paginatedSchools = filteredSchools.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

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
		setModal({ isOpen: true, type, school });
	};

	const closeModal = () => {
		setModal({ isOpen: false, type: null, school: null });
	};

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

	const onSubmit: SubmitHandler<SchoolFormData> = async (data) => {
		try {
			if (modal.type === "add") {
				const response = await fetch("/api/it/schools", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: data.name,
						address: data.address,
						city: data.city || null,
						state: data.state || null,
						zipCode: data.zipCode || null,
						country: data.country,
						phone: data.phone,
						email: data.email,
						website: data.website || null,
					}),
				});
				if (!response.ok) throw new Error(await response.text());
				const school = await response.json();
				mutate();
				showToast({
					title: "Success",
					description: "School added successfully!",
					variant: "success",
				});
			} else if (modal.type === "update" && modal.school) {
				const response = await fetch(`/api/it/schools/${modal.school.id}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: data.name,
						address: data.address,
						city: data.city || null,
						state: data.state || null,
						zipCode: data.zipCode || null,
						country: data.country,
						phone: data.phone,
						email: data.email,
						website: data.website || null,
					}),
				});
				if (!response.ok) throw new Error(await response.text());
				mutate();
				showToast({
					title: "Success",
					description: "School updated successfully!",
					variant: "success",
				});
			}
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: `Failed to ${modal.type} school: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				variant: "error",
			});
		}
	};

	const handleDeleteSchool = async (schoolId: string) => {
		try {
			const response = await fetch(`/api/it/schools/${schoolId}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(await response.text());
			mutate();
			showToast({
				title: "Success",
				description: "School deleted successfully!",
				variant: "success",
			});
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: `Failed to delete school: ${
					error instanceof Error ? error.message : "Unknown error"
				}`,
				variant: "error",
			});
		}
	};

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-[var(--color-foreground)]">
					School Management
				</h2>
				<Button
					onClick={() => openModal("add", null)}
					className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-4 py-2 rounded"
				>
					Add New School
				</Button>
			</div>

			{/* Search and Filter */}
			<div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
				<Input
					type="text"
					placeholder="Search schools by name, address, or city..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="flex-1 focus:border-[var(--color-primary)] p-2 rounded"
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

			{/* Data Table */}
			<Table className="w-full border-collapse">
				<TableCaption className="text-[var(--color-foreground)] text-center py-2">
					List of Schools
				</TableCaption>
				<TableHeader className="bg-gray-100">
					<TableRow>
						<TableHead
							className="cursor-pointer text-[var(--color-foreground)] p-3"
							onClick={() => handleSort("name")}
						>
							School Name{" "}
							{sortConfig.key === "name" &&
								(sortConfig.direction === "asc" ? "↑" : "↓")}
						</TableHead>
						<TableHead
							className="cursor-pointer text-[var(--color-foreground)] p-3"
							onClick={() => handleSort("address")}
						>
							Address{" "}
							{sortConfig.key === "address" &&
								(sortConfig.direction === "asc" ? "↑" : "↓")}
						</TableHead>
						<TableHead className="text-[var(--color-foreground)] p-3">
							City
						</TableHead>
						<TableHead className="text-[var(--color-foreground)] p-3">
							Country
						</TableHead>
						<TableHead className="text-[var(--color-foreground)] p-3">
							Actions
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{paginatedSchools.map((school) => (
						<TableRow key={school.id} className="border-b border-gray-200">
							<TableCell className="text-[var(--color-foreground)] p-3">
								{school.name}
							</TableCell>
							<TableCell className="text-[var(--color-foreground)] p-3">
								{school.address}
							</TableCell>
							<TableCell className="text-[var(--color-foreground)] p-3">
								{school.city || "N/A"}
							</TableCell>
							<TableCell className="text-[var(--color-foreground)] p-3">
								{school.country}
							</TableCell>
							<TableCell className="p-3">
								<div className="space-x-1">
									<Button
										size="sm"
										onClick={() => openModal("view", school)}
										className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-2 py-1 rounded"
									>
										View
									</Button>
									<Button
										size="sm"
										onClick={() => openModal("update", school)}
										className="bg-mellow-apricot text-[var(--color-foreground)] hover:bg-[var(--color-primary-hover)] px-2 py-1 rounded"
									>
										Update
									</Button>
									<Button
										size="sm"
										onClick={() => openModal("delete", school)}
										className="bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-primary)] px-2 py-1 rounded"
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
			<div className="mt-6 flex justify-center items-center space-x-4">
				<Button
					onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
					disabled={currentPage === 1}
					className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-4 py-2 rounded"
				>
					Previous
				</Button>
				<span className="text-[var(--color-foreground)] text-lg">{`Page ${currentPage} of ${totalPages}`}</span>
				<Button
					onClick={() =>
						setCurrentPage((prev) => Math.min(prev + 1, totalPages))
					}
					disabled={currentPage === totalPages}
					className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-4 py-2 rounded"
				>
					Next
				</Button>
			</div>

			{/* Modals */}
			<ModalCard
				title={
					modal.type === "add"
						? "Add New School"
						: modal.type === "view"
						? "View School Details"
						: modal.type === "update"
						? "Update School"
						: "Delete School"
				}
				isOpen={modal.isOpen}
				onClose={closeModal}
				className="bg-[var(--color-accent)] border-[var(--color-primary)] max-w-2xl w-full p-6 rounded-lg shadow-lg"
			>
				<FormProvider {...methods}>
					<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
						{modal.type === "add" && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										{...methods.register("name")}
										error={methods.formState.errors.name?.message}
										placeholder="School Name"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("address")}
										error={methods.formState.errors.address?.message}
										placeholder="Address"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("city")}
										error={methods.formState.errors.city?.message}
										placeholder="City (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("state")}
										error={methods.formState.errors.state?.message}
										placeholder="State (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("zipCode")}
										error={methods.formState.errors.zipCode?.message}
										placeholder="Zip Code (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("country")}
										error={methods.formState.errors.country?.message}
										placeholder="Country"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("phone")}
										error={methods.formState.errors.phone?.message}
										placeholder="Phone"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("email")}
										error={methods.formState.errors.email?.message}
										placeholder="Email"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("website")}
										error={methods.formState.errors.website?.message}
										placeholder="Website (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
								</div>
								<Button
									type="submit"
									className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-4 py-2 rounded w-full md:w-auto"
								>
									Add School
								</Button>
							</div>
						)}
						{modal.type === "view" && modal.school && (
							<div className="space-y-4">
								<p className="text-[var(--color-foreground)]">
									<strong>Name:</strong> {modal.school.name}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Address:</strong> {modal.school.address}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>City:</strong> {modal.school.city || "N/A"}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>State:</strong> {modal.school.state || "N/A"}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Zip Code:</strong> {modal.school.zipCode || "N/A"}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Country:</strong> {modal.school.country}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Phone:</strong> {modal.school.phone}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Email:</strong> {modal.school.email}
								</p>
								<p className="text-[var(--color-foreground)]">
									<strong>Website:</strong> {modal.school.website || "N/A"}
								</p>
							</div>
						)}
						{modal.type === "update" && modal.school && (
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<Input
										{...methods.register("name", { value: modal.school.name })}
										error={methods.formState.errors.name?.message}
										placeholder="School Name"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("address", {
											value: modal.school.address,
										})}
										error={methods.formState.errors.address?.message}
										placeholder="Address"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("city", {
											value: modal.school.city || "",
										})}
										error={methods.formState.errors.city?.message}
										placeholder="City (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("state", {
											value: modal.school.state || "",
										})}
										error={methods.formState.errors.state?.message}
										placeholder="State (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("zipCode", {
											value: modal.school.zipCode || "",
										})}
										error={methods.formState.errors.zipCode?.message}
										placeholder="Zip Code (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("country", {
											value: modal.school.country,
										})}
										error={methods.formState.errors.country?.message}
										placeholder="Country"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("phone", {
											value: modal.school.phone,
										})}
										error={methods.formState.errors.phone?.message}
										placeholder="Phone"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("email", {
											value: modal.school.email,
										})}
										error={methods.formState.errors.email?.message}
										placeholder="Email"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
									<Input
										{...methods.register("website", {
											value: modal.school.website || "",
										})}
										error={methods.formState.errors.website?.message}
										placeholder="Website (optional)"
										className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)]"
									/>
								</div>
								<Button
									type="submit"
									className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] px-4 py-2 rounded w-full md:w-auto"
								>
									Update School
								</Button>
							</div>
						)}
						{modal.type === "delete" && modal.school && (
							<div className="space-y-4 text-[var(--color-foreground)]">
								<p>
									Are you sure you want to delete{" "}
									<strong>{modal.school.name}</strong>?
								</p>
								<div className="flex justify-end space-x-2">
									<Button
										onClick={closeModal}
										variant="outline"
										className="border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-foreground)] px-4 py-2 rounded"
									>
										Cancel
									</Button>
									<Button
										onClick={() => handleDeleteSchool(modal.school!.id)}
										className="bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-primary)] px-4 py-2 rounded"
									>
										Confirm Delete
									</Button>
								</div>
							</div>
						)}
					</form>
				</FormProvider>
			</ModalCard>
		</div>
	);
}
