import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatbotProvider } from "./context/useChatbot";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import { redirect } from "next/navigation";
import { AdminProvider } from "./context/useAdmin";
import { ComparisonChatbotProvider } from "./context/useComparisonChatbot";
import { DualChatProvider } from "./context/useDualChat";
import { PromptBuilderProvider } from "./context/usePromptBuilder";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CyberGuardian GPT",
  description: "AI online security adviser",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getServerSession(options);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F')
  }
  
  return (
    <ChatbotProvider>
      <ComparisonChatbotProvider>
        <DualChatProvider>
          <PromptBuilderProvider>
            <AdminProvider>
              <html lang="en">
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <body className={inter.className}>{children}</body>
              </html>
            </AdminProvider>
          </PromptBuilderProvider>            
        </DualChatProvider>  
      </ComparisonChatbotProvider>     
    </ChatbotProvider>
  );
}
