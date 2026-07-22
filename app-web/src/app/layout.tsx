import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contador Inteligente",
  description: "Ingresos, gastos y XML para contadores y clientes.",
};

export const viewport: Viewport = {
  themeColor: "#F5F6F3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a className="calm-skip-link" href="#main-content">Saltar al contenido</a>
        {children}
      </body>
    </html>
  );
}
