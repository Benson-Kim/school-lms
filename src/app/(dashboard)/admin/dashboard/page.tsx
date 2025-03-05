"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DashboardStats } from "@/components/ui/DashboardStats";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { ModalCard } from "@/components/ui/ModalCard";
import useSWR from "swr";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";
import { Input } from "@/components/ui/Input";
import StudentRegistrationForm from "@/components/forms/StudentRegistrationForm";
import { RiRefreshLine } from "react-icons/ri";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AdminDashboardData {
	totalStudents: number;
	activeClasses: number;
	pendingAdmissions: number;
	recentRegistrations: {
		studentId: string;
		firstName: string;
		lastName: string;
		createdAt: Date;
	}[];
}

export default function AdminDashboard() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalContent, setModalContent] = useState<
		"register" | "bulk" | string | null
	>(null);

	const {
		data: dashboardData,
		error,
		isLoading,
	} = useSWR<AdminDashboardData>(
		status === "authenticated" ? "/api/admin/dashboard" : null,
		fetcher
	);

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

	if (status === "loading" || isLoading) {
		return (
			<div className="text-center p-4">
				<RiRefreshLine className="animate-spin" />
				Loading...
			</div>
		);
	}

	const openModal = (content: "register" | "bulk" | string) => {
		setModalContent(content);
		setIsModalOpen(true);
	};

	const renderModalContent = () => {
		if (modalContent === "register") {
			return <StudentRegistrationForm />;
		}

		if (modalContent === "bulk") {
			return <p>Bulk Enrollment Form Coming Soon...</p>;
		}

		return <p>{modalContent}</p>;
	};

	return (
		<div className="container mx-auto p-4">
			<OfflineIndicator />
			<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
				<DashboardStats
					title="Total Students"
					value={dashboardData?.totalStudents || 0}
					onClick={() =>
						openModal(`Total Students: ${dashboardData?.totalStudents || 0}`)
					}
				/>
				<DashboardStats
					title="Active Classes"
					value={dashboardData?.activeClasses || 0}
					onClick={() =>
						openModal(`Active Classes: ${dashboardData?.activeClasses || 0}`)
					}
				/>
				<DashboardStats
					title="Pending Admissions"
					value={dashboardData?.pendingAdmissions || 0}
					onClick={() =>
						openModal(
							`Pending Admissions: ${dashboardData?.pendingAdmissions || 0}`
						)
					}
				/>
			</div>

			<Button
				onClick={() => openModal("register")}
				className="mt-4 bg-sweet-brown text-white hover:bg-copper-red"
			>
				Register New Student
			</Button>

			<Button
				onClick={() => openModal("bulk")}
				className="mt-4 ml-2 bg-sweet-brown text-white hover:bg-copper-red"
			>
				Bulk Enroll Students
			</Button>

			<ModalCard
				title={
					modalContent === "register"
						? "Register Student"
						: modalContent === "bulk"
						? "Bulk Enroll Students"
						: "Dashboard Details"
				}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				className="bg-mellow-apricot border-sweet-brown"
			>
				{renderModalContent()}
				<Button
					onClick={() => setIsModalOpen(false)}
					className="mt-4 bg-sweet-brown text-white hover:bg-copper-red"
				>
					Close
				</Button>
			</ModalCard>
		</div>
	);
}
