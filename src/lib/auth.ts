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

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return { id: user.id, email: user.email, name: user.name };
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
      }
      // On session update or if name is missing, fetch from DB
      if (trigger === "update" && sessionData?.name) {
        token.name = sessionData.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        if (token.name) session.user.name = token.name as string;
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
