import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Web3Providers } from "@/components/web3-providers";
import { Navbar } from "@/components/navbar";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cortex — Your AI DeFi Operator",
  description:
    "Talk naturally. Swap, lend, borrow, and manage your portfolio across chains — all through one intelligent assistant.",
};

// Inline script avoids a light-mode flash before ThemeProvider hydrates
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('cortex-theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <Web3Providers>
            <Navbar />
            {children}
          </Web3Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}