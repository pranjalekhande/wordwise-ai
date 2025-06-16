"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SlideEditor } from "@/components/editor/slide-editor"
import { useAppStore } from "@/lib/store"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentProject, setCurrentProject, setSlides, setSelectedTemplate } = useAppStore()

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  const fetchProject = async (projectId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)

      if (!response.ok) {
        throw new Error("Project not found")
      }

      const { project } = await response.json()
      setCurrentProject(project)
      setSlides(project.slides || [])

      if (project.brand_voice_templates) {
        setSelectedTemplate(project.brand_voice_templates)
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      setError("Failed to load project")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading project...</span>
        </div>
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="text-muted-foreground">{error || "The project you're looking for doesn't exist."}</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{currentProject.title}</h1>
          <p className="text-muted-foreground">{currentProject.slides?.length || 0} slides</p>
        </div>
      </div>

      <SlideEditor projectId={params.id as string} />
    </div>
  )
}
