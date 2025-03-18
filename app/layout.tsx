import { Header } from "@/components/server-header";
import { Footer } from "@/components/footer";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { AnimationProvider } from "@/components/providers/animation-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ToastProvider } from "@/components/ui/toast";

const PlausibleProvider = dynamic(() => import("next-plausible"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });
const title = "MenuMuse – Visualize your menu items with nice images";
const description = "Visualize your menu items with nice images";
const url = "https://www.picmenu.co/";
const ogimage = "https://www.picmenu.co/og-image.png";
const sitename = "picmenu.co";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  icons: {
    icon: [
      { url: "/restaurant-menu-icon.svg", type: "image/svg+xml" },
      { url: "/restaurant-menu-icon.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/restaurant-menu-icon.png",
    apple: { url: "/restaurant-menu-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    images: [ogimage],
    title,
    description,
    url: url,
    siteName: sitename,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: [ogimage],
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="picmenu.co" />
      </head>
      <body
        className={`${inter.className} flex flex-col min-h-screen text-gray-800`}
      >
        <AuthProvider>
          <ToastProvider>
            <AnimationProvider>
              <Header />
              <main className="flex-grow bg-bg-100" style={{ zoom: 0.92 }}>{children}</main>
              <Footer />
            </AnimationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
