"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";
import { useRole } from "@/context/RoleContext";
import useSWR from "swr";
import { sidebarItemsByRole } from "@/config/SidebarItems";

import { RiRefreshLine } from "react-icons/ri";
import Loading from "@/components/ui/Loading";
import { DashboardStats } from "@/components/ui/DashboardStats";
import { DashboardCard } from "@/components/ui/DashboardCard";
// Type for dashboard data with flexible structure
interface DashboardData {
	[key: string]: number | string | undefined;
}

// Fetch function with error handling
const fetcher = async (url: string) => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error("Failed to fetch dashboard data");
	}
	return response.json();
};

export default function Home() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const { role, isLoading: isRoleLoading, error: roleError } = useRole();

	// Fetch dashboard data conditionally based on role
	const {
		data: dashboardData,
		error: dataFetchError,
		isLoading: isDashboardLoading,
	} = useSWR<DashboardData>(
		role ? `/api/${role.toLowerCase()}/dashboard` : null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: true,
			onError: (error) => {
				showToast({
					title: "Dashboard Error",
					description: error.message,
					variant: "destructive",
				});
			},
		}
	);

	// Redirect if not authenticated
	useEffect(() => {
		if (status === "unauthenticated") {
			router.replace("/auth/signin");
		}
	}, [status, router]);

	// Loading states
	if (status === "loading" || isRoleLoading || isDashboardLoading) {
		<Loading size={48} text="Retrieving data" />;
	}

	// Error handling
	if (roleError || status === "unauthenticated") {
		return (
			<div className="flex justify-center items-center h-screen text-red-500">
				{roleError || "Authentication failed. Please sign in."}
			</div>
		);
	}

	// Determine available dashboard tiles based on role
	const dashboardTiles = sidebarItemsByRole[role!]
		.filter((item) => item.name !== "Dashboard")
		.slice(0, 3);

	return (
		<div className="flex flex-col h-full w-full p-4">
			<OfflineIndicator />

			<h1 className="text-3xl font-bold mb-6">{role} Dashboard</h1>

			<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
				{/* Dynamic Dashboard Stats */}
				{dashboardData ? (
					Object.entries(dashboardData).map(([key, value]) => (
						<DashboardCard
							key={key}
							title={key
								.replace(/([A-Z])/g, " $1")
								.replace(/^./, (str) => str.toUpperCase())}
						>
							<p className="text-lg p-4">{value}</p>
						</DashboardCard>
					))
				) : (
					<p className="text-gray-500">
						No dashboard statistics available for {role} role.
					</p>
				)}
			</div>
		</div>
	);
}
