import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import ProfileDropdown from "@/components/ProfileDropdown";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import SecurityQuestionPrompt from "@/components/SecurityQuestionPrompt";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
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
  const displayName = session?.user?.name || session?.user?.email || null;

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
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>
          <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <nav style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '10px 16px', 
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-color)',
              flexShrink: 0,
              zIndex: 10,
              gap: '8px',
            }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ background: 'var(--text-primary)', color: 'var(--bg-color)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: "20px", color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
                  Trade<span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Sync</span>
                </span>
              </Link>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <ThemeToggle />
                {session ? (
                  <ProfileDropdown displayName={displayName ?? null} />
                ) : (
                  <>
                    <Link href="/login" style={{ fontSize: "14px", color: 'var(--text-secondary)' }}>Login</Link>
                    <Link href="/register" className="notion-button notion-button-primary" style={{ fontSize: "14px", padding: "6px 12px" }}>Sign up</Link>
                  </>
                )}
              </div>
            </nav>
            <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
              {session && <Sidebar />}
              <main className="main-content" style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                <div className="container">
                  {children}
                </div>
              </main>
            </div>
          </div>
          {session && <MobileNav />}
          {session && <SecurityQuestionPrompt />}
        </Providers>
      </body>
    </html>
  );
}
