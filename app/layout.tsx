import type { Metadata } from "next";
import "./globals.css";
import "@/lib/env";

export const metadata: Metadata = {
  title: "Minha Engenharia",
  description: "Plataforma de gestão de obras e engenharia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen bg-stone-50">
        {children}
      </body>
    </html>
  );
}
