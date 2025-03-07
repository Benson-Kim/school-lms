"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus, FiDownload, FiUpload, FiTrash } from "react-icons/fi";
import { showToast } from "@/components/ui/Toaster";
import { Class } from "@prisma/client";
import { z } from "zod";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { ModalCard } from "@/components/ui/ModalCard";

import ClassesTable from "./components/ClassesTable";
import ClassesFilter from "./components/ClassesFilter";
import BulkImportModal from "./components/BulkImportModal";
import AddClassForm from "./components/AddClassForm";
import EditClassForm from "./components/EditClassForm";

import { useEntities } from "@/lib/utils/useEntities";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

const classSchema = z.object({
	name: z.string().min(1, "Class name is required"),
	active: z.boolean().default(true),
	schoolId: z.string().min(1, "School ID is required"),
});
type ClassFormData = z.infer<typeof classSchema>;

type ModalState =
	| { type: "add"; schoolId: string }
	| { type: "edit"; class: Class; schoolId: string }
	| { type: "delete"; class: Class }
	| { type: null };

export default function ClassesPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const searchParams = useSearchParams();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [modal, setModal] = useState<ModalState>({ type: null });

	const schoolId =
		session?.user.role === "IT"
			? searchParams.get("schoolId") || ""
			: session?.user.schoolId || "";

	const {
		entities: courses,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteEntities: deleteClasses,
	} = useEntities<Class>({
		endpoint: `/api/student/courses${schoolId ? `?schoolId=${schoolId}` : ""}`, // Append schoolId to endpoint
		page,
		pageSize,
		searchTerm,
	});

	useEffect(() => {
		if (!session) return;
		if (!["IT", "ADMIN"].includes(session.user.role)) {
			router.push("/");
		}
		if (!schoolId) {
			showToast({
				title: "Error",
				description: "School ID is missing",
				variant: "error",
			});
			router.push("/");
		}
		if (session.user.role === "ADMIN" && session.user.schoolId !== schoolId) {
			router.push("/");
		}
	}, [session, router, schoolId]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedClasses.length === 0) return;
		try {
			await deleteClasses(selectedClasses);
			setSelectedClasses([]);
			refetch();
		} catch (error) {
			showToast({
				title: "Failed to delete courses",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "error",
			});
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const handleDeleteClass = async (id: string) => {
		try {
			await deleteClasses([id]);
			refetch();
			closeModal();
		} catch (error) {
			showToast({
				title: "Failed to delete course",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "error",
			});
			console.error("Delete error:", error);
		}
	};

	const exportToCSV = () => {
		showToast({
			title: "Exporting",
			description: "Exporting courses data...",
			variant: "info",
		});
		// Implement CSV export logic here
	};

	const openModal = (type: ModalState["type"], classItem?: Class) => {
		if (type === "add") {
			setModal({ type, schoolId });
		} else if (classItem && (type === "edit" || type === "delete")) {
			setModal(
				type === "edit"
					? { type, class: classItem, schoolId }
					: { type, class: classItem }
			);
		}
	};

	const closeModal = () => {
		setModal({ type: null });
	};

	const onSubmit = async (data: ClassFormData) => {
		try {
			const url =
				modal.type === "add"
					? "/api/student/courses"
					: `/api/student/courses/${(modal as { class: Class }).class.id}`;
			const method = modal.type === "add" ? "POST" : "PUT";
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, schoolId }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || `${modal.type === "add" ? "Add" : "Update"} failed`
				);
			}

			showToast({
				title: `${modal.type === "add" ? "Course added" : "Course updated"}`,
				description: `Course ${data.name} ${
					modal.type === "add" ? "added" : "updated"
				} successfully`,
				variant: "success",
			});
			refetch();
			closeModal();
		} catch (error) {
			showToast({
				title: "Operation failed",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "error",
			});
			console.error("Error:", error);
		}
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading courses. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />
				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/student/dashboard" },
						{
							label: "Course Management",
							href: `/student/courses${
								schoolId ? `?schoolId=${schoolId}` : ""
							}`,
						},
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Course Management</h1>{" "}
					<div className="flex gap-2">
						<Button onClick={() => openModal("add")} icon={<FiPlus />}>
							Add Course
						</Button>
						<Button
							variant="outline"
							onClick={() => setShowImportModal(true)}
							icon={<FiUpload />}
						>
							Import
						</Button>
						<Button
							variant="outline"
							onClick={exportToCSV}
							icon={<FiDownload />}
						>
							Export CSV
						</Button>
						{selectedClasses.length > 0 && (
							<Button
								variant="destructive"
								onClick={() => setShowDeleteConfirm(true)}
								icon={<FiTrash />}
							>
								Delete Selected
							</Button>
						)}
					</div>
				</div>
				<ClassesFilter onSearch={handleSearch} />
				<ClassesTable
					courses={courses || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedClasses}
					selectedClasses={selectedClasses}
					onEdit={(classItem) => openModal("edit", classItem)}
					onDelete={(classItem) => openModal("delete", classItem)}
				/>
				{showImportModal && (
					<BulkImportModal
						isOpen={showImportModal}
						onClose={() => setShowImportModal(false)}
						onImportComplete={() => {
							refetch();
							setShowImportModal(false);
						}}
					/>
				)}
				<ConfirmDialog
					isOpen={showDeleteConfirm}
					title="Delete Courses"
					message={`Are you sure you want to delete ${selectedClasses.length} courses? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
					isDestructive={true}
				/>
				<ModalCard
					isOpen={modal.type === "add" || modal.type === "edit"}
					onClose={closeModal}
					title={modal.type === "add" ? "Add New Class" : "Edit Class"}
				>
					{modal.type === "add" && "schoolId" in modal ? (
						<AddClassForm
							onSubmit={onSubmit}
							onClose={closeModal}
							schoolId={modal.schoolId}
						/>
					) : modal.type === "edit" &&
					  "class" in modal &&
					  "schoolId" in modal ? (
						<EditClassForm
							class={modal.class}
							onSubmit={onSubmit}
							onClose={closeModal}
							schoolId={modal.schoolId}
						/>
					) : null}
				</ModalCard>
				<ModalCard
					isOpen={modal.type === "delete"}
					onClose={closeModal}
					title="Confirm Deletion"
				>
					{modal.type === "delete" && "class" in modal && (
						<div className="space-y-4">
							<p>
								Are you sure you want to delete{" "}
								<strong>{modal.class.name}</strong>? This action cannot be
								undone.
							</p>
							<div className="flex justify-end space-x-2">
								<Button variant="outline" onClick={closeModal}>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={() => handleDeleteClass(modal.class.id)}
								>
									Delete Class
								</Button>
							</div>
						</div>
					)}
				</ModalCard>
			</div>
		</ErrorBoundary>
	);
}
