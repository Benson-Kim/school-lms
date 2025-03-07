"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import MaintenanceForm from "../../components/MaintenanceForm";

export default function EditMaintenancePage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchMaintenance = async () => {
			try {
				const response = await fetch(`/api/support/maintenance/${id}`);
				if (!response.ok) throw new Error("Failed to fetch maintenance");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchMaintenance();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading maintenance data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/support/dashboard" },
						{ label: "Maintenance Management", href: "/support/maintenance" },
						{
							label: "Edit Maintenance",
							href: "/support/maintenance/edit/${id}",
						},
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Maintenance</h1>
				<MaintenanceForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
