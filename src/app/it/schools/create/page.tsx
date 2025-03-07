"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SchoolForm from "../components/SchoolForm";

export default function CreateSchoolPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/it/dashboard" },
						{ label: "School Management", href: "/it/schools" },
						{ label: "Create School", href: "/it/schools/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New School</h1>
				<SchoolForm />
			</div>
		</ErrorBoundary>
	);
}
