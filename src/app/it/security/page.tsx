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

import SecuritysTable from "./components/SecuritysTable";
import SecuritysFilter from "./components/SecuritysFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useSecuritys } from "@/lib/hooks/useSecuritys";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function SecuritysPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedSecuritys, setSelectedSecuritys] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		security,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteSecuritys,
	} = useSecuritys({ page, pageSize, searchTerm });

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
		if (selectedSecuritys.length === 0) return;
		try {
			await deleteSecuritys(selectedSecuritys);
			toast.success(
				`Successfully deleted ${selectedSecuritys.length} security`
			);
			setSelectedSecuritys([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete security");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting security data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading security. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/it/dashboard" },
						{ label: "Security Management", href: "/it/security" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Security Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/it/security/create")}
							icon={<FiPlus />}
						>
							Add Security
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
						{selectedSecuritys.length > 0 && (
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
				<SecuritysFilter onSearch={handleSearch} />
				<SecuritysTable
					security={security || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedSecuritys}
					selectedSecuritys={selectedSecuritys}
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
					title="Delete Securitys"
					message={`Are you sure you want to delete ${selectedSecuritys.length} security? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
