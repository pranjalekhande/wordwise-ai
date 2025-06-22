"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, User, Camera, Edit, FileText, Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"

interface UserStats {
  carouselsCreated: number
  documentsCreated: number
  avgQualityScore: number
}

export function UserProfile() {
  const { user, isLoaded } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    carouselsCreated: 0,
    documentsCreated: 0,
    avgQualityScore: 0
  })
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    location: ""
  })

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: "",
        location: ""
      })
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats({
          carouselsCreated: data.projectsCount || 0,
          documentsCreated: data.documentsCount || 0,
          avgQualityScore: data.writingScore || 0
        })
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Update basic user profile through Clerk
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      setIsEditing(false)
      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: "",
        location: ""
      })
    }
    setIsEditing(false)
  }

  const handleAvatarUpload = () => {
    // TODO: Implement avatar upload functionality
    toast.info("Avatar upload coming soon!")
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4" />
              <p>Unable to load user profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }) : "Unknown"

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
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="sm" 
                variant="outline" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={handleAvatarUpload}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{fullName}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Free Plan
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    disabled={isLoading}
                  >
                    {isEditing ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.carouselsCreated}</div>
                  <div className="text-sm text-muted-foreground">Carousels Created</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.documentsCreated}</div>
                  <div className="text-sm text-muted-foreground">Documents Created</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.avgQualityScore}</div>
                  <div className="text-sm text-muted-foreground">Writing Score</div>
                </div>
              </div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location (Coming Soon)</Label>
                <Input 
                  id="location" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Feature coming soon..."
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Coming Soon)</Label>
                <Textarea 
                  id="bio" 
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Bio editing will be available soon..."
                  disabled
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {joinDate}
                </div>
              </div>
              
              <div className="text-center py-6 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">More profile customization options coming soon!</p>
                <p className="text-xs mt-1">Bio, location, and avatar upload will be available in future updates.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
