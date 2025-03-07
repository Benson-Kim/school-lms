"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PaymentForm from "../components/PaymentForm";

export default function CreatePaymentPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/parent/dashboard" },
						{ label: "Payment Management", href: "/parent/payments" },
						{ label: "Create Payment", href: "/parent/payments/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Payment</h1>
				<PaymentForm />
			</div>
		</ErrorBoundary>
	);
}
