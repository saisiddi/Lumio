import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Lumion | AI-Powered Accessibility Auditor",
  description: "Make the Web Accessible for Everyone. Scan websites, reveal issues, and suggest instant fixes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} dark`}>
      <body className="antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pt-20">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
