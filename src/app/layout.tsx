import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocaleProvider } from "@/contexts/LocaleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GA4 Properties Monitor",
  description: "Monitor your GA4 properties and track session anomalies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} min-h-screen bg-black text-white antialiased`}>
        <AuthProvider>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
