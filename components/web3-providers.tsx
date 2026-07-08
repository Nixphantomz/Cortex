"use client";

import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi-config";
import { useTheme } from "@/components/theme-provider";

const queryClient = new QueryClient();

const themeOptions = {
  accentColor: "#A78BFA",
  accentColorForeground: "white",
  borderRadius: "large" as const,
  fontStack: "system" as const,
};

const cortexDark = darkTheme(themeOptions);
const cortexLight = lightTheme(themeOptions);

export function Web3Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme === "dark" ? cortexDark : cortexLight}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}