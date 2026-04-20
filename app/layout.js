import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "./components/WhatsAppButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "InsightRep — AI Google Reviews for Indian Hospitality",
  description: "Turn happy diners into authentic Google reviews in 60 seconds.",
  metadataBase: new URL("https://qr.insightmedia.co.in"),
  openGraph: {
    type: "website",
    url: "https://qr.insightmedia.co.in",
    title: "InsightRep — AI Google Reviews for Indian Hospitality",
    description: "Turn happy diners into authentic Google reviews in 60 seconds.",
    siteName: "InsightRep",
    images: [{ url: "/og", width: 1200, height: 630, alt: "InsightRep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "InsightRep — AI Google Reviews for Indian Hospitality",
    description: "Turn happy diners into authentic Google reviews in 60 seconds.",
    images: ["/og"],
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geistSans.variable + " " + geistMono.variable + " h-full antialiased"}>
      <body className="min-h-full flex flex-col bg-navy font-sans text-foreground">
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
