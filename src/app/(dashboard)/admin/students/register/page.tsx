"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import StudentRegistrationForm from "@/components/forms/StudentRegistrationForm";
import { Button } from "@/components/ui/Button";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";
import { ModalCard } from "@/components/ui/ModalCard";

// Client-safe logger for page.tsx
const clientLogger = {
	info: (message: string) => console.log(message),
	error: (message: string, data?: any) => console.error(message, data),
	warn: (message: string, data?: any) => console.warn(message, data),
};

export default function RegisterStudentPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		if (status === "unauthenticated") {
			showToast({
				title: "Authentication Error",
				description: "An unexpected error occurred. Please try again.",
				variant: "error",
			});
			router.push("/auth/signin");
		}
	}, [status, router]);

	if (status === "loading") {
		return <div className="text-center p-4">Loading...</div>;
	}

	if (status === "unauthenticated") {
		return null; // Handled by useEffect redirect
	}

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />
			<ModalCard
				title="Register Student"
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				className="bg-[#F1C278] border-[#9D3533]"
			>
				<StudentRegistrationForm />
				<Button
					onClick={() => router.push("/admin/dashboard")}
					className="mt-4"
					variant="outline"
				>
					Back to Dashboard
				</Button>
				<Button
					onClick={() => setIsModalOpen(false)}
					className="mt-4 bg-[#9D3533] text-white hover:bg-[#C57551]"
				>
					Close
				</Button>
			</ModalCard>
		</div>
	);
}
