"use client"

import type React from "react"

import { useAuth } from "@clerk/nextjs"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { LandingPage } from "@/components/landing/landing-page"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !isSignedIn && pathname !== "/") {
      router.push("/sign-in")
    }
  }, [isLoaded, isSignedIn, router, pathname])

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Not signed in
  if (!isSignedIn) {
    // Show landing page for home route
    if (pathname === "/") {
      return <LandingPage />
    }
    
    // Show redirecting message for other routes
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Redirecting to sign in...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
