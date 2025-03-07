"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AttendanceForm from "../../components/AttendanceForm";

export default function EditAttendancePage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchAttendance = async () => {
			try {
				const response = await fetch(`/api/teacher/attendance/${id}`);
				if (!response.ok) throw new Error("Failed to fetch attendance");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAttendance();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading attendance data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Attendance Management", href: "/teacher/attendance" },
						{
							label: "Edit Attendance",
							href: "/teacher/attendance/edit/${id}",
						},
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Attendance</h1>
				<AttendanceForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
