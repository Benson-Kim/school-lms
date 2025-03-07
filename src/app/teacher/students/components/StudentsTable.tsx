"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Student } from "@prisma/client";

interface StudentsTableProps {
	students: Student[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedStudents: string[];
}

export default function StudentsTable({
	students,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedStudents,
}: StudentsTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(students.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedStudents.includes(id)) {
			onSelectionChange(
				selectedStudents.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedStudents, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedStudents.length === students.length && students.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Student) => (
					<Checkbox
						checked={selectedStudents.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "studentId",
				header: "StudentId",
				render: (item: Student) => item.studentId || "N/A",
			},

			{
				key: "firstName",
				header: "FirstName",
				render: (item: Student) => item.firstName || "N/A",
			},

			{
				key: "lastName",
				header: "LastName",
				render: (item: Student) => item.lastName || "N/A",
			},

			{
				key: "email",
				header: "Email",
				render: (item: Student) => item.email || "N/A",
			},

			{
				key: "dateOfBirth",
				header: "DateOfBirth",
				render: (item: Student) => item.dateOfBirth || "N/A",
			},

			{
				key: "gender",
				header: "Gender",
				render: (item: Student) => item.gender || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Student) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/teacher/students/edit/" + item.id)
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
		[students, selectedStudents]
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
					{students.map((item) => (
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
