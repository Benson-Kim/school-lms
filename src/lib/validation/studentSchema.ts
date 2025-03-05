import { z } from "zod";

export const studentRegistrationSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
	dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
		message: "Invalid date format. Use YYYY-MM-DD",
	}),
	gender: z.string().min(1, "Gender is required"),
	address: z.string().min(1, "Address is required"),
	emergencyContact: z.string().optional(),
	medicalInfo: z.string().optional(),
	phoneNumber: z.string().optional(),
	schoolId: z.string().uuid("Invalid school ID"),
});

type StudentRegistrationData = z.infer<typeof studentRegistrationSchema>;

export const bulkEnrollSchema = z.array(
	studentRegistrationSchema
		.omit({
			password: true,
			address: true,
			emergencyContact: true,
			medicalInfo: true,
			phoneNumber: true,
		})
		.strict()
		.transform(
			(
				data
			): Omit<
				StudentRegistrationData,
				| "password"
				| "address"
				| "emergencyContact"
				| "medicalInfo"
				| "phoneNumber"
			> => ({
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				dateOfBirth: data.dateOfBirth,
				gender: data.gender,
				schoolId: data.schoolId,
			})
		)
);
