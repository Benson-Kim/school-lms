"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SchoolForm from "../../components/SchoolForm";

export default function EditSchoolPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSchool = async () => {
			try {
				const response = await fetch(`/api/it/schools/${id}`);
				if (!response.ok) throw new Error("Failed to fetch school");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSchool();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading school data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/it/dashboard" },
						{ label: "School Management", href: "/it/schools" },
						{ label: "Edit School", href: "/it/schools/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit School</h1>
				<SchoolForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
