"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import AttendanceForm from "../components/AttendanceForm";

export default function CreateAttendancePage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/teacher/dashboard" },
						{ label: "Attendance Management", href: "/teacher/attendance" },
						{ label: "Create Attendance", href: "/teacher/attendance/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Attendance</h1>
				<AttendanceForm />
			</div>
		</ErrorBoundary>
	);
}
