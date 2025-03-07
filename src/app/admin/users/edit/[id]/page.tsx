"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserForm from "../../components/UserForm";

export default function EditUserPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const response = await fetch(`/api/admin/users/${id}`);
				if (!response.ok) throw new Error("Failed to fetch user");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchUser();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading user data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "User Management", href: "/admin/users" },
						{ label: "Edit User", href: "/admin/users/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit User</h1>
				<UserForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
