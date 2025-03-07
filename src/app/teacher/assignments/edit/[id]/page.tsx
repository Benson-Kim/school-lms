"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AssignmentForm from "../../components/AssignmentForm";

export default function EditAssignmentPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchAssignment = async () => {
			try {
				const response = await fetch(`/api/teacher/assignments/${id}`);
				if (!response.ok) throw new Error("Failed to fetch assignment");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAssignment();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading assignment data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Assignment Management", href: "/teacher/assignments" },
						{
							label: "Edit Assignment",
							href: "/teacher/assignments/edit/${id}",
						},
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Assignment</h1>
				<AssignmentForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
