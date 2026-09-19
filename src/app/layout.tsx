import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist, Baloo_2 } from "next/font/google";
import AuthStatus from "@/components/AuthStatus";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "bearBracket",
  description: "Build, store, and compare brackets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${baloo.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-cream">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/transbearant.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="font-heading text-lg font-bold text-ink">
              bearBracket
            </span>
          </Link>
          <AuthStatus />
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
