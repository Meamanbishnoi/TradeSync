import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/components/Providers";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Notion Trading Journal",
  description: "A minimalist trading journal inspired by Notion",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  let displayName = session?.user?.email;
  if (session && (session.user as any).id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { name: true, email: true }
    });
    if (dbUser) {
      displayName = dbUser.name || dbUser.email;
    }
  }

  return (
    <html lang="en">
      <body>
        <Providers>
          <nav style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 24px', 
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-color)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <Link href="/" style={{ fontWeight: 600, fontSize: "18px" }}>
              Journal
            </Link>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {session ? (
                <>
                  <Link 
                    href="/profile"
                    className="profile-link"
                    style={{ 
                      fontSize: "16px", 
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {displayName}
                  </Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login" style={{ fontSize: "16px", color: 'var(--text-secondary)' }}>Login</Link>
                  <Link href="/register" className="notion-button notion-button-primary">Sign up</Link>
                </>
              )}
            </div>
          </nav>
          <main className="container">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
