"use client"

import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { ProjectList } from "@/components/dashboard/project-list"
import { NewProjectDialog } from "@/components/dashboard/new-project-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Plus, TrendingUp, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

interface UserStats {
  writingScore: number
}

export default function HomePage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false)

  useEffect(() => {
    if (isSignedIn) {
      fetchUserStats()
    } else {
      setIsLoading(false)
    }
  }, [isSignedIn])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Silently handle stats loading failure - user will see default values
        setStats({ writingScore: 0 })
      }
    } catch (error) {
      // Silently handle network errors - user will see default values
      setStats({ writingScore: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewDocument = () => {
    router.push("/documents/new")
  }

  const handleNewProject = () => {
    setIsNewProjectDialogOpen(true)
  }

  // Show loading state while authentication is being checked
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  // Show landing page for unauthenticated users
  if (!isSignedIn) {
    return <LandingPage />
  }

  // Show dashboard for authenticated users
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNewDocument}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              New Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Start writing with our AI-powered editor</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleNewProject}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New InstaCarousel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Create Instagram carousel content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Writing Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.writingScore || 0}</div>
                <p className="text-xs text-muted-foreground">Based on recent activity</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ProjectList />
      
      {/* New Project Dialog */}
      <NewProjectDialog 
        isOpen={isNewProjectDialogOpen}
        onOpenChange={setIsNewProjectDialogOpen}
      />
    </div>
  )
}
