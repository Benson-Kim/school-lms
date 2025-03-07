"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import InventoryForm from "../../components/InventoryForm";

export default function EditInventoryPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchInventory = async () => {
			try {
				const response = await fetch(`/api/support/inventory/${id}`);
				if (!response.ok) throw new Error("Failed to fetch inventory");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchInventory();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading inventory data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/support/dashboard" },
						{ label: "Inventory Management", href: "/support/inventory" },
						{ label: "Edit Inventory", href: "/support/inventory/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Inventory</h1>
				<InventoryForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
