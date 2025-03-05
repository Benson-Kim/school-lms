// src/context/RoleContext.tsx

"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";

// Define a more robust context type
type RoleContextType = {
	role: UserRole | null;
	isLoading: boolean;
	error: string | null;
};

// Create context with a default value that matches the type
const RoleContext = createContext<RoleContextType>({
	role: null,
	isLoading: true,
	error: null,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
	const { data: session, status } = useSession();
	const [role, setRole] = useState<UserRole | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Reset loading state and error when session status changes
		setIsLoading(status === "loading");

		if (status === "unauthenticated") {
			setRole(null);
			setError(null);
			setIsLoading(false);
			return;
		}

		if (session?.user?.role) {
			try {
				const roleValue = session.user.role as string;
				const validRole = Object.values(UserRole).find(
					(r) => r === roleValue.toUpperCase()
				) as UserRole | undefined;

				if (!validRole) {
					throw new Error(`Invalid role: ${roleValue}`);
				}

				setRole(validRole);
				setError(null);
			} catch (err) {
				console.error("Role validation error:", err);
				setRole(null);
				setError(err instanceof Error ? err.message : "Unknown role error");
			} finally {
				setIsLoading(false);
			}
		} else {
			setRole(null);
			setIsLoading(false);
		}
	}, [session, status]);

	const contextValue = {
		role,
		isLoading,
		error,
	};

	return (
		<RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>
	);
}

export function useRole() {
	const context = useContext(RoleContext);

	// Comprehensive hook usage check with informative error
	if (context === undefined) {
		throw new Error(
			"useRole must be used within a RoleProvider. " +
				"Ensure that the component is wrapped with RoleProvider in the component tree."
		);
	}

	return context;
}
