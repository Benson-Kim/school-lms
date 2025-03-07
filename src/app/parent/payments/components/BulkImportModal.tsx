"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/Toaster";
import { ModalCard } from "@/components/ui/ModalCard";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface BulkImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onImportComplete: () => void;
}

export default function BulkImportModal({
	isOpen,
	onClose,
	onImportComplete,
}: BulkImportModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!file) {
			showToast({
				title: "File import error",
				description: "Please select a file to import",
				variant: "error",
			});
			return;
		}

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/parent/payments/bulk", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Bulk import failed");
			}

			const result = await response.json();
			toast.success(
				`Imported ${result.succeeded.length} payments successfully`
			);
			if (result.failed.length > 0) {
				toast.warn(`${result.failed.length} payments failed to import`);
			}
			onImportComplete();
		} catch (error) {
			console.error("Bulk import error:", error);
			showToast({
				title: "File import error",
				description:
					error instanceof Error
						? error.message
						: "An error occurred during import",
				variant: "error",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<ModalCard isOpen={isOpen} onClose={onClose} title="Bulk Import Payments">
			<form onSubmit={handleSubmit} className="space-y-6">
				<div>
					<Input
						type="file"
						label="Upload CSV File"
						accept=".csv"
						onChange={handleFileChange}
					/>
					<p className="mt-2 text-sm text-gray-500">
						Upload a CSV file with columns matching the Payment fields.
					</p>
				</div>
				<div className="flex justify-end gap-4">
					<Button type="button" variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						type="submit"
						isLoading={isSubmitting}
						disabled={isSubmitting}
					>
						Import
					</Button>
				</div>
			</form>
		</Modal>
	);
}
