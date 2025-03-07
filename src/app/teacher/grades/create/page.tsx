"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import GradeForm from "../components/GradeForm";

export default function CreateGradePage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Grade Management", href: "/teacher/grades" },
						{ label: "Create Grade", href: "/teacher/grades/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Grade</h1>
				<GradeForm />
			</div>
		</ErrorBoundary>
	);
}
