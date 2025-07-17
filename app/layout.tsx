import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthButton } from "@/components/auth-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Stock Review",
  description: "A simple stock review and note-taking application.",
  manifest: "/manifest.webmanifest", // Link to your web app manifest
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between py-4">
              <nav className="flex items-center space-x-4">
                <a href="/" className="text-lg font-bold">
                  Stock Review
                </a>
              </nav>
              <AuthButton />
            </div>
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
