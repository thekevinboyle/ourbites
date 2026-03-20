import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OurBiteMarks - Content Dashboard",
  description: "Content management dashboard for Instagram and TikTok",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${jetbrains.variable} font-mono`}>
        <QueryProvider>
          <div className="flex h-screen">
            <MobileNav />
            <div className="hidden md:flex">
              <Sidebar />
            </div>
            <main className="flex-1 overflow-y-auto pt-14 md:pt-0">{children}</main>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
