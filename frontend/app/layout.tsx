import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Web3Provider } from "../contexts/Web3Provider";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "../components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RiskGuardian AI",
  description: "AI-powered DeFi risk management platform",
  icons: {
    icon: "/shield-favicon.svg",
    shortcut: "/shield-favicon.svg",
    apple: "/shield-favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Web3Provider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #475569",
                  },
                }}
              />
            </Web3Provider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
