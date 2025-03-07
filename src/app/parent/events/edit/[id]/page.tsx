"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EventForm from "../../components/EventForm";

export default function EditEventPage() {
	const { id } = useParams();
	const [initialData, setInitialData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				const response = await fetch(`/api/parent/events/${id}`);
				if (!response.ok) throw new Error("Failed to fetch event");
				const data = await response.json();
				setInitialData(data);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchEvent();
	}, [id]);

	if (isLoading) return <LoadingSpinner />;
	if (!initialData) return <div>Error loading event data</div>;

	return (
		<ErrorBoundary>
			<div className="container mx-auto px-4 py-8">
				<OfflineIndicator />

				<Breadcrumb
					items={[
						{ label: "Dashboard", href: "/parent/dashboard" },
						{ label: "Event Management", href: "/parent/events" },
						{ label: "Edit Event", href: "/parent/events/edit/${id}" },
					]}
				/>
				<h1 className="text-2xl font-bold mb-6">Edit Event</h1>
				<EventForm initialData={initialData} isEdit />
			</div>
		</ErrorBoundary>
	);
}
