"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Inventory } from "@prisma/client";

interface InventorysTableProps {
	inventory: Inventory[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedInventorys: string[];
}

export default function InventorysTable({
	inventory,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedInventorys,
}: InventorysTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(inventory.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedInventorys.includes(id)) {
			onSelectionChange(
				selectedInventorys.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedInventorys, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedInventorys.length === inventory.length &&
							inventory.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Inventory) => (
					<Checkbox
						checked={selectedInventorys.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "name",
				header: "Name",
				render: (item: Inventory) => item.name || "N/A",
			},

			{
				key: "quantity",
				header: "Quantity",
				render: (item: Inventory) => item.quantity || "N/A",
			},

			{
				key: "location",
				header: "Location",
				render: (item: Inventory) => item.location || "N/A",
			},

			{
				key: "status",
				header: "Status",
				render: (item: Inventory) => item.status || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Inventory) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/support/inventory/edit/" + item.id)
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
		[inventory, selectedInventorys]
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
					{inventory.map((item) => (
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
