import { ButtonHTMLAttributes, ReactNode } from "react";

// Expanded variants and comprehensive type definitions
type ButtonVariant =
	| "default"
	| "outline"
	| "secondary"
	| "destructive"
	| "ghost";

type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	children: ReactNode;
	fullWidth?: boolean;
	isLoading?: boolean;
	icon?: ReactNode;
}

export function Button({
	variant = "default",
	size = "md",
	children,
	fullWidth = false,
	isLoading = false,
	icon,
	...props
}: ButtonProps) {
	// Base styles
	const baseStyles =
		"inline-flex items-center justify-center gap-2 rounded-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

	// Variants
	const variants = {
		default:
			"bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]",
		outline:
			"border border-[var(--color-spicy-mix)] bg-[var(--color-background)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]",
		secondary:
			"bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary)] hover:opacity-80",
		destructive:
			"bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)] hover:opacity-90",
		ghost:
			"hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]",
	};

	// Size classes
	const buttonSizes = {
		xs: "h-6 px-2 text-xs",
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-base",
		lg: "h-12 px-6 text-lg",
	};

	// Handle full-width option
	const widthClass = fullWidth ? "w-full" : "";

	return (
		<button
			{...props}
			disabled={isLoading || props.disabled}
			className={`${baseStyles} ${variants[variant]} ${
				buttonSizes[size]
			} ${widthClass} ${props.className || ""}`}
		>
			{isLoading ? (
				<span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></span>
			) : (
				<>
					{icon && <span className="flex-shrink-0">{icon}</span>}
					{children}
				</>
			)}
		</button>
	);
}
