"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import InventoryForm from "../components/InventoryForm";

export default function CreateInventoryPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/support/dashboard" },
						{ label: "Inventory Management", href: "/support/inventory" },
						{ label: "Create Inventory", href: "/support/inventory/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Inventory</h1>
				<InventoryForm />
			</div>
		</ErrorBoundary>
	);
}
