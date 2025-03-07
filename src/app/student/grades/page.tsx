"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiPlus, FiDownload, FiUpload, FiTrash } from "react-icons/fi";
import { showToast } from "@/components/Toaster";

import Breadcrumb from "@/components/shared/Breadcrumb";
import { Button } from "@/components/ui/Button";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

import GradesTable from "./components/GradesTable";
import GradesFilter from "./components/GradesFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useEntities } from "@/lib/useEntities"; // Updated import
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function GradesPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		entities: grades, // Renamed from entities to grades
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteEntities: deleteGrades, // Renamed for consistency
	} = useEntities({
		endpoint: "/api/student/grades", // Specific endpoint for grades
		page,
		pageSize,
		searchTerm,
	});

	useEffect(() => {
		if (session && !["STUDENT"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedGrades.length === 0) return;
		try {
			await deleteGrades(selectedGrades);
			setSelectedGrades([]);
			refetch();
		} catch (error) {
			showToast({
				title: "Failed to delete grades",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "error",
			});
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		showToast({
			title: "Exporting",
			description: "Exporting grades data...",
			variant: "info",
		});
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading grades. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />
				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/student/dashboard" },
						{ label: "Grade Management", href: "/student/grades" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Grade Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/student/grades/create")}
							icon={<FiPlus />}
						>
							Add Grade
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
						{selectedGrades.length > 0 && (
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
				<GradesFilter onSearch={handleSearch} />
				<GradesTable
					grades={grades || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedGrades}
					selectedGrades={selectedGrades}
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
					title="Delete Grades"
					message={`Are you sure you want to delete ${selectedGrades.length} grades? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
					isDestructive={true}
				/>
			</div>
		</ErrorBoundary>
	);
}
