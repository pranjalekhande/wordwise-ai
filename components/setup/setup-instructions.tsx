"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle } from "lucide-react"

export function SetupInstructions() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to WordWise AI</h1>
          <p className="text-muted-foreground">Configure your environment to get started</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Clerk Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Create a free account at{" "}
                  <Button variant="link" className="h-auto p-0" asChild>
                    <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer">
                      dashboard.clerk.com <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </li>
                <li>Create a new application</li>
                <li>Copy your Publishable Key and Secret Key</li>
                <li>Update the .env.local file with your keys</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Supabase Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Create a free project at{" "}
                  <Button variant="link" className="h-auto p-0" asChild>
                    <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
                      supabase.com <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                </li>
                <li>Go to Settings → API</li>
                <li>Copy your Project URL and anon public key</li>
                <li>Run the provided SQL schema script</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <pre>{`# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here`}</pre>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Refresh the page after updating your environment variables</p>
        </div>
      </div>
    </div>
  )
}
