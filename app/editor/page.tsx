"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditorPage() {
  const router = useRouter()

  // Set document title on client side
  useEffect(() => {
    document.title = "Content Editor - WordWise AI"
  }, [])

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Content Editor</h1>
            <p className="text-muted-foreground">Create a new project to start editing</p>
          </div>
        </div>

        {/* Create New Project Options */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/documents/new")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                New Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Start with a document and let AI transform it into engaging content
              </p>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/?new-project=true")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New InstaCarousel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create Instagram carousel content from scratch with AI assistance
              </p>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Carousel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Need to edit an existing project?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Access your existing projects from the dashboard, or create a new one to get started with the content editor.
            </p>
            <Link href="/">
              <Button variant="outline">
                View All Projects
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
