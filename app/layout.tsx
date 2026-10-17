import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Obra Certa Engenharia",
  description: "Gestão completa de obras e orçamentos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${oswald.variable}`}>
      <body className="antialiased min-h-screen bg-stone-50 font-sans">
        {children}
      </body>
    </html>
  );
}
