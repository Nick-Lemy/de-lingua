import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeLingua - B2B Marketplace",
  description:
    "Connect with verified suppliers, create missions, and find perfect matches for your business needs.",
  keywords: ["B2B", "marketplace", "suppliers", "business", "procurement"],
  authors: [{ name: "DeLingua Team" }],
  openGraph: {
    title: "DeLingua - B2B Marketplace",
    description: "The future of B2B commerce",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3a8a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
