import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { LanguageProvider } from "@/context/LanguageContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AgriPilot AI - Farmer Co-Pilot Platform",
  description: "A farmer-first, voice-enabled, multilingual agricultural assistant powered by Gemini AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#021a12] text-gray-100">
        <LanguageProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

