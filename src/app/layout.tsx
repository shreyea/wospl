import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Happy Women's Day — Celebrating You 💕",
  description:
    "A playful celebration dashboard for the most amazing woman — because the world is better with you in it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${dancing.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
