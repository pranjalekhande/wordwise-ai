import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { LayoutWrapper } from "@/components/layout/layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WordWise AI - Instagram Carousel",
  description: "AI-powered Instagram carousel copywriting tool",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for required environment variables
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!clerkPublishableKey || clerkPublishableKey === "your_clerk_publishable_key") {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Configuration Required</h1>
              <div className="space-y-2 text-left max-w-md">
                <p className="text-muted-foreground">Please configure your environment variables:</p>
                <div className="bg-muted p-4 rounded-lg text-sm font-mono">
                  <p>1. Create .env.local file</p>
                  <p>2. Add Clerk keys from dashboard.clerk.com</p>
                  <p>3. Add Supabase keys from your project dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ClerkProvider>
      </body>
    </html>
  )
}
