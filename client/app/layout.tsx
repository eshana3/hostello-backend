import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "HostelHub – Hostel Marketplace",
  description: "Buy and sell second-hand goods within your hostel community",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* Animated mesh background */}
            <div className="mesh-bg" aria-hidden />

            <Navbar />

            {/* Page content — pad below navbar */}
            <main className="min-h-screen pt-20 md:pt-16">
              {children}
            </main>

            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "glass border-border/50",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
