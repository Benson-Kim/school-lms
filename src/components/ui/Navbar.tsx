"use client";
import { useSession, signOut, signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "./Button";
import { FiLogOut } from "react-icons/fi";

export function Navbar() {
	const { data: session, status } = useSession();
	return (
		<nav className="bg-[var(--color-charcoal)] text-white p-4 shadow-md">
			<div className="container mx-auto flex justify-between items-center">
				<Link
					href="/"
					className="text-2xl font-bold text-[var(--color-mellow-apricot)] hover:text-[var(--color-copper-red)] transition-colors"
				>
					School Management System
				</Link>

				<div className="space-x-4 flex items-center">
					{status === "authenticated" ? (
						<>
							<span className="text-sm text-[var(--color-mellow-apricot)] ">
								Welcome, {session.user.name || "User"}
							</span>
							<Button
								onClick={() => signOut()}
								className="w-full flex items-center justify-center bg-[var(--color-sweet-brown)] text-white hover:bg-[var(--color-copper-red)] py-2 rounded"
							>
								<FiLogOut size={20} className="" />
								Sign Out
							</Button>
						</>
					) : (
						<Button
							onClick={() => signIn()}
							variant="outline"
							className="border-[var(--color-sweet-brown)] text-[var(--color-sweet-brown)] hover:bg-[var(--color-sweet-brown)] hover:text-white"
						>
							Sign In
						</Button>
					)}
				</div>
			</div>
		</nav>
	);
}
