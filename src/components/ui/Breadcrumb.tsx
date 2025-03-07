"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

interface BreadcrumbItem {
	label: string;
	href: string;
}

interface BreadcrumbProps {
	items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
	return (
		<nav aria-label="Breadcrumb" className="mb-6">
			<ol className="flex items-center gap-2 text-sm text-gray-600">
				{items.map((item, index) => (
					<li key={item.href} className="flex items-center">
						{index > 0 && <FiChevronRight className="mx-1" />}
						{index === items.length - 1 ? (
							<span className="font-medium text-gray-800">{item.label}</span>
						) : (
							<Link
								href={item.href}
								className="hover:text-blue-600 transition-colors"
							>
								{item.label}
							</Link>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
