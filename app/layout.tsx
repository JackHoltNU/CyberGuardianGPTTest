import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatbotProvider } from "./context/useChatbot";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyberGuardian GPT",
  description: "AI online security adviser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ChatbotProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ChatbotProvider>    
  );
}
