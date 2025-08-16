import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import MainNav from "@/components/nav/MainNav";

export const metadata: Metadata = {
  title: "ThinkNote AI",
  description: "Record, transcribe, study smarter.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="bg-white text-neutral-900">
        <body className="min-h-screen">
          <MainNav />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
