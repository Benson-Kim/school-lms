"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Class } from "@prisma/client";

interface ClasssTableProps {
	courses: Class[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedClasses: string[];
	onEdit: (classItem: Class) => void; // Added
	onDelete: (classItem: Class) => void; // Added
}

export default function ClassesTable({
	courses,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedClasses,
	onEdit,
	onDelete,
}: ClasssTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(courses.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedClasses.includes(id)) {
			onSelectionChange(
				selectedClasses.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedClasses, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedClasses.length === courses.length && courses.length > 0
						}
						onCheckedChange={handleSelectAll}
					/>
				),
				render: (item: Class) => (
					<Checkbox
						checked={selectedClasses.includes(item.id)}
						onCheckedChange={() => handleSelect(item.id)}
					/>
				),
			},
			{
				key: "name",
				header: "Name",
				render: (item: Class) => item.name || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Class) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onEdit(item)} // Updated to trigger modal
							icon={<FiEdit />}
						>
							Edit
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => onDelete(item)} // Updated to trigger modal
							icon={<FiTrash />}
						>
							Delete
						</Button>
					</div>
				),
			},
		],
		[courses, selectedClasses, onEdit, onDelete] // Added dependencies
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
					{courses.map((item) => (
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
