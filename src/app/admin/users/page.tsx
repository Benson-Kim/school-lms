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

import UsersTable from "./components/UsersTable";
import UsersFilter from "./components/UsersFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useUsers } from "@/lib/hooks/useUsers";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function UsersPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		users,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteUsers,
	} = useUsers({ page, pageSize, searchTerm });

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
		if (selectedUsers.length === 0) return;
		try {
			await deleteUsers(selectedUsers);
			toast.success(`Successfully deleted ${selectedUsers.length} users`);
			setSelectedUsers([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete users");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting users data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading users. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "User Management", href: "/admin/users" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">User Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/admin/users/create")}
							icon={<FiPlus />}
						>
							Add User
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
						{selectedUsers.length > 0 && (
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
				<UsersFilter onSearch={handleSearch} />
				<UsersTable
					users={users || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedUsers}
					selectedUsers={selectedUsers}
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
					title="Delete Users"
					message={`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
