"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Save, Bell, Mail, Smartphone, BarChart3, FileText, Settings as SettingsIcon } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  weekly_reports: boolean
  carousel_completion: boolean
  document_processing: boolean
  system_updates: boolean
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: false,
    weekly_reports: true,
    carousel_completion: true,
    document_processing: true,
    system_updates: false,
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/user/settings")
      if (response.ok) {
        const { settings: userSettings } = await response.json()
        if (userSettings.notification_settings) {
          setSettings(userSettings.notification_settings)
        }
      } else {
        toast.error("Failed to load notification settings")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load notification settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_settings: settings
        }),
      })

      if (response.ok) {
        setHasChanges(false)
        toast.success("Notification settings saved successfully!")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save notification settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const notificationOptions = [
    {
      key: "email_notifications" as keyof NotificationSettings,
      title: "Email Notifications",
      description: "Receive email updates about your carousels and account",
      icon: Mail,
    },
    {
      key: "push_notifications" as keyof NotificationSettings,
      title: "Push Notifications",
      description: "Get browser notifications for important updates",
      icon: Smartphone,
    },
    {
      key: "weekly_reports" as keyof NotificationSettings,
      title: "Weekly Reports",
      description: "Receive a weekly summary of your activity and progress",
      icon: BarChart3,
    },
    {
      key: "carousel_completion" as keyof NotificationSettings,
      title: "Carousel Completion",
      description: "Get notified when your carousels are generated and ready",
      icon: FileText,
    },
    {
      key: "document_processing" as keyof NotificationSettings,
      title: "Document Processing",
      description: "Updates when your uploaded documents are processed",
      icon: FileText,
    },
    {
      key: "system_updates" as keyof NotificationSettings,
      title: "System Updates",
      description: "Notifications about new features and system maintenance",
      icon: SettingsIcon,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about your account activity and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationOptions.map((option) => {
            const IconComponent = option.icon
            return (
              <div key={option.key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{option.title}</Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <Switch
                  checked={settings[option.key]}
                  onCheckedChange={(checked) => handleSettingChange(option.key, checked)}
                />
              </div>
            )
          })}

          {hasChanges && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                You have unsaved changes
              </p>
              <Button onClick={saveSettings} disabled={isSaving}>
                {isSaving ? (
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
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>
            Manage all notifications at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const allEnabled = {
                  email_notifications: true,
                  push_notifications: true,
                  weekly_reports: true,
                  carousel_completion: true,
                  document_processing: true,
                  system_updates: true,
                }
                setSettings(allEnabled)
                setHasChanges(true)
              }}
            >
              Enable All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const allDisabled = {
                  email_notifications: false,
                  push_notifications: false,
                  weekly_reports: false,
                  carousel_completion: false,
                  document_processing: false,
                  system_updates: false,
                }
                setSettings(allDisabled)
                setHasChanges(true)
              }}
            >
              Disable All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const essentialOnly = {
                  email_notifications: true,
                  push_notifications: false,
                  weekly_reports: false,
                  carousel_completion: true,
                  document_processing: true,
                  system_updates: false,
                }
                setSettings(essentialOnly)
                setHasChanges(true)
              }}
            >
              Essential Only
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
