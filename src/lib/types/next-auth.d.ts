import "next-auth";

declare module "next-auth" {
	interface Session {
		user: {
			schoolId: string | null;
			id: string;
			role: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
		};
	}

	interface User {
		id: string;
		role: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		schoolId?: string | null;
	}
}
