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
	paymentSchema,
	type PaymentData,
} from "@/lib/validation/paymentSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface PaymentFormProps {
	initialData?: PaymentData & { id?: string };
	isEdit?: boolean;
}

export default function PaymentForm({
	initialData,
	isEdit = false,
}: PaymentFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<PaymentData>({
		resolver: zodResolver(paymentSchema),
		defaultValues: initialData || {
			amount: "",
			description: "",
			date: "",
			status: "",
		},
	});

	const onSubmit = async (data: PaymentData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "payments",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/parent/payments");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/parent/payments/${initialData.id}`
					: `/api/parent/payments`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save payment");
			}

			toast.success(`Payment ${isEdit ? "updated" : "created"} successfully`);
			router.push("/parent/payments");
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
						label="Amount"
						type="number"
						{...register("amount", { valueAsNumber: true })}
						error={errors.amount?.message}
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
						label="Date"
						type="date"
						{...register("date")}
						error={errors.date?.message}
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
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} Payment
				</Button>
			</div>
		</form>
	);
}
