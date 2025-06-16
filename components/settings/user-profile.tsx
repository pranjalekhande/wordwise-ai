"use client"

import { useState } from "react"
import { Camera, Mail, User, Calendar, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function UserProfile() {
  const [name, setName] = useState("Demo User")
  const [email, setEmail] = useState("demo@wordwise.ai")

  // Demo user data
  const userData = {
    name: "Demo User",
    email: "demo@wordwise.ai",
    plan: "Pro",
    joinDate: "January 2024",
    projectsCreated: 12,
    wordsWritten: 15420,
    templatesUsed: 8,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and profile settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                <AvatarFallback className="text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{userData.name}</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  {userData.plan}
                </Badge>
              </div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {userData.email}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {userData.joinDate}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Statistics</CardTitle>
          <CardDescription>Your WordWise AI usage overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{userData.projectsCreated}</div>
              <div className="text-sm text-muted-foreground">Projects Created</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{userData.wordsWritten.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Words Written</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">{userData.templatesUsed}</div>
              <div className="text-sm text-muted-foreground">Templates Used</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
