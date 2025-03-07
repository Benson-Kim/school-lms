"use client";

import { SelectHTMLAttributes, ReactNode, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string | null;
	icon?: ReactNode;
	options: { value: string; label: string }[];
}

export default function Select({
	label,
	error,
	icon,
	options,
	...props
}: SelectProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="flex flex-col gap-1">
			{label && (
				<label htmlFor={props.id} className="text-sm font-medium text-gray-700">
					{label}
				</label>
			)}
			<div className="relative">
				{icon && (
					<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
						{icon}
					</div>
				)}
				<select
					{...props}
					className={`
            w-full p-2 border rounded-md focus:outline-none transition-colors appearance-none
            ${
							error
								? "border-red-500 focus:border-red-500"
								: "border-gray-300 focus:border-blue-500"
						}
            ${icon ? "pl-10" : "pl-3"} pr-8
            bg-white text-gray-700
          `}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
				>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				{/* Chevron down icon for dropdown */}
				<div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
					<FiChevronDown />
				</div>
			</div>
			{error && <p className="text-red-500 text-xs">{error}</p>}
		</div>
	);
}
