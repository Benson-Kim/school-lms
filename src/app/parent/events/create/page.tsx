"use client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import EventForm from "../components/EventForm";

export default function CreateEventPage() {
	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/parent/dashboard" },
						{ label: "Event Management", href: "/parent/events" },
						{ label: "Create Event", href: "/parent/events/create" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Create New Event</h1>
				<EventForm />
			</div>
		</ErrorBoundary>
	);
}
