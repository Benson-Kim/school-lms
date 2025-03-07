"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { showToast } from "@/components/ui/Toaster";

// Client-safe logger for page.tsx
const clientLogger = {
  info: (message: string) => console.log(message),
  error: (message: string, data?: any) => console.error(message, data),
  warn: (message: string, data?: any) => console.warn(message, data),
};

export default function ITDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === "unauthenticated" || session?.user.role !== "IT") {
    return null; // Handled by useEffect redirect
  }

  return (
    <div className="container mx-auto p-4">
      <OfflineIndicator />
      <h1 className="text-3xl font-bold mb-6 text-charcoal">IT Dashboard</h1>
      <Card title="IT Overview" className="p-4">
        <p>Welcome, {session?.user?.name || "IT User"}!</p>
        <p>Manage system-wide settings, users, security, and integrations.</p>
        <Button
          onClick={() => router.push("/it/schools")}
          className="mt-4 bg-sweet-brown text-white hover:bg-copper-red"
        >
          Manage Schools
        </Button>
      </Card>
    </div>
  );
}
