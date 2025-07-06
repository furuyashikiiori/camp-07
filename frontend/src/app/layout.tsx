import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRsona",
  description: "QRコードでつながる新しいソーシャルプラットフォーム",
  icons: {
    icon: [
      { url: "/QRsona.ico", sizes: "any", type: "image/x-icon" },
      { url: "/QRsona.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/QRsona.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    shortcut: "/QRsona.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
