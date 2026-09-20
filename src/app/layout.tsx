import type { Metadata } from "next";
import { Geist, Baloo_2 } from "next/font/google";
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
  description: "Brackets! For bears. And other stuff, too, I suppose.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${baloo.variable} antialiased`}
    >
      {/* min-h-[100dvh] instead of min-h-full: iOS Safari's address bar
          shrinks/grows the viewport, and a percentage-height chain
          (html/body height:100%) resolves against the *tallest* possible
          viewport, leaving a phantom scrollable gap once the bar shows.
          Dynamic viewport height tracks the real visible height instead. */}
      <body className="flex min-h-[100dvh] flex-col">{children}</body>
    </html>
  );
}
