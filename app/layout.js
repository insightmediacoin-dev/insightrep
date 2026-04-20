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

export const metadata = {
  title: "InsightRep — AI Google Reviews for Indian Hospitality",
  description: "Turn happy diners into authentic Google reviews in 60 seconds. QR-powered AI review system for restaurants, cafes, and hotels across India.",
  metadataBase: new URL("https://qr.insightmedia.co.in"),
  keywords: ["Google reviews", "restaurant reviews India", "AI review generator", "QR review system", "InsightRep", "Insight Media"],
  authors: [{ name: "Insight Media", url: "https://insightmedia.co.in" }],
  creator: "Insight Media",
  openGraph: {
    type: "website",
    url: "https://qr.insightmedia.co.in",
    title: "InsightRep — AI Google Reviews for Indian Hospitality",
    description: "Turn happy diners into authentic Google reviews in 60 seconds. QR-powered AI review system for restaurants, cafes, and hotels across India.",
    siteName: "InsightRep",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "InsightRep — AI Google Review System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightRep — AI Google Reviews for Indian Hospitality",
    description: "Turn happy diners into authentic Google reviews in 60 seconds.",
    images: ["/og"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-navy font-sans text-foreground">
        {children}
      </body>
    </html>
  );
}