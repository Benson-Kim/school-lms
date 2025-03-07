import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	try {
		// Hash password
		const hashedPassword = await bcrypt.hash("password123", 10);

		// Create Admin User
		// await prisma.user.create({
		// 	data: {
		// 		email: "admin@example.com",
		// 		passwordHash: hashedPassword,
		// 		role: "ADMIN",
		// 		firstName: "Admin",
		// 		lastName: "User",
		// 	},
		// });

		// // Create Teacher User
		// await prisma.user.create({
		// 	data: {
		// 		email: "teacher@example.com",
		// 		passwordHash: hashedPassword,
		// 		role: "TEACHER",
		// 		firstName: "Teacher",
		// 		lastName: "User",
		// 	},
		// });

		// // Create Student User
		// await prisma.user.create({
		// 	data: {
		// 		email: "student@example.com",
		// 		passwordHash: hashedPassword,
		// 		role: "STUDENT",
		// 		firstName: "Student",
		// 		lastName: "User",
		// 	},
		// });

		// // Create Parent User
		// await prisma.user.create({
		// 	data: {
		// 		email: "parent@example.com",
		// 		passwordHash: hashedPassword,
		// 		role: "PARENT",
		// 		firstName: "Parent",
		// 		lastName: "User",
		// 	},
		// });

		// // Create Support Staff User
		// await prisma.user.create({
		// 	data: {
		// 		email: "supportstaff@example.com",
		// 		passwordHash: hashedPassword,
		// 		role: "SUPPORT_STAFF",
		// 		firstName: "Support Staff",
		// 		lastName: "User",
		// 	},
		// });

		// Create IT User
		await prisma.user.create({
			data: {
				email: "it@example.com",
				passwordHash: hashedPassword,
				role: "IT",
				firstName: "It",
				lastName: "User",
			},
		});

		console.log("✅ Users created successfully!");
	} catch (error) {
		console.error("❌ Error creating users:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
main();
