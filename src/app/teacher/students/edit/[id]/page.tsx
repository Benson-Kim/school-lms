"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StudentForm from "../../components/StudentForm";

export default function EditStudentPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchStudent = async () => {
			try {
				const response = await fetch(`/api/teacher/students/${id}`);
				if (!response.ok) throw new Error("Failed to fetch student");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchStudent();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading student data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Student Management", href: "/teacher/students" },
						{ label: "Edit Student", href: "/teacher/students/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Student</h1>
				<StudentForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
