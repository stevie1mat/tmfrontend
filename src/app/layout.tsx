import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import SessionWrapper from "./../components/session-wrapper";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "../contexts/AuthContext";
import 'leaflet/dist/leaflet.css';

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Trade Minutes",
  description: "Trade Minutes - Your marketplace for services and tasks",
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      }
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="alternate icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* Preload critical resources to reduce edge requests */}
        <link rel="preload" href="/favicon.svg" as="image" type="image/svg+xml" />
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
        <link rel="dns-prefetch" href="//cdn.pixabay.com" />
        <link rel="dns-prefetch" href="//images.pexels.com" />
      </head>
      <body
        className={`${urbanist.variable} font-urbanist antialiased`}
      >
        <SessionWrapper>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </AuthProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
