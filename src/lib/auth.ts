import NextAuth, { NextAuthOptions, User, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const credentialsSchema = z.object({
          email: z.string().email(),
          password: z.string(),
        });
        const parsedCredentials = credentialsSchema.parse(credentials);

        const user = await prisma.user.findUnique({
          where: { email: parsedCredentials.email },
        });

        if (
          !user ||
          !verifyPassword(parsedCredentials.password, user.passwordHash)
        ) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.firstName,
        } as User;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin", // Ensure the sign-in page is correctly set
  },
  debug: true, // Debug mode to track errors
};

/**
 * Verifies a plain password against a hashed password using bcryptjs.
 */
function verifyPassword(plain: string, hashed: string): boolean {
  return bcrypt.compareSync(plain, hashed);
}

export default NextAuth(authOptions);
export { authOptions };
