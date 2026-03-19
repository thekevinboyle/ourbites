import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OurBites - Content Dashboard",
  description: "Content management dashboard for Instagram and TikTok",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
