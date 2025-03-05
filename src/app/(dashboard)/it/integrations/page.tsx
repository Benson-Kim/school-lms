"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";

export default function ITIntegrations() {
	const { data: session, status } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (status === "unauthenticated") {
			showToast({
				title: "Authentication Error",
				description: "Please sign in as IT to manage integrations.",
				variant: "error",
			});
			router.push("/auth/signin");
		}
	}, [status, router]);

	if (status === "loading") {
		return <div className="text-center p-4">Loading...</div>;
	}

	if (status === "unauthenticated" || session?.user.role !== "IT") {
		return null; // Handled by useEffect redirect
	}

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />
			<h1 className="text-3xl font-bold mb-6 text-charcoal">
				Integrations Management
			</h1>
			<Card title="Integrations Overview" className="p-4">
				<p>Manage third-party integrations, APIs, and system connectors.</p>
				<Button
					onClick={() => router.push("/it/integrations/list")}
					className="mt-4 bg-sweet-brown text-white hover:bg-copper-red"
				>
					View Integrations
				</Button>
			</Card>
			<Button
				onClick={() => router.push("/it/dashboard")}
				className="mt-4"
				variant="outline"
			>
				Back to Dashboard
			</Button>
		</div>
	);
}
