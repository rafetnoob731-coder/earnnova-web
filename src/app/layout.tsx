import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EARNNOVA — Premium Earning Platform",
  description:
    "Watch ads, earn rewards, refer friends, and withdraw earnings. Premium earning platform with multi-method withdrawals.",
  keywords: ["earn money", "ads", "rewards", "referral", "cash out"],
  authors: [{ name: "EARNNOVA" }],
  openGraph: {
    title: "EARNNOVA — Premium Earning Platform",
    description: "Watch ads, earn rewards, refer friends, and withdraw earnings.",
    type: "website",
    siteName: "EARNNOVA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
