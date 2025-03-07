"use client";

import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

// Define schema consistently
const classSchema = z.object({
	name: z.string().min(1, "Class name is required"),
	active: z.boolean().default(true),
	schoolId: z.string().min(1, "School ID is required"),
});

type ClassFormData = z.infer<typeof classSchema>;

interface AddClassFormProps {
	onSubmit: SubmitHandler<ClassFormData>; // Use SubmitHandler with correct type
	onClose: () => void;
	schoolId: string;
}

export default function AddClassForm({
	onSubmit,
	onClose,
	schoolId,
}: AddClassFormProps) {
	const methods = useForm<ClassFormData>({
		resolver: zodResolver(classSchema),
		defaultValues: {
			name: "",
			active: true,
			schoolId,
		},
	});

	return (
		<FormProvider {...methods}>
			<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
				<Input
					label="Class Name"
					{...methods.register("name")}
					error={methods.formState.errors.name?.message}
				/>
				<div>
					<label className="flex items-center space-x-2">
						<Checkbox
							checked={methods.watch("active")}
							onCheckedChange={(checked) =>
								methods.setValue("active", checked as boolean)
							}
						/>
						<span>Active</span>
					</label>
					{methods.formState.errors.active && (
						<p className="text-red-500 text-sm">
							{methods.formState.errors.active.message}
						</p>
					)}
				</div>
				<input type="hidden" {...methods.register("schoolId")} />
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">Create Class</Button>
				</div>
			</form>
		</FormProvider>
	);
}
