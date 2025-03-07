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

import EventsTable from "./components/EventsTable";
import EventsFilter from "./components/EventsFilter";
import BulkImportModal from "./components/BulkImportModal";

import { useEvents } from "@/lib/hooks/useEvents";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

export default function EventsPage() {
	const { data: session } = useSession();
	const router = useRouter();

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [searchTerm, setSearchTerm] = useState("");
	const [showImportModal, setShowImportModal] = useState(false);
	const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const {
		events,
		totalItems,
		totalPages,
		isLoading,
		isError,
		refetch,
		deleteEvents,
	} = useEvents({ page, pageSize, searchTerm });

	useEffect(() => {
		if (session && !["PARENT"].includes(session.user.role)) {
			router.push("/");
		}
	}, [session, router]);

	const handleSearch = (term: string) => {
		setSearchTerm(term);
		setPage(1);
	};

	const handleBulkDelete = async () => {
		if (selectedEvents.length === 0) return;
		try {
			await deleteEvents(selectedEvents);
			toast.success(`Successfully deleted ${selectedEvents.length} events`);
			setSelectedEvents([]);
			refetch();
		} catch (error) {
			toast.error("Failed to delete events");
			console.error("Delete error:", error);
		}
		setShowDeleteConfirm(false);
	};

	const exportToCSV = () => {
		toast.info("Exporting events data...");
		// Implement CSV export logic here
	};

	if (isLoading) return <LoadingSpinner />;
	if (isError) return <div>Error loading events. Please try again.</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/parent/dashboard" },
						{ label: "Event Management", href: "/parent/events" },
					]}
				/>
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">Event Management</h1>
					<div className="flex gap-2">
						<Button
							onClick={() => router.push("/parent/events/create")}
							icon={<FiPlus />}
						>
							Add Event
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
						{selectedEvents.length > 0 && (
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
				<EventsFilter onSearch={handleSearch} />
				<EventsTable
					events={events || []}
					pagination={{
						currentPage: page,
						pageSize,
						totalItems: totalItems || 0,
						totalPages: totalPages || 1,
					}}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSelectionChange={setSelectedEvents}
					selectedEvents={selectedEvents}
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
					title="Delete Events"
					message={`Are you sure you want to delete ${selectedEvents.length} events? This action cannot be undone.`}
					confirmLabel="Delete"
					cancelLabel="Cancel"
					onConfirm={handleBulkDelete}
					onCancel={() => setShowDeleteConfirm(false)}
				/>
			</div>
		</ErrorBoundary>
	);
}
