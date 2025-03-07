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

import SettingsTable from "./components/SettingsTable";
import SettingsFilter from "./components/SettingsFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useSettings } from "@/lib/hooks/useSettings";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function SettingsPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedSettings, setSelectedSettings] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		settings,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteSettings,
	} = useSettings({ page, pageSize, searchTerm });

	useEffect(() => {
		if (session && !["ADMIN"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedSettings.length === 0) return;
		try {
			await deleteSettings(selectedSettings);
			toast.success(`Successfully deleted ${selectedSettings.length} settings`);
			setSelectedSettings([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete settings");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting settings data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading settings. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Setting Management", href: "/admin/settings" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Setting Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/admin/settings/create")}
							icon={<FiPlus />}
						>
							Add Setting
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
						{selectedSettings.length > 0 && (
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
				<SettingsFilter onSearch={handleSearch} />
				<SettingsTable
					settings={settings || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedSettings}
					selectedSettings={selectedSettings}
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
					title="Delete Settings"
					message={`Are you sure you want to delete ${selectedSettings.length} settings? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
