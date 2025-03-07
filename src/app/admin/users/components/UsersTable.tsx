"use client";

import { useMemo } from "react";
import { FiEdit, FiTrash } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Pagination from "@/components/ui/Pagination";
import { User } from "@prisma/client";

interface UsersTableProps {
	users: User[];
	pagination: {
		currentPage: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
	onSelectionChange: (selectedIds: string[]) => void;
	selectedUsers: string[];
}

export default function UsersTable({
	users,
	pagination,
	onPageChange,
	onPageSizeChange,
	onSelectionChange,
	selectedUsers,
}: UsersTableProps) {
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			onSelectionChange(users.map((item) => item.id));
		} else {
			onSelectionChange([]);
		}
	};

	const handleSelect = (id: string) => {
		if (selectedUsers.includes(id)) {
			onSelectionChange(
				selectedUsers.filter((selectedId) => selectedId !== id)
			);
		} else {
			onSelectionChange([...selectedUsers, id]);
		}
	};

	const columns = useMemo(
		() => [
			{
				key: "select",
				header: (
					<Checkbox
						checked={selectedUsers.length === users.length && users.length > 0}
						onChange={(e) => handleSelectAll(e.target.checked)}
					/>
				),
				render: (item: User) => (
					<Checkbox
						checked={selectedUsers.includes(item.id)}
						onChange={() => handleSelect(item.id)}
					/>
				),
			},

			{
				key: "email",
				header: "Email",
				render: (item: User) => item.email || "N/A",
			},

			{
				key: "firstName",
				header: "FirstName",
				render: (item: User) => item.firstName || "N/A",
			},

			{
				key: "lastName",
				header: "LastName",
				render: (item: User) => item.lastName || "N/A",
			},

			{
				key: "role",
				header: "Role",
				render: (item: User) => item.role || "N/A",
			},

			{
				key: "phoneNumber",
				header: "PhoneNumber",
				render: (item: User) => item.phoneNumber || "N/A",
			},

			{
				key: "active",
				header: "Active",
				render: (item: User) => item.active || "N/A",
			},
			{
				key: "actions",
				header: "Actions",
				render: (item: User) => (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								(window.location.href = "/admin/users/edit/" + item.id)
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
		[users, selectedUsers]
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
					{users.map((item) => (
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
