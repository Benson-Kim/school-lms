import { ReactNode } from "react";
import { Card } from "./Card";

interface DashboardCardProps {
	children: ReactNode;
	className?: string;
	title: string;
	onClick?: () => void;
}

export function DashboardCard({
	title,
	children,
	className = "",
	onClick,
}: DashboardCardProps) {
	return (
		<div
			className={`bg-white rounded-lg shadow-md cursor-pointer border border-gray-200 ${className}`}
		>
			<div className="bg-[var(--color-secondary)] px-5 py-2.5 rounded-t-lg">
				<h2 className="text-lg text-[var(--color-secondary-foreground)] ">
					{title}
				</h2>
			</div>
			{children}
		</div>
	);
}
