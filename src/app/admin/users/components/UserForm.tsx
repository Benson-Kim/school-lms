"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/Toaster";

import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import { userSchema, type UserData } from "@/lib/validation/userSchema";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";

interface UserFormProps {
	initialData?: UserData & { id?: string };
	isEdit?: boolean;
}

export default function UserForm({
	initialData,
	isEdit = false,
}: UserFormProps) {
	const router = useRouter();
	const { isOffline, syncWhenOnline } = useOffline();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<UserData>({
		resolver: zodResolver(userSchema),
		defaultValues: initialData || {
			email: "",
			firstName: "",
			lastName: "",
			role: "",
			phoneNumber: "",
			active: false,
		},
	});

	const onSubmit = async (data: UserData) => {
		setIsSubmitting(true);
		try {
			if (isOffline) {
				syncWhenOnline({
					type: isEdit ? "update" : "create",
					resource: "users",
					data: isEdit ? { ...data, id: initialData?.id } : data,
				});
				toast.info("Changes saved locally and will sync when back online");
				router.push("/admin/users");
				return;
			}

			const url =
				isEdit && initialData?.id
					? `/api/admin/users/${initialData.id}`
					: `/api/admin/users`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to save user");
			}

			toast.success(`User ${isEdit ? "updated" : "created"} successfully`);
			router.push("/admin/users");
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
						label="Email"
						type="text"
						{...register("email")}
						error={errors.email?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="FirstName"
						type="text"
						{...register("firstName")}
						error={errors.firstName?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="LastName"
						type="text"
						{...register("lastName")}
						error={errors.lastName?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Role"
						type="text"
						{...register("role")}
						error={errors.role?.message}
						required
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="PhoneNumber"
						type="text"
						{...register("phoneNumber")}
						error={errors.phoneNumber?.message}
					/>
				</div>

				<div className="space-y-4">
					<Input
						label="Active"
						type="checkbox"
						{...register("active")}
						error={errors.active?.message}
						required
					/>
				</div>
			</div>
			<div className="flex justify-end gap-4 mt-8">
				<Button type="button" variant="outline" onClick={() => router.back()}>
					Cancel
				</Button>
				<Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
					{isEdit ? "Update" : "Create"} User
				</Button>
			</div>
		</form>
	);
}
