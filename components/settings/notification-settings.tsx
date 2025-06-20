"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose how you want to be notified about your account activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email updates about your carousels and account</p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailNotifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">Get push notifications in your browser</p>
          </div>
          <Switch
            checked={settings.pushNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, pushNotifications: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Weekly Reports</Label>
            <p className="text-sm text-muted-foreground">Receive a weekly summary of your activity</p>
          </div>
          <Switch
            checked={settings.weeklyReports}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, weeklyReports: checked })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
