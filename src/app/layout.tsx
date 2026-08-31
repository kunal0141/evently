import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Backdrop3D from "@/components/Backdrop3D";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Evently — Comedy, Concerts, Conferences & More",
  description:
    "Book standup comedy, concerts, workshops, conferences, theatre, sports and more — or host your own event in minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text isolate">
        <Backdrop3D variant="ambient" />
        <NavBar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
