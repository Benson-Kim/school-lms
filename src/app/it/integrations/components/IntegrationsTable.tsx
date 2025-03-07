"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Integration } from "@prisma/client";

interface IntegrationsTableProps {
	integrations: Integration[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedIntegrations: string[];
}

export default function IntegrationsTable({
	integrations,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedIntegrations,
}: IntegrationsTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(integrations.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedIntegrations.includes(id)) {
			onSelectionChange(
				selectedIntegrations.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedIntegrations, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedIntegrations.length === integrations.length &&
							integrations.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Integration) => (
					<Checkbox
						checked={selectedIntegrations.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "actions",
				header: "Actions",
				render: (item: Integration) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/it/integrations/edit/" + item.id)
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
		[integrations, selectedIntegrations]
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
					{integrations.map((item) => (
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
