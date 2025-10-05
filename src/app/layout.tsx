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
    template: "%s - NextJS Template",
    default: "NextJS Template",
  },
  description: "NextJS Template",
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
          <main className="min-h-dvh">{children}</main>

          <Toaster position="top-right" richColors closeButton theme="light" />
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
