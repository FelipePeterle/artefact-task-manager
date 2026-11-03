import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/trpc/Provider";
import { ToastProvider } from "@/components/Toast";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Artefact - Task Manager (Next.js 15 + tRPC)",
  description:
    "Productivity task management application with in-memory persistence, tRPC v11, SSR, and Infinite Scroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50/60 text-slate-900 antialiased">
        <TRPCProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
              {children}
            </main>
            <footer className="w-full border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
              <div className="max-w-5xl mx-auto px-4">
                <p className="font-medium text-slate-700">
                  Technical Assessment: Artefact — "AI is about people"
                </p>
                <p className="mt-1 text-slate-400">
                  Engineered with Next.js 15 (App Router), tRPC v11, TypeScript, Tailwind CSS, and In-Memory Store.
                </p>
              </div>
            </footer>
          </ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
