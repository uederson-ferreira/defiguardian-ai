/**
 * MÓDULO: Layout Principal Corrigido
 * LOCALIZAÇÃO: app/layout.tsx
 * DESCRIÇÃO: Import path correto após limpeza arquitetural
 */

import { Inter } from "next/font/google";
import { Providers } from "./providers"; // ✅ CORRIGIDO: Caminho correto
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DefiGuardian AI",
  description: "AI-Powered DeFi Risk Management Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}