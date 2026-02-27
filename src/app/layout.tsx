import type { Metadata } from "next";
import { Noto_Sans_KR, Sora } from "next/font/google";
import { AppProviders } from "@/app/providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora"
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Happy Cloud Platform",
  description: "Cloud service control plane UI",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${sora.variable} ${notoSansKr.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
