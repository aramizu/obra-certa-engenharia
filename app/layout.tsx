import type { Metadata } from "next";
import "./globals.css";
import "@/lib/env";

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
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
