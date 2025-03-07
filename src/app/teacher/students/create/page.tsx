"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import StudentForm from "../components/StudentForm";

export default function CreateStudentPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Student Management", href: "/teacher/students" },
						{ label: "Create Student", href: "/teacher/students/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Student</h1>
				<StudentForm />
			</div>
		</ErrorBoundary>
	);
}
