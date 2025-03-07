"use client";

interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	color?: string;
}

export default function LoadingSpinner({
	size = "md",
	color = "text-blue-600",
}: LoadingSpinnerProps) {
	const sizeStyles = {
		sm: "w-4 h-4 border-2",
		md: "w-8 h-8 border-4",
		lg: "w-12 h-12 border-4",
	};

	return (
		<div className="flex justify-center items-center">
			<div
				className={`
          ${sizeStyles[size]} ${color}
          border-t-transparent border-solid rounded-full animate-spin
        `}
			/>
		</div>
	);
}
