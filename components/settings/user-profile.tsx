"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, User, Camera, Edit, FileText } from "lucide-react"

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    bio: "Content creator specializing in Instagram carousels and visual storytelling. Passionate about helping brands tell their stories through engaging visual content.",
    location: "San Francisco, CA",
    joinDate: "January 2024",
    carouselsCreated: 12,
    documentsCreated: 28,
    planType: "Pro"
  })

  const handleSave = () => {
    setIsEditing(false)
    // Save user data
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="text-2xl">{userData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{userData.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userData.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {userData.planType} Plan
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{userData.carouselsCreated}</div>
                  <div className="text-sm text-muted-foreground">Carousels Created</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{userData.documentsCreated}</div>
                  <div className="text-sm text-muted-foreground">Documents Created</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">4.9</div>
                  <div className="text-sm text-muted-foreground">Avg. Quality Score</div>
                </div>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={userData.location}
                  onChange={(e) => setUserData({...userData, location: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  rows={4}
                  value={userData.bio}
                  onChange={(e) => setUserData({...userData, bio: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bio</Label>
                <p className="mt-1">{userData.bio}</p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {userData.location}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {userData.joinDate}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
