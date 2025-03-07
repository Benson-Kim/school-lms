"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import MaintenanceForm from "../components/MaintenanceForm";

export default function CreateMaintenancePage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/support/dashboard" },
						{ label: "Maintenance Management", href: "/support/maintenance" },
						{
							label: "Create Maintenance",
							href: "/support/maintenance/create",
						},
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Maintenance</h1>
				<MaintenanceForm />
			</div>
		</ErrorBoundary>
	);
}
