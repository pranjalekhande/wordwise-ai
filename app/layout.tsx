import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
// import { ClerkProvider } from "@clerk/nextjs"
// import { AuthGuard } from "@/components/auth/auth-guard"

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
  // Temporarily disabled authentication - uncomment when ready
  /*
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
                  <p>1. Copy .env.local file</p>
                  <p>2. Replace Clerk keys from dashboard.clerk.com</p>
                  <p>3. Replace Supabase keys from your project dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    )
  }
  */

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Temporarily disabled Clerk authentication */}
        {/* <ClerkProvider> */}
        {/* <AuthGuard> */}
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">WordWise AI</h1>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
        {/* </AuthGuard> */}
        {/* </ClerkProvider> */}
      </body>
    </html>
  )
}
