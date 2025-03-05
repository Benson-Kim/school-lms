import { InputHTMLAttributes, ReactNode, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: string | null;
	placeholder?: string;
	icon?: ReactNode;
}

export function Input({ error, placeholder, icon, ...props }: InputProps) {
	const [isFocused, setIsFocused] = useState(false);

	return (
		<div className="relative mb-4">
			{icon && (
				<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-charcoal">
					{icon}
				</div>
			)}
			<input
				{...props}
				placeholder={placeholder}
				className={`
          w-full p-2 border rounded focus:outline-none focus:border-sweet-brown transition-colors
          ${error ? "border-red-500" : "border-gray-300"}
          ${icon ? "pl-10" : "pl-2"}
          ${isFocused ? "border-sweet-brown" : ""}
        `}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
			/>
			{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
		</div>
	);
}
