"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { Attendance } from "@prisma/client";

interface AttendancesTableProps {
	attendance: Attendance[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedAttendances: string[];
}

export default function AttendancesTable({
	attendance,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedAttendances,
}: AttendancesTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(attendance.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedAttendances.includes(id)) {
			onSelectionChange(
				selectedAttendances.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedAttendances, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedAttendances.length === attendance.length &&
							attendance.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: Attendance) => (
					<Checkbox
						checked={selectedAttendances.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "date",
				header: "Date",
				render: (item: Attendance) => item.date || "N/A",
			},

			{
				key: "studentId",
				header: "StudentId",
				render: (item: Attendance) => item.studentId || "N/A",
			},

			{
				key: "status",
				header: "Status",
				render: (item: Attendance) => item.status || "N/A",
			},

			{
				key: "note",
				header: "Note",
				render: (item: Attendance) => item.note || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: Attendance) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/teacher/attendance/edit/" + item.id)
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
		[attendance, selectedAttendances]
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
					{attendance.map((item) => (
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
