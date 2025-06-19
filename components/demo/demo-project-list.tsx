"use client"

import { useState } from "react"
import { FileText, MoreHorizontal, Plus, Search, Download, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

const demoProjects = [
  {
    id: "demo-1",
    title: "Summer Fashion Collection",
    slides: 5,
    created_at: "2024-01-15",
    template: true,
  },
  {
    id: "demo-2",
    title: "Fitness Motivation Series",
    slides: 8,
    created_at: "2024-01-10",
    template: false,
  },
  {
    id: "demo-3",
    title: "Recipe Tutorial: Pasta",
    slides: 6,
    created_at: "2024-01-08",
    template: true,
  },
]

export function DemoProjectList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = demoProjects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This is a demo interface. Configure authentication and database to create real carousels.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
                  <h1 className="text-3xl font-bold">InstaCarousels</h1>
        <p className="text-muted-foreground">Manage your Instagram carousels</p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          New InstaCarousel (Demo)
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search carousels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer opacity-75">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold truncate">{project.title}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled className="text-destructive">
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
                  {project.slides} slides • Created {new Date(project.created_at).toLocaleDateString()}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {project.template ? "Template Applied" : "No Template"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400" />
                    <span className="text-xs text-muted-foreground">Demo</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
