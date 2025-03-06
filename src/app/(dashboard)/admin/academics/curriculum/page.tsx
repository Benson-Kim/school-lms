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
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import Loading from "@/components/ui/Loading";

const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) throw new Error("Failed to fetch");
	return response.json();
};

interface Curriculum {
	id: string;
	name: string;
	description?: string | null;
	gradeLevels: { id: string; name: string }[];
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
	curriculum?: Curriculum | null;
}

interface BulkOperationResult {
	success: number;
	failed: Array<{ data: Curriculum; error: string }>;
}

const curriculumSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().nullable().optional(),
});

type CurriculumFormData = z.infer<typeof curriculumSchema>;

export default function CurriculumManagement() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null });
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Curriculum;
		direction: "asc" | "desc";
	}>({
		key: "name",
		direction: "asc",
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCurricula, setSelectedCurricula] = useState<string[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const {
		data: curriculaResponse,
		error,
		mutate,
	} = useSWR<{
		curricula: Curriculum[];
		total: number;
	}>(
		status === "authenticated"
			? `/api/admin/academics/curriculum?page=${currentPage}&pageSize=${itemsPerPage}&search=${searchTerm}`
			: null,
		fetcher,
		{ revalidateOnFocus: false, revalidateOnReconnect: true }
	);

	const curricula = curriculaResponse?.curricula || [];
	const total = curriculaResponse?.total || 0;

	const sortedCurricula = useMemo(() => {
		if (!curricula) return [];
		return [...curricula].sort((a, b) => {
			const valueA = a[sortConfig.key] ?? "";
			const valueB = b[sortConfig.key] ?? "";
			if (valueA < valueB) return sortConfig.direction === "asc" ? -1 : 1;
			if (valueA > valueB) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});
	}, [curricula, sortConfig]);

	useEffect(() => {
		if (status === "unauthenticated") {
			showToast({
				title: "Authentication Error",
				description: "Please sign in.",
				variant: "error",
			});
			router.push("/auth/signin");
		}
	}, [status, router]);

	const handleSort = (key: keyof Curriculum) => {
		setSortConfig((prev) => ({
			key,
			direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
		}));
	};

	const openModal = (
		type: ModalState["type"],
		curriculum: Curriculum | null = null
	) => {
		if (type === "update" && curriculum) {
			methods.reset({
				name: curriculum.name,
				description: curriculum.description || null,
			});
		}
		setModal({ isOpen: true, type, curriculum });
	};

	const closeModal = () =>
		setModal({ isOpen: false, type: null, curriculum: null });

	const methods = useForm<CurriculumFormData>({
		resolver: zodResolver(curriculumSchema),
		defaultValues: { name: "", description: null },
	});

	const onSubmit: SubmitHandler<CurriculumFormData> = async (data) => {
		try {
			const endpoint =
				modal.type === "add"
					? "/api/admin/academics/curriculum"
					: `/api/admin/academics/curriculum/${modal.curriculum?.id}`;
			const method = modal.type === "add" ? "POST" : "PUT";
			const response = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error(await response.text());
			showToast({
				title: "Success",
				description: `Curriculum ${
					modal.type === "add" ? "added" : "updated"
				} successfully!`,
				variant: "success",
			});
			mutate();
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: `Failed to ${modal.type} curriculum.`,
				variant: "error",
			});
		}
	};

	const handleBulkUpdate = async () => {
		try {
			const response = await fetch("/api/admin/academics/curriculum/bulk", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					selectedCurricula.map((id) => {
						const curriculum = curricula.find((c) => c.id === id);
						return {
							id,
							name: curriculum?.name,
							description: curriculum?.description,
						};
					})
				),
			});
			if (!response.ok) throw new Error(await response.text());
			showToast({
				title: "Success",
				description: "Curricula updated!",
				variant: "success",
			});
			mutate();
			setSelectedCurricula([]);
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: "Bulk update failed",
				variant: "error",
			});
		}
	};

	const handleBulkDelete = async () => {
		if (
			!window.confirm(
				`Are you sure you want to delete ${selectedCurricula.length} curricula?`
			)
		)
			return;
		try {
			const response = await fetch("/api/admin/academics/curriculum/bulk", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids: selectedCurricula }),
			});
			if (!response.ok) throw new Error(await response.text());
			showToast({
				title: "Success",
				description: "Curricula deleted!",
				variant: "success",
			});
			mutate();
			setSelectedCurricula([]);
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: "Bulk delete failed",
				variant: "error",
			});
		}
	};

	const handleDeleteCurriculum = async (id: string) => {
		try {
			const response = await fetch(`/api/admin/academics/curriculum/${id}`, {
				method: "DELETE",
			});
			if (!response.ok) throw new Error(await response.text());
			showToast({
				title: "Success",
				description: "Curriculum deleted!",
				variant: "success",
			});
			mutate();
			closeModal();
		} catch (error) {
			showToast({
				title: "Error",
				description: "Deletion failed",
				variant: "error",
			});
		}
	};

	const toggleCurriculumSelection = (id: string) => {
		setSelectedCurricula((prev) =>
			prev.includes(id) ? prev.filter((currId) => currId !== id) : [...prev, id]
		);
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;
		try {
			const text = await file.text();
			let curricula: Curriculum[] = [];
			if (file.name.endsWith(".csv")) {
				curricula = Papa.parse(text, { header: true, skipEmptyLines: true })
					.data as Curriculum[];
			} else if (file.name.endsWith(".xml")) {
				const parser = new XMLParser({
					ignoreAttributes: false,
					attributeNamePrefix: "",
				});
				curricula = parser.parse(text).curricula?.curriculum || [];
			} else if (file.name.endsWith(".json")) {
				curricula = JSON.parse(text);
			}
			const response = await fetch("/api/admin/academics/curriculum/bulk", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(curricula),
			});
			if (!response.ok) throw new Error(await response.text());
			showToast({
				title: "Success",
				description: "Curricula imported!",
				variant: "success",
			});
			mutate();
		} catch (error) {
			showToast({
				title: "Error",
				description: "Import failed",
				variant: "error",
			});
		}
	};

	const handleExport = async (format: "json" | "csv" | "xml") => {
		try {
			const curricula = await fetch("/api/admin/academics/curriculum").then(
				(res) => res.json()
			);
			let data: string;
			switch (format) {
				case "json":
					data = JSON.stringify(curricula, null, 2);
					break;
				case "csv":
					data = Papa.unparse(curricula);
					break;
				case "xml":
					data = `<curricula>${curricula
						.map(
							(c: Curriculum) =>
								`<curriculum>${Object.entries(c)
									.map(([key, value]) => `<${key}>${value}</${key}>`)
									.join("")}</curriculum>`
						)
						.join("")}</curricula>`;
					break;
			}
			const blob = new Blob([data], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `curricula-${new Date().toISOString()}.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			showToast({
				title: "Error",
				description: "Export failed",
				variant: "error",
			});
		}
	};

	const CurriculumForm = ({
		onSubmit,
		onClose,
		curriculum,
	}: {
		onSubmit: SubmitHandler<CurriculumFormData>;
		onClose: () => void;
		curriculum?: Curriculum | null;
	}) => {
		const methods = useForm<CurriculumFormData>({
			resolver: zodResolver(curriculumSchema),
			defaultValues: curriculum || { name: "", description: "" },
		});

		return (
			<FormProvider {...methods}>
				<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
					<Input
						label="Name"
						{...methods.register("name")}
						error={methods.formState.errors.name?.message}
					/>
					<Input
						label="Description"
						{...methods.register("description")}
						error={methods.formState.errors.description?.message}
					/>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit">
							{curriculum ? "Update" : "Create"} Curriculum
						</Button>
					</div>
				</form>
			</FormProvider>
		);
	};

	if (status === "loading") return <Loading text="Loading ..." />;
	if (
		status === "unauthenticated" ||
		!session?.user?.role ||
		!["ADMIN", "TEACHER"].includes(session.user.role)
	) {
		return null;
	}

	if (error)
		return (
			<div className="text-center p-4 text-[var(--color-destructive)]">
				Error: {error.message}
			</div>
		);

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />
			{selectedCurricula.length > 0 && (
				<div className="mb-4 flex justify-between items-center bg-[var(--color-accent)] p-3 rounded">
					<span>{selectedCurricula.length} curricula selected</span>
					<div className="space-x-2">
						<Button onClick={() => openModal("bulk-update")}>
							Bulk Update
						</Button>
						<Button
							variant="destructive"
							onClick={() => openModal("bulk-delete")}
						>
							Bulk Delete
						</Button>
					</div>
				</div>
			)}
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold">Curriculum Management</h2>
				<Button onClick={() => openModal("add")}>Add New Curriculum</Button>
			</div>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-1.5">
					<label>Import curricula:</label>
					<Input
						type="file"
						accept=".json,.xml,.csv"
						onChange={handleFileUpload}
					/>
				</div>
				<div className="space-x-2">
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("json")}
					>
						Export JSON
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("csv")}
					>
						Export CSV
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={() => handleExport("xml")}
					>
						Export XML
					</Button>
				</div>
			</div>
			<Input
				type="text"
				placeholder="Search curricula by name..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="mb-6"
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>
							<Checkbox
								checked={
									selectedCurricula.length === curricula.length &&
									curricula.length > 0
								}
								onCheckedChange={(checked) =>
									setSelectedCurricula(
										checked ? curricula.map((c) => c.id) : []
									)
								}
							/>
						</TableHead>
						<TableHead
							className="cursor-pointer"
							onClick={() => handleSort("name")}
						>
							Name{" "}
							{sortConfig.key === "name" &&
								(sortConfig.direction === "asc" ? "↑" : "↓")}
						</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Grade Levels</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sortedCurricula.map((curriculum) => (
						<TableRow key={curriculum.id}>
							<TableCell>
								<Checkbox
									checked={selectedCurricula.includes(curriculum.id)}
									onCheckedChange={() =>
										toggleCurriculumSelection(curriculum.id)
									}
								/>
							</TableCell>
							<TableCell>{curriculum.name}</TableCell>
							<TableCell>{curriculum.description || "N/A"}</TableCell>
							<TableCell>
								{curriculum.gradeLevels.map((g) => g.name).join(", ") || "None"}
							</TableCell>
							<TableCell>
								<div className="flex space-x-2">
									<Button
										size="sm"
										onClick={() => openModal("view", curriculum)}
									>
										View
									</Button>
									<Button
										size="sm"
										variant="secondary"
										onClick={() => openModal("update", curriculum)}
									>
										Edit
									</Button>
									<Button
										size="sm"
										variant="destructive"
										onClick={() => openModal("delete", curriculum)}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<div className="mt-4 flex justify-between items-center">
				<span>
					Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
					{Math.min(currentPage * itemsPerPage, total)} of {total} curricula
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
						disabled={currentPage * itemsPerPage >= total}
					>
						Next
					</Button>
				</div>
			</div>
			<ModalCard
				isOpen={modal.type === "add" || modal.type === "update"}
				onClose={closeModal}
				title={modal.type === "add" ? "Add Curriculum" : "Edit Curriculum"}
			>
				<CurriculumForm
					onSubmit={onSubmit}
					onClose={closeModal}
					curriculum={modal.curriculum}
				/>
			</ModalCard>
			<ModalCard
				isOpen={modal.type === "view"}
				onClose={closeModal}
				title="Curriculum Details"
			>
				{modal.curriculum && (
					<div className="space-y-2">
						<p>
							<strong>Name:</strong> {modal.curriculum.name}
						</p>
						<p>
							<strong>Description:</strong>{" "}
							{modal.curriculum.description || "N/A"}
						</p>
						<p>
							<strong>Grade Levels:</strong>{" "}
							{modal.curriculum.gradeLevels.map((g) => g.name).join(", ") ||
								"None"}
						</p>
					</div>
				)}
			</ModalCard>
			<ModalCard
				isOpen={modal.type === "delete"}
				onClose={closeModal}
				title="Confirm Deletion"
			>
				{modal.curriculum && (
					<div className="space-y-4">
						<p>
							Are you sure you want to delete{" "}
							<strong>{modal.curriculum.name}</strong>?
						</p>
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={closeModal}>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => handleDeleteCurriculum(modal.curriculum!.id)}
							>
								Delete
							</Button>
						</div>
					</div>
				)}
			</ModalCard>
			<ModalCard
				isOpen={modal.type === "bulk-update"}
				onClose={closeModal}
				title="Bulk Update Curricula"
			>
				<div className="space-y-4">
					<p>Update {selectedCurricula.length} curricula</p>
					<Input
						label="Common Description"
						onChange={(e) => {
							/* Add logic if needed */
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
				title="Bulk Delete Curricula"
			>
				<div className="space-y-4">
					<p>
						Are you sure you want to delete {selectedCurricula.length}{" "}
						curricula?
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
