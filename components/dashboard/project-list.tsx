"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FileText, MoreHorizontal, Search, Download, Trash2, Edit, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/lib/store"
import { formatDate } from "@/lib/utils"
import { NewProjectDialog } from "./new-project-dialog"
import { useRouter } from "next/navigation"
import { DocumentUpload } from "@/components/documents/document-upload"
import type { Document } from "@/lib/types"

export function ProjectList() {
  const { projects, setProjects, deleteProject } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchProjects()
    fetchRecentDocuments()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const { projects } = await response.json()
        setProjects(projects)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchRecentDocuments = async () => {
    try {
      const response = await fetch("/api/documents")
      if (response.ok) {
        const { documents } = await response.json()
        // Get the top 3 most recent documents
        const recent = documents.slice(0, 3)
        setRecentDocuments(recent)
      }
    } catch (error) {
      console.error("Error fetching recent documents:", error)
    }
  }

  const filteredProjects = projects.filter((project) => project.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleProjectClick = (projectId: string) => {
    router.push(`/editor/${projectId}`)
  }

  const handleDocumentClick = (documentId: string) => {
    router.push(`/documents/${documentId}`)
  }

  const handleViewAllDocuments = () => {
    router.push("/documents")
  }

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        deleteProject(projectId)
      }
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const getFileExtension = (fileName: string): string => {
    if (!fileName) return 'DOC'
    const extension = fileName.split('.').pop()?.toUpperCase()
    return extension || 'DOC'
  }

  return (
    <div className="space-y-10">
      {/* Projects Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your Instagram carousel projects</p>
          </div>
          <div className="flex items-center gap-2">
            <DocumentUpload onDocumentCreated={fetchRecentDocuments} />
            <NewProjectDialog />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold truncate">{project.title}</h3>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={(e) => handleDelete(project.id, e)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.slides?.length || 0} slides • Created {formatDate(project.created_at)}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {project.template_id ? "Template Applied" : "No Template"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Saved</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Create your first Instagram carousel project"}
            </p>
            <NewProjectDialog />
          </div>
        )}
             </div>

      {/* Separator */}
      <div className="border-t" />

      {/* Recent Documents Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Documents
            </h2>
            <p className="text-muted-foreground">Your latest document uploads and edits</p>
          </div>
          <Button variant="outline" onClick={handleViewAllDocuments}>
            View All Documents
          </Button>
        </div>

        {recentDocuments.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentDocuments.map((document) => (
              <Card
                key={document.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleDocumentClick(document.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold truncate">{document.title}</h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {document.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {document.word_count} words • {document.char_count} chars
                      </span>
                      <span>{formatDate(document.updated_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {document.language.toUpperCase()}
                        </Badge>
                        {document.file_name && (
                          <Badge variant="outline" className="text-xs">
                            {getFileExtension(document.file_name)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Saved</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first document to get started</p>
            <DocumentUpload onDocumentCreated={fetchRecentDocuments} />
          </div>
        )}
      </div>
    </div>
  )
}
