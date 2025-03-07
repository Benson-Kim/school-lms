"use client";

import { useState, useEffect } from "react";
import {
	FiChevronLeft,
	FiChevronRight,
	FiChevronsLeft,
	FiChevronsRight,
} from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/Select";

interface PaginationProps {
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
}

export default function Pagination({
	currentPage,
	pageSize,
	totalItems,
	totalPages,
	onPageChange,
	onPageSizeChange,
}: PaginationProps) {
	const [pageInput, setPageInput] = useState(currentPage.toString());

	useEffect(() => {
		setPageInput(currentPage.toString());
	}, [currentPage]);

	const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setPageInput(value);
	};

	const handlePageInputSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const pageNum = parseInt(pageInput, 10);
		if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
			onPageChange(pageNum);
		} else {
			setPageInput(currentPage.toString());
		}
	};

	const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newSize = parseInt(e.target.value, 10);
		onPageSizeChange(newSize);
		onPageChange(1); // Reset to page 1
	};

	const pageSizeOptions = [5, 10, 20, 50, 100];

	const startItem = (currentPage - 1) * pageSize + 1;
	const endItem = Math.min(currentPage * pageSize, totalItems);

	return (
		<div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
			{/* Items per page selector */}
			<div className="flex items-center gap-2">
				<span className="text-sm text-gray-700">Items per page:</span>
				<Select
					value={pageSize.toString()}
					onChange={handlePageSizeChange}
					options={pageSizeOptions.map((size) => ({
						value: size.toString(),
						label: size.toString(),
					}))}
					id="pageSize"
				/>
			</div>

			{/* Page info and navigation */}
			<div className="flex items-center gap-4">
				<span className="text-sm text-gray-700">
					Showing {startItem} - {endItem} of {totalItems} items
				</span>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(1)}
						disabled={currentPage === 1}
						icon={<FiChevronsLeft />}
						aria-label="First page"
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						icon={<FiChevronLeft />}
						aria-label="Previous page"
					/>

					<form onSubmit={handlePageInputSubmit} className="flex items-center">
						<input
							type="text"
							value={pageInput}
							onChange={handlePageInputChange}
							className="w-12 text-center border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Go to page"
						/>
						<span className="ml-2 text-sm text-gray-700">of {totalPages}</span>
					</form>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						icon={<FiChevronRight />}
						aria-label="Next page"
					/>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange(totalPages)}
						disabled={currentPage === totalPages}
						icon={<FiChevronsRight />}
						aria-label="Last page"
					/>
				</div>
			</div>
		</div>
	);
}
