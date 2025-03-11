"use client";

import { z } from "zod";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import PageFactory, { DataManagementProps } from "@/lib/utils/PageFactory";

// Zod Schema
const schoolSchema = z.object({
	name: z.string().min(1, "School name is required"),
	address: z.string().min(1, "Address is required"),
	city: z.string().optional().nullable(),
	state: z.string().optional().nullable(),
	zipCode: z.string().optional().nullable(),
	country: z.string().min(1, "Country is required"),
	phone: z.string().min(1, "Phone is required"),
	email: z.string().email("Invalid email").min(1, "Email is required"),
	website: z.string().url().optional().nullable(),
});

type SchoolFormData = z.infer<typeof schoolSchema>;

interface School {
	id: string;
	name: string;
	address: string;
	city?: string | null;
	state?: string | null;
	zipCode?: string | null;
	country: string;
	phone: string;
	email: string;
	website?: string | null;
}

// School Form Component
const SchoolForm: React.FC<{
	item?: School | null;
	onSubmit: SubmitHandler<SchoolFormData>;
	onClose: () => void;
}> = ({ item, onSubmit, onClose }) => {
	const methods = useForm<SchoolFormData>({
		resolver: zodResolver(schoolSchema),
		defaultValues: item
			? {
					name: item.name,
					address: item.address,
					city: item.city || "",
					state: item.state || "",
					zipCode: item.zipCode || "",
					country: item.country,
					phone: item.phone,
					email: item.email,
					website: item.website || "",
			  }
			: {
					name: "",
					address: "",
					city: "",
					state: "",
					zipCode: "",
					country: "",
					phone: "",
					email: "",
					website: "",
			  },
	});

	return (
		<FormProvider {...methods}>
			<form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
				<Input
					label="School Name"
					{...methods.register("name")}
					error={methods.formState.errors.name?.message}
				/>
				<Input
					label="Address"
					{...methods.register("address")}
					error={methods.formState.errors.address?.message}
				/>
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="City"
						{...methods.register("city")}
						error={methods.formState.errors.city?.message}
					/>
					<Input
						label="State"
						{...methods.register("state")}
						error={methods.formState.errors.state?.message}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Zip Code"
						{...methods.register("zipCode")}
						error={methods.formState.errors.zipCode?.message}
					/>
					<Input
						label="Country"
						{...methods.register("country")}
						error={methods.formState.errors.country?.message}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<Input
						label="Phone"
						{...methods.register("phone")}
						error={methods.formState.errors.phone?.message}
					/>
					<Input
						label="Email"
						type="email"
						{...methods.register("email")}
						error={methods.formState.errors.email?.message}
					/>
				</div>
				<Input
					label="Website"
					{...methods.register("website")}
					error={methods.formState.errors.website?.message}
				/>
				<div className="flex justify-end space-x-2">
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button type="submit">
						{item ? "Save Changes" : "Create School"}
					</Button>
				</div>
			</form>
		</FormProvider>
	);
};

// School View Component
const SchoolView: React.FC<{ item: School; onClose: () => void }> = ({
	item,
}) => (
	<div className="space-y-2">
		<p>
			<strong>Name:</strong> {item.name}
		</p>
		<p>
			<strong>Address:</strong> {item.address}
		</p>
		<p>
			<strong>City:</strong> {item.city || "N/A"}
		</p>
		<p>
			<strong>State:</strong> {item.state || "N/A"}
		</p>
		<p>
			<strong>Zip Code:</strong> {item.zipCode || "N/A"}
		</p>
		<p>
			<strong>Country:</strong> {item.country}
		</p>
		<p>
			<strong>Phone:</strong> {item.phone}
		</p>
		<p>
			<strong>Email:</strong> {item.email}
		</p>
		<p>
			<strong>Website:</strong> {item.website || "N/A"}
		</p>
	</div>
);

// Table Columns Configuration
const columns: Array<{
	key: keyof School;
	label: string;
	sortable?: boolean;
	render?: (value: unknown, item: School) => React.ReactNode;
	hide?: boolean;
}> = [
	{ key: "name", label: "School Name", sortable: true },
	{ key: "address", label: "Address", sortable: true },
	{ key: "city", label: "City", sortable: true },
	{ key: "state", label: "State", sortable: true },
	{ key: "zipCode", label: "Zip Code", sortable: true },
	{ key: "country", label: "Country", sortable: true },
	{ key: "phone", label: "Phone" },
	{ key: "email", label: "Email" },
	{ key: "website", label: "Website" },
];

// Page Configuration
const schoolManagementProps: DataManagementProps<School, SchoolFormData> = {
	title: "School",
	apiEndpoint: "/api/it/schools",
	schema: schoolSchema,
	requiredRole: "IT",
	columns,
	defaultValues: {
		name: "",
		address: "",
		city: null,
		state: null,
		zipCode: null,
		country: "",
		phone: "",
		email: "",
		website: null,
	},
	FormComponent: SchoolForm,
	ViewComponent: SchoolView,
	convertItemForUpdate: (item) => ({
		name: item.name,
		address: item.address,
		city: item.city || null,
		state: item.state || null,
		zipCode: item.zipCode || null,
		country: item.country,
		phone: item.phone,
		email: item.email,
		website: item.website || null,
	}),
	filterOptions: [
		{ value: "all", label: "All Schools" },
		{ value: "active", label: "Active Schools" },
		{ value: "inactive", label: "Inactive Schools" },
	],
	onBeforeSave: (data) => ({
		...data,
		city: data.city || null,
		state: data.state || null,
		zipCode: data.zipCode || null,
		website: data.website || null,
	}),
};

// Main Component
export default function SchoolManagement() {
	return <PageFactory<School, SchoolFormData> {...schoolManagementProps} />;
}
