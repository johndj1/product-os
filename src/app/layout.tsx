import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product OS",
  description: "AI-native Product OS starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
