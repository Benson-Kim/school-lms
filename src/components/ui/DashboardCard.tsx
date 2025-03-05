import { ReactNode } from "react";
import { Card } from "./Card";

interface DashboardCardProps {
	title: string;
	children: ReactNode;
	className?: string;
}

export function DashboardCard({
	title,
	children,
	className = "",
}: DashboardCardProps) {
	return (
		<Card title={title} className={` ${className}`}>
			<div className="p-4">{children}</div>
		</Card>
	);
}
