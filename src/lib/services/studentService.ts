import { prisma } from "@/lib/db/prisma";
import {
	studentRegistrationSchema,
	bulkEnrollSchema,
} from "@/lib/validation/studentSchema";
import { uploadToS3 } from "@/lib/utils/s3";
import { v4 as uuidv4 } from "uuid";
import { addToSyncQueue } from "./syncService";
import logger from "@/lib/utils/logger";
import { validate } from "@/lib/utils/validation";
import { ApiError } from "@/lib/utils/api";
import bcrypt from "bcryptjs";
import { Student, School, UserRole, AdmissionStatus } from "@prisma/client"; // Use Prisma-generated types
import { z } from "zod";

/**
 * Registers a new student with document uploads and assigns them to a school.
 * @param formData - FormData containing student details, documents, and schoolId
 * @returns Created student object
 * @throws ApiError for validation, upload, or database errors
 */
export async function registerStudent(formData: FormData): Promise<Student> {
	const data = Object.fromEntries(formData.entries());
	const files = formData.getAll("documents") as File[];

	// Validate input
	const parsedData = validate(studentRegistrationSchema, {
		...data,
		dateOfBirth: new Date(data.dateOfBirth as string), // Ensure Date object
	});

	const studentId = `STU-${uuidv4().slice(0, 8).toUpperCase()}`;
	logger.info(`Registering student with ID: ${studentId}`);

	// Verify school exists
	const school = await prisma.school.findUnique({
		where: { id: parsedData.schoolId },
	});
	if (!school) {
		throw new ApiError(`School with ID ${parsedData.schoolId} not found`, 404);
	}

	// Handle document uploads with error handling
	let documentUploads: { fileName: string; fileUrl: string }[] = [];
	try {
		documentUploads = await Promise.all(
			files.map(async (file) => {
				const fileUrl = await uploadToS3(file, `students/${studentId}`);
				return { fileName: file.name, fileUrl };
			})
		);
	} catch (error) {
		logger.error(
			`Failed to upload documents for student ${studentId}: ${
				(error as Error).message
			}`,
			{ error }
		);
		throw new ApiError(
			`Failed to upload documents: ${(error as Error).message}`,
			500
		);
	}

	// Create student record with transaction for atomicity
	try {
		const student = await prisma.student.create({
			data: {
				studentId,
				dateOfBirth: parsedData.dateOfBirth,
				gender: parsedData.gender,
				address: parsedData.address,
				emergencyContact: parsedData.emergencyContact,
				medicalInfo: parsedData.medicalInfo,
				user: {
					create: {
						email: parsedData.email,
						passwordHash: await hashPassword(parsedData.password),
						role: UserRole.STUDENT,
						firstName: parsedData.firstName,
						lastName: parsedData.lastName,
						phoneNumber: parsedData.phoneNumber,
					},
				},
				schoolId: parsedData.schoolId,
				documents: { create: documentUploads },
			},
		});

		// Queue for offline sync if client-side and offline
		if (typeof window !== "undefined" && !navigator.onLine) {
			await addToSyncQueue("student", "create", student);
			logger.info(`Student ${studentId} queued for offline sync`);
		}

		return student;
	} catch (error) {
		logger.error(
			`Failed to register student ${studentId}: ${(error as Error).message}`,
			{ error }
		);
		throw new ApiError(
			`Failed to register student: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Bulk enrolls multiple students and assigns them to schools.
 * @param data - Array of student data conforming to bulkEnrollSchema
 * @returns Array of created student objects
 * @throws ApiError for validation or database errors
 */
export async function bulkEnrollStudents(
	data: z.infer<typeof bulkEnrollSchema>
): Promise<Student[]> {
	const studentId = (index: number) =>
		`STU-${uuidv4().slice(0, 8).toUpperCase()}-${index}`;

	// Validate and transform data
	const parsedData = validate(bulkEnrollSchema, data);
	const defaultPassword = "default123";

	// Hash passwords in parallel for efficiency
	const hashedPasswords = await Promise.all(
		parsedData.map(() => hashPassword(defaultPassword))
	);

	try {
		const students = await prisma.$transaction(
			parsedData.map((studentData, index) => {
				const id = studentId(index);
				logger.info(`Bulk enrolling student with ID: ${id}`);

				// Verify school exists
				const school = prisma.school.findUnique({
					where: { id: studentData.schoolId },
				});
				if (!school) {
					throw new ApiError(
						`School with ID ${studentData.schoolId} not found`,
						404
					);
				}

				return prisma.student.create({
					data: {
						studentId: id,
						dateOfBirth: studentData.dateOfBirth, // Already a Date from schema transformation
						gender: studentData.gender,
						address: "",
						user: {
							create: {
								email: studentData.email,
								passwordHash: hashedPasswords[index],
								role: UserRole.STUDENT,
								firstName: studentData.firstName,
								lastName: studentData.lastName,
							},
						},
						schoolId: studentData.schoolId, // Associate with school
						admissionStatus: AdmissionStatus.ENROLLED,
					},
				});
			})
		);

		// Queue for offline sync if client-side and offline
		if (typeof window !== "undefined" && !navigator.onLine) {
			await Promise.all(
				students.map((s: Student) => addToSyncQueue("student", "create", s))
			);
			logger.info(`Bulk enrollment queued for offline sync`);
		}

		return students;
	} catch (error) {
		logger.error(`Bulk enrollment failed: ${(error as Error).message}`, {
			error,
		});
		throw new ApiError(
			`Failed to bulk enroll students: ${(error as Error).message}`,
			500
		);
	}
}

/**
 * Hashes a password for secure storage using bcryptjs.
 * @param password - The plain text password
 * @returns Hashed password string
 */
async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
}

/**
 * Adds a student to an existing school.
 * @param studentId - The ID of the student to add
 * @param schoolId - The ID of the school to add the student to
 * @returns Updated student object
 * @throws ApiError if student or school not found
 */
export async function addStudentToSchool(
	studentId: string,
	schoolId: string
): Promise<Student> {
	try {
		// Verify school exists
		const school = await prisma.school.findUnique({ where: { id: schoolId } });
		if (!school) {
			throw new ApiError(`School with ID ${schoolId} not found`, 404);
		}

		// Verify student exists
		const student = await prisma.student.findUnique({ where: { studentId } });
		if (!student) {
			throw new ApiError(`Student with ID ${studentId} not found`, 404);
		}

		// Update student to associate with school
		const updatedStudent = await prisma.student.update({
			where: { studentId },
			data: { schoolId },
		});

		logger.info(`Student ${studentId} added to school ${schoolId}`);
		return updatedStudent;
	} catch (error) {
		logger.error(
			`Failed to add student ${studentId} to school ${schoolId}: ${
				(error as Error).message
			}`,
			{ error }
		);
		throw new ApiError(
			`Failed to add student to school: ${(error as Error).message}`,
			500
		);
	}
}
