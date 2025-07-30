import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import ClientWrapper from "./clientinterceptor/ClientWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: [
    "100", "200", "300", "400", "500", "600", "700", "800", "900"
  ],
});

export const metadata: Metadata = {
  title: "Delighto",
  description: "This is a website for Delighto",
  icons: {
    icon: '/Favicon.svg',
    shortcut: '/Favicon.svg',
    apple: '/Favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWrapper>
          {children}
        </ClientWrapper>
      </body>
    </html>
  );
}
