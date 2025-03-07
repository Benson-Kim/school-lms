"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Assignment } from "@prisma/client";

interface AssignmentsTableProps {
	assignments: Assignment[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedAssignments: string[];
}

export default function AssignmentsTable({
	assignments,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedAssignments,
}: AssignmentsTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(assignments.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedAssignments.includes(id)) {
			onSelectionChange(
				selectedAssignments.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedAssignments, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedAssignments.length === assignments.length &&
							assignments.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Assignment) => (
					<Checkbox
						checked={selectedAssignments.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "title",
				header: "Title",
				render: (item: Assignment) => item.title || "N/A",
			},

			{
				key: "description",
				header: "Description",
				render: (item: Assignment) => item.description || "N/A",
			},

			{
				key: "dueDate",
				header: "DueDate",
				render: (item: Assignment) => item.dueDate || "N/A",
			},

			{
				key: "totalPoints",
				header: "TotalPoints",
				render: (item: Assignment) => item.totalPoints || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Assignment) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/teacher/assignments/edit/" + item.id)
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
		[assignments, selectedAssignments]
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
					{assignments.map((item) => (
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
