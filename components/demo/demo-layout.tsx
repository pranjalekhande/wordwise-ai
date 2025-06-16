"use client"

import type React from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface DemoLayoutProps {
  children: React.ReactNode
}

export function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">WordWise AI</h1>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">DEMO MODE</span>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-4">
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Demo mode - Configure Clerk and Supabase to enable full functionality</AlertDescription>
            </Alert>
          </div>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
