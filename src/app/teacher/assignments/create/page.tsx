"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AssignmentForm from "../components/AssignmentForm";

export default function CreateAssignmentPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Assignment Management", href: "/teacher/assignments" },
						{ label: "Create Assignment", href: "/teacher/assignments/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Assignment</h1>
				<AssignmentForm />
			</div>
		</ErrorBoundary>
	);
}
