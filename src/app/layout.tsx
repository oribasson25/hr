import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/QueryProvider";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "HR Manager",
  description: "מערכת ניהול גיוס",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full bg-brand-gray-light">
        <QueryProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
