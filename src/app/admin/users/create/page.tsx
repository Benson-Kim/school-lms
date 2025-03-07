"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import UserForm from "../components/UserForm";

export default function CreateUserPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "User Management", href: "/admin/users" },
						{ label: "Create User", href: "/admin/users/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New User</h1>
				<UserForm />
			</div>
		</ErrorBoundary>
	);
}
