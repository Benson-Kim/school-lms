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

import MaintenancesTable from "./components/MaintenancesTable";
import MaintenancesFilter from "./components/MaintenancesFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useMaintenances } from "@/lib/hooks/useMaintenances";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function MaintenancesPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedMaintenances, setSelectedMaintenances] = useState<string[]>(
		[]
	);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		maintenance,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteMaintenances,
	} = useMaintenances({ page, pageSize, searchTerm });

	useEffect(() => {
		if (session && !["SUPPORT_STAFF"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedMaintenances.length === 0) return;
		try {
			await deleteMaintenances(selectedMaintenances);
			toast.success(
				`Successfully deleted ${selectedMaintenances.length} maintenance`
			);
			setSelectedMaintenances([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete maintenance");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting maintenance data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading maintenance. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/support/dashboard" },
						{ label: "Maintenance Management", href: "/support/maintenance" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Maintenance Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/support/maintenance/create")}
							icon={<FiPlus />}
						>
							Add Maintenance
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
						{selectedMaintenances.length > 0 && (
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
				<MaintenancesFilter onSearch={handleSearch} />
				<MaintenancesTable
					maintenance={maintenance || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedMaintenances}
					selectedMaintenances={selectedMaintenances}
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
					title="Delete Maintenances"
					message={`Are you sure you want to delete ${selectedMaintenances.length} maintenance? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
