"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { showToast } from "@/components/ui/Toaster";

import { z } from "zod";
import { Input } from "@/components/ui/Input";

// Sign-in schema
const signInSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const parsedData = signInSchema.parse({ email, password });

			const result = await signIn("credentials", {
				email: parsedData.email,
				password: parsedData.password,
				redirect: false,
			});

			if (result?.error) {
				setError(result.error);
				showToast({
					title: "Server Error",
					description: `Sign-in failed: ${result.error}`,
					variant: "error",
				});

				return;
			}

			showToast({
				title: "Success",
				description: "Successfully signed in!",
				variant: "success",
			});

			router.push("/");
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			showToast({
				title: "Success",
				description: "An unexpected error occurred. Please try again.",
				variant: "error",
			});
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen">
			<Card title="Sign In" className="max-w-md w-full text-center">
				<form onSubmit={handleSubmit} className="space-y-4 p-6 ">
					<Input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="Email"
						className="border p-2 w-full rounded"
					/>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Password"
						className="border p-2 w-full rounded"
					/>
					{error && <p className="text-red-500">{error}</p>}
					<Button type="submit" className="w-full">
						Sign In
					</Button>
				</form>
			</Card>
		</div>
	);
}
