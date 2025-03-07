"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toaster";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { schoolSchema, type SchoolData } from "@/lib/validation/schoolSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface SchoolFormProps {
	initialData?: SchoolData & { id?: string };
	isEdit?: boolean;
}

export default function SchoolForm({
	initialData,
	isEdit = false,
}: SchoolFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<SchoolData>({
		resolver: zodResolver(schoolSchema),
		defaultValues: initialData || {
			name: "",
			address: "",
			city: "",
			state: "",
			zipCode: "",
			country: "",
			phone: "",
			email: "",
			website: "",
		},
	});

	const onSubmit = async (data: SchoolData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "schools",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/it/schools");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/it/schools/${initialData.id}`
					: `/api/it/schools`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save school");
			}

			toast.success(`School ${isEdit ? "updated" : "created"} successfully`);
			router.push("/it/schools");
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
						label="Name"
						type="text"
						{...register("name")}
						error={errors.name?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Address"
						type="text"
						{...register("address")}
						error={errors.address?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="City"
						type="text"
						{...register("city")}
						error={errors.city?.message}
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="State"
						type="text"
						{...register("state")}
						error={errors.state?.message}
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="ZipCode"
						type="text"
						{...register("zipCode")}
						error={errors.zipCode?.message}
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Country"
						type="text"
						{...register("country")}
						error={errors.country?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Phone"
						type="text"
						{...register("phone")}
						error={errors.phone?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Email"
						type="text"
						{...register("email")}
						error={errors.email?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Website"
						type="text"
						{...register("website")}
						error={errors.website?.message}
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} School
				</Button>
			</div>
		</form>
	);
}
