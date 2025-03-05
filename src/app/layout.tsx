// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClientLayoutWrapper } from "@/components/ClientLayoutWrapper";
import logger from "@/lib/utils/logger";
import { ApiError } from "@/lib/utils/api";

// Load Inter font from Google Fonts
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "School Management System",
	description:
		"A comprehensive platform for school administration and education",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	try {
		// Fetch session on the server side
		const session = await getServerSession(authOptions);

		return (
			<html lang="en">
				<body className={inter.className}>
					<ClientLayoutWrapper session={session}>
						{children}
					</ClientLayoutWrapper>
				</body>
			</html>
		);
	} catch (error) {
		logger.error(`Layout error: ${(error as Error).message}`, { error });
		throw new ApiError(
			`Failed to load layout: ${(error as Error).message}`,
			500
		);
	}
}
