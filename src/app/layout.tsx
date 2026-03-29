import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Providers } from "@/components/Providers";
import ProfileDropdown from "@/components/ProfileDropdown";
import ThemeToggle from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "TradeSync",
  description: "A sleek, minimalist trading journal application.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TradeSync",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  let displayName = session?.user?.email;
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    });
    if (dbUser) {
      displayName = dbUser.name || dbUser.email;
    }
  }

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || t === 'light') {
                document.documentElement.setAttribute('data-theme', t);
              } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
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
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{ background: 'var(--text-primary)', color: 'var(--bg-color)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: "19px", color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Trade<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sync</span>
              </span>
            </Link>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <ThemeToggle />
              {session ? (
                <ProfileDropdown displayName={displayName ?? null} />
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
