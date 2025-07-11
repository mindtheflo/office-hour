import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: {
    template: "%s | Office Hour with Flo",
    default: "Office Hour with Flo",
  },
  description: "Join Flo for daily office hours to help you onboard Notis and answer your questions.",
  openGraph: {
    title: "Office Hour with Flo",
    description: "Daily sessions to help you get started with Notis.",
    // TODO: Replace with your actual production URL
    url: "https://office-hour-with-flo.vercel.app",
    siteName: "Office Hour with Flo",
    images: [
      {
        url: "/social.png",
        width: 1200,
        height: 630,
        alt: "Office Hour with Flo Social Sharing Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Office Hour with Flo",
    description: "Daily sessions to help you get started with Notis.",
    // TODO: Replace with your Twitter handle if you have one
    // creator: "@your_handle",
    images: ["/social.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon@dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: "/icon.png",
  },
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
