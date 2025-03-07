"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus, FiDownload, FiUpload, FiTrash } from "react-icons/fi";
import { showToast } from "@/components/ui/Toaster";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import AssignmentsTable from "./components/AssignmentsTable";
import AssignmentsFilter from "./components/AssignmentsFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useAssignments } from "@/lib/hooks/useAssignments";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function AssignmentsPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		assignments,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteAssignments,
	} = useAssignments({ page, pageSize, searchTerm });

	useEffect(() => {
		if (session && !["TEACHER"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedAssignments.length === 0) return;
		try {
			await deleteAssignments(selectedAssignments);
			toast.success(
				`Successfully deleted ${selectedAssignments.length} assignments`
			);
			setSelectedAssignments([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete assignments");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting assignments data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading assignments. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Assignment Management", href: "/teacher/assignments" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Assignment Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/teacher/assignments/create")}
							icon={<FiPlus />}
						>
							Add Assignment
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
						{selectedAssignments.length > 0 && (
							<Button
								variant="danger"
								onClick={() => setShowDeleteConfirm(true)}
								icon={<FiTrash />}
							>
								Delete Selected
							</Button>
						)}
					</div>
				</div>
				<AssignmentsFilter onSearch={handleSearch} />
				<AssignmentsTable
					assignments={assignments || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedAssignments}
					selectedAssignments={selectedAssignments}
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
					title="Delete Assignments"
					message={`Are you sure you want to delete ${selectedAssignments.length} assignments? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
