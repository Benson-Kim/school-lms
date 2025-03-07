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

import IntegrationsTable from "./components/IntegrationsTable";
import IntegrationsFilter from "./components/IntegrationsFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useIntegrations } from "@/lib/hooks/useIntegrations";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function IntegrationsPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>(
		[]
	);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		integrations,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteIntegrations,
	} = useIntegrations({ page, pageSize, searchTerm });

	useEffect(() => {
		if (session && !["IT"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedIntegrations.length === 0) return;
		try {
			await deleteIntegrations(selectedIntegrations);
			toast.success(
				`Successfully deleted ${selectedIntegrations.length} integrations`
			);
			setSelectedIntegrations([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete integrations");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting integrations data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading integrations. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/it/dashboard" },
						{ label: "Integration Management", href: "/it/integrations" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Integration Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/it/integrations/create")}
							icon={<FiPlus />}
						>
							Add Integration
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
						{selectedIntegrations.length > 0 && (
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
				<IntegrationsFilter onSearch={handleSearch} />
				<IntegrationsTable
					integrations={integrations || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedIntegrations}
					selectedIntegrations={selectedIntegrations}
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
					title="Delete Integrations"
					message={`Are you sure you want to delete ${selectedIntegrations.length} integrations? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
