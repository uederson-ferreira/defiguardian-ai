/**
 * MÓDULO: Providers Minimalista
 * LOCALIZAÇÃO: app/providers.tsx
 * DESCRIÇÃO: Apenas NextAuth + RainbowKit, sem complexidade extra
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useMemo } from "react";
import { getWagmiConfig } from "@/lib/web3-config";
import { Toaster } from "sonner";

import "@rainbow-me/rainbowkit/styles.css";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <WagmiProvider config={getWagmiConfig()}>
          <RainbowKitProvider
            showRecentTransactions={true}
            coolMode={false}
            modalSize="compact"
          >
            {children}
            <Toaster position="top-right" richColors closeButton />
          </RainbowKitProvider>
        </WagmiProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}