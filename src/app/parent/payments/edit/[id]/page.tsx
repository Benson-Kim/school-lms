"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentForm from "../../components/PaymentForm";

export default function EditPaymentPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchPayment = async () => {
			try {
				const response = await fetch(`/api/parent/payments/${id}`);
				if (!response.ok) throw new Error("Failed to fetch payment");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchPayment();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading payment data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/parent/dashboard" },
						{ label: "Payment Management", href: "/parent/payments" },
						{ label: "Edit Payment", href: "/parent/payments/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Payment</h1>
				<PaymentForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
