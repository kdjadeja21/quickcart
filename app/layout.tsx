import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from '@/components/ui/sonner'
import Footer from '@/components/Footer'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quick Cart",
  description: "Quick Cart helps you easily track what's in your shopping cart and how much you're spending. No more forgotten items or surprise totals!"
};

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ClerkProvider>
          <ThemeProvider>
            <main className="flex-1 w-full pb-24 sm:pb-0">
              {children}
            </main>
            <Footer />
            <Toaster richColors closeButton />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
