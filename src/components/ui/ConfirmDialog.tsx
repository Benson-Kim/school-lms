"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
	isOpen: boolean;
	title: string;
	message: string | React.ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isDestructive?: boolean; // Optional flag for destructive actions (e.g., delete)
}

export default function ConfirmDialog({
	isOpen,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
	isDestructive = false,
}: ConfirmDialogProps) {
	// Handle ESC key to close dialog
	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isOpen) {
				onCancel();
			}
		};
		window.addEventListener("keydown", handleEsc);
		return () => window.removeEventListener("keydown", handleEsc);
	}, [isOpen, onCancel]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 mx-4">
				{/* Title */}
				<h2 className="text-lg font-semibold text-gray-900">{title}</h2>

				{/* Message */}
				<div className="mt-2 text-sm text-gray-600">
					{typeof message === "string" ? <p>{message}</p> : message}
				</div>

				{/* Buttons */}
				<div className="mt-6 flex justify-end gap-3">
					<Button variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button
						variant={isDestructive ? "danger" : "primary"}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
