"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { School } from "@prisma/client";

interface SchoolsTableProps {
	schools: School[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedSchools: string[];
}

export default function SchoolsTable({
	schools,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedSchools,
}: SchoolsTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(schools.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedSchools.includes(id)) {
			onSelectionChange(
				selectedSchools.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedSchools, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={
							selectedSchools.length === schools.length && schools.length > 0
						}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: School) => (
					<Checkbox
						checked={selectedSchools.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "name",
				header: "Name",
				render: (item: School) => item.name || "N/A",
			},

			{
				key: "address",
				header: "Address",
				render: (item: School) => item.address || "N/A",
			},

			{
				key: "city",
				header: "City",
				render: (item: School) => item.city || "N/A",
			},

			{
				key: "state",
				header: "State",
				render: (item: School) => item.state || "N/A",
			},

			{
				key: "zipCode",
				header: "ZipCode",
				render: (item: School) => item.zipCode || "N/A",
			},

			{
				key: "country",
				header: "Country",
				render: (item: School) => item.country || "N/A",
			},

			{
				key: "phone",
				header: "Phone",
				render: (item: School) => item.phone || "N/A",
			},

			{
				key: "email",
				header: "Email",
				render: (item: School) => item.email || "N/A",
			},

			{
				key: "website",
				header: "Website",
				render: (item: School) => item.website || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: School) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/it/schools/edit/" + item.id)
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
		[schools, selectedSchools]
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
					{schools.map((item) => (
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
