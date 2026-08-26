import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/context/AuthContext";
import { NavigationLoadingProvider } from "@/components/ui/NavigationLoadingProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lantawon Nato | Movies, Series & Anime",
  description: "Lantawon Nato — Your local-first streaming hub. Discover, search, and watch movies, series, and anime with smart filters and infinite browsing.",
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2", sizes: "32x32" },
      { url: "/icon.png?v=2", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-[#e5e2e1] min-h-screen font-sans selection:bg-[#ff3b30] selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <NavigationLoadingProvider>{children}</NavigationLoadingProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
