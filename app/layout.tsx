import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UNIFEE",
  description: "Comparateur énergie UNIFEE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}