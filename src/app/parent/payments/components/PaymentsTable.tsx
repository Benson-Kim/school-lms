"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Payment } from "@prisma/client";

interface PaymentsTableProps {
	payments: Payment[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedPayments: string[];
}

export default function PaymentsTable({
	payments,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedPayments,
}: PaymentsTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(payments.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedPayments.includes(id)) {
			onSelectionChange(
				selectedPayments.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedPayments, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedPayments.length === payments.length && payments.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Payment) => (
					<Checkbox
						checked={selectedPayments.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "amount",
				header: "Amount",
				render: (item: Payment) => item.amount || "N/A",
			},

			{
				key: "description",
				header: "Description",
				render: (item: Payment) => item.description || "N/A",
			},

			{
				key: "date",
				header: "Date",
				render: (item: Payment) => item.date || "N/A",
			},

			{
				key: "status",
				header: "Status",
				render: (item: Payment) => item.status || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Payment) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/parent/payments/edit/" + item.id)
							}
							icon={<FiEdit />}
						>
							Edit
						</Button>
						<Button
							variant="danger"
							size="sm"
							onClick={() => {
								/* Add delete logic here */
							}}
							icon={<FiTrash />}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[payments, selectedPayments]
	);

	return (
		<div className="mt-6">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
							>
								{col.header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{payments.map((item) => (
						<tr key={item.id}>
							{columns.map((col) => (
								<td key={col.key} className="px-6 py-4 whitespace-nowrap">
									{col.render(item)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<Pagination
				currentPage={pagination.currentPage}
				pageSize={pagination.pageSize}
				totalItems={pagination.totalItems}
				totalPages={pagination.totalPages}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
			/>
		</div>
	);
}
