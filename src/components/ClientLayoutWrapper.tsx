"use client";

import { SessionProvider } from "next-auth/react";
import { Navbar } from "./ui/Navbar";
import { OfflineIndicator } from "./ui/OfflineIndicator";
import { Toaster } from "./ui/Toaster";
import { ReactNode, useState } from "react";
import { Sidebar } from "./ui/Sidebar";
import { RoleProvider } from "@/context/RoleContext";
import { Button } from "./ui/Button";

interface ClientLayoutWrapperProps {
	children: ReactNode;
	session: any;
}

export function ClientLayoutWrapper({
	children,
	session,
}: ClientLayoutWrapperProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
	const closeSidebar = () => setIsSidebarOpen(false);

	return (
		<SessionProvider session={session}>
			<RoleProvider>
				<div className="flex h-screen w-screen overflow-hidden">
					{/* Sidebar for all roles */}
					<Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

					{/* Main content area */}
					<div className="flex flex-col flex-1">
						<Navbar />
						<main className="flex-1 p-4 overflow-auto">
							<OfflineIndicator />
							{children}
						</main>
						<Toaster />
					</div>

					{/* Mobile sidebar toggle button */}
					<Button
						onClick={toggleSidebar}
						className="md:hidden fixed top-4 left-4 bg-[#9D3533] text-white hover:bg-[#C57551] z-50"
					>
						☰
					</Button>
				</div>
			</RoleProvider>
		</SessionProvider>
	);
}
