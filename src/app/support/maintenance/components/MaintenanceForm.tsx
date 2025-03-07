"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toaster";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import {
	maintenanceSchema,
	type MaintenanceData,
} from "@/lib/validation/maintenanceSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface MaintenanceFormProps {
	initialData?: MaintenanceData & { id?: string };
	isEdit?: boolean;
}

export default function MaintenanceForm({
	initialData,
	isEdit = false,
}: MaintenanceFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<MaintenanceData>({
		resolver: zodResolver(maintenanceSchema),
		defaultValues: initialData || {
			title: "",
			description: "",
			priority: "",
			status: "",
			requestedBy: "",
			location: "",
		},
	});

	const onSubmit = async (data: MaintenanceData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "maintenance",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/support/maintenance");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/support/maintenance/${initialData.id}`
					: `/api/support/maintenance`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save maintenance");
			}

			toast.success(
				`Maintenance ${isEdit ? "updated" : "created"} successfully`
			);
			router.push("/support/maintenance");
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error(error instanceof Error ? error.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-6 max-w-3xl mx-auto"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<Input
						label="Title"
						type="text"
						{...register("title")}
						error={errors.title?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Description"
						type="text"
						{...register("description")}
						error={errors.description?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Priority"
						type="text"
						{...register("priority")}
						error={errors.priority?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Status"
						type="text"
						{...register("status")}
						error={errors.status?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="RequestedBy"
						type="text"
						{...register("requestedBy")}
						error={errors.requestedBy?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Location"
						type="text"
						{...register("location")}
						error={errors.location?.message}
						required
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} Maintenance
				</Button>
			</div>
		</form>
	);
}
