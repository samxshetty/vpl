import type { Metadata } from "next";
import { Outfit, Rajdhani, Bebas_Neue } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ['400', '500', '600', '700'],
  variable: "--font-display",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: ['400'],
  variable: "--font-numbers",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vista Premier League (VPL)",
  description: "Flagship Digital Broadcast Arena & Tournament Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${rajdhani.variable} ${bebasNeue.variable} font-sans antialiased min-h-screen bg-[#050505] text-white selection:bg-[#990000]/30`}
      >
        {children}
      </body>
    </html>
  );
}
