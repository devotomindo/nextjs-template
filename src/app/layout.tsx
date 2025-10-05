import "../lib/orpc/client.server"; // for pre-rendering ORPC client

import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/lib/tanstack-query/provider";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - Ujian Adaptif PUPR",
    default: "Ujian Adaptif PUPR",
  },
  description: "Ujian Adaptif PUPR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <NextTopLoader />

        <TanstackQueryProvider>
          <div className="min-h-dvh">
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          </div>

          <Toaster position="top-right" richColors closeButton theme="light" />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
