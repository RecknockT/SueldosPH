import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "SueldosPH",
    template: "%s · SueldosPH",
  },
  description:
    "Sistema profesional para la liquidación de sueldos de Propiedad Horizontal.",
  icons: { icon: "/favicon.svg" },
}

export const viewport: Viewport = {
  themeColor: "#0b0f19",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
