import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Setda Bagian Umum - Sistem Manajemen Dokumen (DMS)",
  description: "Sistem Manajemen Dokumen Admin Panel - Setda Bagian Umum. Mengelola, mengorganisasi, dan mengamankan dokumen resmi daerah.",
  icons: {
    icon: "/logo-gunungkidul.png",
    apple: "/logo-gunungkidul.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
