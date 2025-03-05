"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentRegistrationSchema } from "@/lib/validation/studentSchema";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWRMutation from "swr/mutation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Client-safe logger for StudentRegistrationForm
const clientLogger = {
	info: (message: string) => console.log(message),
	error: (message: string, data?: any) => console.error(message, data),
	warn: (message: string, data?: any) => console.warn(message, data),
};

async function registerStudent(url: string, { arg }: { arg: FormData }) {
	const res = await fetch(url, { method: "POST", body: arg });
	if (!res.ok) throw new Error(await res.text());
	return res.json();
}

export default function StudentRegistrationForm() {
	const router = useRouter();
	const [files, setFiles] = useState<File[]>([]);
	const { trigger, isMutating, error } = useSWRMutation(
		"/api/students/register",
		registerStudent
	);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(studentRegistrationSchema),
	});

	const onSubmit = async (data: any) => {
		const formData = new FormData();
		Object.entries(data).forEach(([key, value]) =>
			formData.append(key, value as string)
		);
		files.forEach((file) => formData.append("documents", file));

		try {
			await trigger(formData);
			clientLogger.info("Student registration successful");
			router.push("/admin/students");
		} catch (err) {
			clientLogger.error("Registration failed", { error: err });
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
			<div className=" w-1/2">
				<label
					htmlFor="schoolId"
					className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
				>
					School ID
				</label>
				<Input
					{...register("schoolId")}
					placeholder="School ID"
					error={errors.schoolId?.message}
				/>
			</div>
			<div className="flex items-center justify-between space-x-4">
				<div className=" w-full">
					<label
						htmlFor="firstName"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						First Name
					</label>
					<Input
						{...register("firstName")}
						placeholder="First Name"
						error={errors.firstName?.message}
					/>
				</div>
				<div className=" w-full">
					<label
						htmlFor="lastName"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Last Name
					</label>
					<Input
						{...register("lastName")}
						placeholder="Last Name"
						error={errors.lastName?.message}
					/>
				</div>
			</div>
			<div className=" w-full">
				<label
					htmlFor="email"
					className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
				>
					Email Address
				</label>
				<Input
					{...register("email")}
					placeholder="Email"
					error={errors.email?.message}
				/>
			</div>
			<div className="flex items-center justify-between space-x-4">
				<div className=" w-full">
					<label
						htmlFor="password"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Password
					</label>
					<Input
						{...register("password")}
						type="password"
						placeholder="Password"
						error={errors.password?.message}
					/>
				</div>
				<div className=" w-full">
					<label
						htmlFor="password"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Confirm Password
					</label>
					<Input
						{...register("password")}
						type="password"
						placeholder="Confirm Password"
						error={errors.password?.message}
					/>
				</div>
			</div>

			<div className="flex items-center justify-between space-x-4">
				<div className=" w-full">
					<label
						htmlFor="dateOfBirth"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Date of Birth
					</label>

					<Input
						{...register("dateOfBirth")}
						type="date"
						error={errors.dateOfBirth?.message}
					/>
				</div>
				<div className=" w-full">
					<label
						htmlFor="gender"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Gender
					</label>
					<Input
						{...register("gender")}
						placeholder="Gender"
						error={errors.gender?.message}
					/>
				</div>
				<div className=" w-full">
					<label
						htmlFor="address"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Address
					</label>
					<Input
						{...register("address")}
						placeholder="Address"
						error={errors.address?.message}
					/>
				</div>
			</div>
			<div className="flex items-center justify-between space-x-4">
				<div className=" w-full">
					<label
						htmlFor="emergencyContact"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Emergency Contact
					</label>
					<Input
						{...register("emergencyContact")}
						placeholder="Emergency Contact"
					/>
				</div>
				<div className=" w-full">
					<label
						htmlFor="phoneNumber"
						className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
					>
						Phone Number
					</label>
					<Input {...register("phoneNumber")} placeholder="Phone Number" />
				</div>
			</div>
			<div className=" w-full">
				<label
					htmlFor="medicalInfo"
					className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
				>
					Medical Info
				</label>
				<Input {...register("medicalInfo")} placeholder="Medical Info" />
			</div>
			<Input
				type="file"
				multiple
				onChange={(e) => setFiles(Array.from(e.target.files || []))}
			/>
			{error && <p className="text-red-500">{error.message}</p>}
			<Button type="submit" disabled={isMutating}>
				{isMutating ? "Registering..." : "Register"}
			</Button>
		</form>
	);
}
