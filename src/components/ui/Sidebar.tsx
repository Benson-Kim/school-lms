"use client";
import { useState, useEffect } from "react";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { signOut } from "next-auth/react";
import { Button } from "./Button";
import { useRole } from "@/context/RoleContext";
import { sidebarItemsByRole } from "@/config/SidebarItems";
import { OfflineIndicator } from "./OfflineIndicator";

import Link from "next/link";
import { IconType } from "react-icons";
import { RiArrowDropDownLine, RiArrowDropUpLine } from "react-icons/ri";

type SidebarItem = {
	name: string;
	href?: string;
	icon: IconType;
	subItems?: SidebarItem[];
};

function SidebarItemComponent({
	item,
	onClose,
	isCollapsed,
}: {
	item: SidebarItem;
	onClose: () => void;
	isCollapsed: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	if (item.subItems) {
		return (
			<div>
				<button
					onClick={() => !isCollapsed && setIsExpanded(!isExpanded)}
					className="flex items-center w-full p-2 rounded hover:bg-[var(--color-mellow-apricot)] hover:text-[var(--color-charcoal)] transition-colors"
				>
					<span className="text-lg">
						<item.icon />
					</span>
					<span className={`ml-3 ${isCollapsed ? "md:hidden" : "block"}`}>
						{item.name}
					</span>
					{!isCollapsed && (
						<span className="ml-auto">
							{isExpanded ? (
								<RiArrowDropUpLine size={24} />
							) : (
								<RiArrowDropDownLine size={24} />
							)}
						</span>
					)}
				</button>
				{!isCollapsed && isExpanded && (
					<div className="ml-4 space-y-2">
						{item.subItems.map((subItem) => (
							<SidebarItemComponent
								key={subItem.href || subItem.name}
								item={subItem}
								onClose={onClose}
								isCollapsed={isCollapsed}
							/>
						))}
					</div>
				)}
			</div>
		);
	} else {
		return (
			<Link
				href={item.href!}
				className="flex items-center p-2 rounded hover:bg-[var(--color-mellow-apricot)] hover:text-[var(--color-charcoal)] transition-colors"
				onClick={onClose}
			>
				<span className="text-lg">
					<item.icon />
				</span>
				<span className={`ml-3 ${isCollapsed ? "md:hidden" : "block"}`}>
					{item.name}
				</span>
			</Link>
		);
	}
}

export function Sidebar({
	isOpen = false,
	onClose,
}: {
	isOpen?: boolean;
	onClose: () => void;
}) {
	const { role, isLoading, error } = useRole();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isOffline, setIsOffline] = useState(false);

	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (isLoading) {
		return <div className="text-center p-4">Loading role...</div>;
	}

	if (error) {
		return <div className="text-center p-4 text-red-500">Error: {error}</div>;
	}

	if (!role) {
		return <div className="text-center p-4">No role available.</div>;
	}

	const toggleCollapse = () => setIsCollapsed(!isCollapsed);
	const sidebarItems = sidebarItemsByRole[role] || [];

	return (
		<>
			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
					onClick={onClose}
				/>
			)}

			{/* Sidebar Container */}
			<div
				className={`
                    fixed h-screen bg-[var(--color-charcoal)] text-white transition-all duration-300 z-50 shadow-lg
                    ${isOpen ? "w-64 left-0" : "w-0 -left-64"}
                    ${isCollapsed ? "md:w-16" : "md:w-64"} md:static md:h-auto
                `}
			>
				<div className="h-full flex flex-col">
					{/* Sidebar Header */}
					<div className="p-4 flex items-center justify-between border-b border-[var(--color-spicy-mix)]">
						<h2
							className={`text-xl font-bold ${
								isCollapsed ? "md:hidden" : "block"
							}`}
						>
							{role} Panel
						</h2>
						<div>
							<Button
								onClick={onClose}
								className="md:hidden bg-[var(--color-sweet-brown)] text-white hover:bg-[var(--color-copper-red)] p-2 rounded-full"
							>
								<FiX size={20} />
							</Button>
							<Button
								onClick={toggleCollapse}
								className="hidden md:block bg-[var(--color-sweet-brown)] text-white hover:bg-[var(--color-copper-red)] p-2 rounded-full"
							>
								{isCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
							</Button>
						</div>
					</div>

					{/* Offline Indicator */}
					{isOffline && <OfflineIndicator />}

					{/* Navigation Links */}
					<nav className="flex-1 p-4 space-y-2">
						{sidebarItems.map((item) => (
							<SidebarItemComponent
								key={item.href || item.name}
								item={item}
								onClose={onClose}
								isCollapsed={isCollapsed}
							/>
						))}
					</nav>

					{/* Sign Out Button */}
					<div className="p-4">
						<Button
							onClick={() => signOut()}
							className="w-full flex items-center justify-center bg-[var(--color-sweet-brown)] text-white hover:bg-[var(--color-copper-red)] py-2 rounded"
						>
							<FiLogOut size={20} />
							<span className={`ml-2 ${isCollapsed ? "md:hidden" : "block"}`}>
								Sign Out
							</span>
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
