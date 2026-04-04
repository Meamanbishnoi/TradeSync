import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        // Check if blocked
        const rows = await prisma.$queryRaw<{ isBlocked: boolean; isAdmin: boolean }[]>`
          SELECT "isBlocked", "isAdmin" FROM "User" WHERE id = ${user.id} LIMIT 1
        `;
        if (rows[0]?.isBlocked) throw new Error("Your account has been blocked. Contact admin.");

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return { id: user.id, email: user.email, name: user.name, isAdmin: rows[0]?.isAdmin ?? false };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // For Google OAuth, upsert the user in our DB
      if (account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: { name: user.name ?? undefined },
          create: {
            email: user.email,
            name: user.name ?? null,
            password: "",
            emailVerified: true,
          },
        });
        user.id = dbUser.id;
        // Always use the DB name (may have been updated via profile settings)
        user.name = dbUser.name ?? user.name;
      }
      return true;
    },
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        // Fetch avatarId once on login and store in token
        try {
          const rows = await prisma.$queryRaw<{ avatarId: string | null }[]>`
            SELECT "avatarId" FROM "User" WHERE id = ${user.id} LIMIT 1
          `;
          token.avatarId = rows[0]?.avatarId ?? null;
        } catch { token.avatarId = null; }
      }
      if (trigger === "update") {
        if (sessionData?.name) token.name = sessionData.name;
        if (sessionData?.avatarId !== undefined) token.avatarId = sessionData.avatarId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        if (token.name) session.user.name = token.name as string;
        (session.user as { avatarId?: string | null }).avatarId = (token.avatarId as string | null) ?? null;
        (session.user as { isAdmin?: boolean }).isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
