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
	assignmentSchema,
	type AssignmentData,
} from "@/lib/validation/assignmentSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface AssignmentFormProps {
	initialData?: AssignmentData & { id?: string };
	isEdit?: boolean;
}

export default function AssignmentForm({
	initialData,
	isEdit = false,
}: AssignmentFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<AssignmentData>({
		resolver: zodResolver(assignmentSchema),
		defaultValues: initialData || {
			title: "",
			description: "",
			dueDate: "",
			totalPoints: "",
		},
	});

	const onSubmit = async (data: AssignmentData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "assignments",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/teacher/assignments");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/teacher/assignments/${initialData.id}`
					: `/api/teacher/assignments`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save assignment");
			}

			toast.success(
				`Assignment ${isEdit ? "updated" : "created"} successfully`
			);
			router.push("/teacher/assignments");
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
						label="DueDate"
						type="date"
						{...register("dueDate")}
						error={errors.dueDate?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="TotalPoints"
						type="number"
						{...register("totalPoints", { valueAsNumber: true })}
						error={errors.totalPoints?.message}
						required
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} Assignment
				</Button>
			</div>
		</form>
	);
}
