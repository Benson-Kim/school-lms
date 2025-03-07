"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Maintenance } from "@prisma/client";

interface MaintenancesTableProps {
	maintenance: Maintenance[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedMaintenances: string[];
}

export default function MaintenancesTable({
	maintenance,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedMaintenances,
}: MaintenancesTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(maintenance.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedMaintenances.includes(id)) {
			onSelectionChange(
				selectedMaintenances.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedMaintenances, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedMaintenances.length === maintenance.length &&
							maintenance.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Maintenance) => (
					<Checkbox
						checked={selectedMaintenances.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "title",
				header: "Title",
				render: (item: Maintenance) => item.title || "N/A",
			},

			{
				key: "description",
				header: "Description",
				render: (item: Maintenance) => item.description || "N/A",
			},

			{
				key: "priority",
				header: "Priority",
				render: (item: Maintenance) => item.priority || "N/A",
			},

			{
				key: "status",
				header: "Status",
				render: (item: Maintenance) => item.status || "N/A",
			},

			{
				key: "requestedBy",
				header: "RequestedBy",
				render: (item: Maintenance) => item.requestedBy || "N/A",
			},

			{
				key: "location",
				header: "Location",
				render: (item: Maintenance) => item.location || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Maintenance) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/support/maintenance/edit/" + item.id)
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
		[maintenance, selectedMaintenances]
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
					{maintenance.map((item) => (
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
