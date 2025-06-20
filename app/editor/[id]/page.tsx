"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { InstagramStyleSlideEditor } from "@/components/editor/instagram-style-slide-editor"
import { TemplateTypeBadge } from "@/components/ui/template-type-badge"
import { useAppStore } from "@/lib/store"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
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
      setError("Failed to load carousel")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateAll = async () => {
    if (!currentProject) return
    
    setIsRegenerating(true)
    try {
      const response = await fetch(`/api/projects/${currentProject.id}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const { project } = await response.json()
        setCurrentProject(project)
        setSlides(project.slides || [])
        
        // Show success feedback
        // You could add a toast notification here
        console.log("Successfully regenerated all slides")
      } else {
        throw new Error("Failed to regenerate slides")
      }
    } catch (error) {
      console.error("Error regenerating slides:", error)
      // You could add error toast notification here
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading carousel...</span>
        </div>
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-xl font-semibold">Carousel not found</h2>
        <p className="text-muted-foreground">{error || "The carousel you're looking for doesn't exist."}</p>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Carousels
        </Button>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Back to Carousels</p>
              </TooltipContent>
            </Tooltip>
            
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold">{currentProject.title}</h1>
                <p className="text-muted-foreground">{currentProject.slides?.length || 0} slides</p>
              </div>
              {currentProject.template_type && (
                <TemplateTypeBadge 
                  templateType={currentProject.template_type}
                  showIcon={true}
                  size="md"
                />
              )}
            </div>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRegenerateAll}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRegenerating ? "Regenerating..." : "Regenerate All Slides"}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <InstagramStyleSlideEditor projectId={params.id as string} />
      </div>
    </TooltipProvider>
  )
}
