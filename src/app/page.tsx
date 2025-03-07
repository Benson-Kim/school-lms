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
    role ? `/api/dashboard/${role.toLowerCase()}` : null,
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
    },
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  // Loading states
  if (status === "loading" || isRoleLoading || isDashboardLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <span className="loading-spinner mr-2">
            <RiRefreshLine className="animate-spin" />
          </span>
          Loading dashboard...
        </div>
      </div>
    );
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Information Card */}
        <Card title="User Profile" className="p-4">
          <h2 className="text-xl font-semibold mb-2">
            Welcome, {session?.user?.name || "User"}!
          </h2>
          <p className="mb-4">Role: {role}</p>

          {/* Quick Access Navigation */}
          <div className="space-y-2">
            {dashboardTiles.map((tile) => (
              <Button
                key={tile.href}
                onClick={() => router.push(tile.href)}
                className="w-full"
                variant="secondary"
              >
                <tile.icon className="mr-2" />
                {tile.name}
              </Button>
            ))}
          </div>
        </Card>

        {/* Dynamic Dashboard Stats */}
        <Card title="Dashboard Overview" className="p-4">
          {dashboardData ? (
            Object.entries(dashboardData).map(([key, value]) => (
              <p key={key} className="mb-2">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
                : {value}
              </p>
            ))
          ) : (
            <p className="text-gray-500">
              No dashboard statistics available for {role} role.
            </p>
          )}
        </Card>
      </div>

      {/* Sign Out Action */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={() =>
            signOut({ redirect: true, callbackUrl: "/auth/signin" })
          }
          variant="destructive"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
