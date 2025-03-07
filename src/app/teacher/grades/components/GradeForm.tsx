"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toaster";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { gradeSchema, type GradeData } from "@/lib/validation/gradeSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface GradeFormProps {
	initialData?: GradeData & { id?: string };
	isEdit?: boolean;
}

export default function GradeForm({
	initialData,
	isEdit = false,
}: GradeFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<GradeData>({
		resolver: zodResolver(gradeSchema),
		defaultValues: initialData || {
			studentId: "",
			assignmentName: "",
			score: "",
			feedback: "",
		},
	});

	const onSubmit = async (data: GradeData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "grades",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/teacher/grades");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/teacher/grades/${initialData.id}`
					: `/api/teacher/grades`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save grade");
			}

			toast.success(`Grade ${isEdit ? "updated" : "created"} successfully`);
			router.push("/teacher/grades");
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
						label="StudentId"
						type="text"
						{...register("studentId")}
						error={errors.studentId?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="AssignmentName"
						type="text"
						{...register("assignmentName")}
						error={errors.assignmentName?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Score"
						type="number"
						{...register("score", { valueAsNumber: true })}
						error={errors.score?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Feedback"
						type="text"
						{...register("feedback")}
						error={errors.feedback?.message}
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} Grade
				</Button>
			</div>
		</form>
	);
}
