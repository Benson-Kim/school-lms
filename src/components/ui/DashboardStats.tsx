import { ReactNode } from "react";
import { Card } from "./Card";

interface DashboardStatsProps {
	title: string;
	value: ReactNode;
	className?: string;
	onClick?: () => void;
}

export function DashboardStats({
	title,
	value,
	className = "",
	onClick,
}: DashboardStatsProps) {
	return (
		<Card title={title} className={`cursor-pointer ${className}`}>
			<p className="text-xl p-4">{value}</p>
		</Card>
	);
}
