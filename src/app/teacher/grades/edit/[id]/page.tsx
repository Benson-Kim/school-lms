"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import GradeForm from "../../components/GradeForm";

export default function EditGradePage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchGrade = async () => {
			try {
				const response = await fetch(`/api/teacher/grades/${id}`);
				if (!response.ok) throw new Error("Failed to fetch grade");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchGrade();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading grade data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Grade Management", href: "/teacher/grades" },
						{ label: "Edit Grade", href: "/teacher/grades/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Grade</h1>
				<GradeForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
