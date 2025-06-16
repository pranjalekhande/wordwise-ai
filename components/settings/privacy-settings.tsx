"use client"

import { useState } from "react"
import { Shield, Eye, Users, Download, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState(false)
  const [dataCollection, setDataCollection] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [analyticsTracking, setAnalyticsTracking] = useState(true)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Controls</CardTitle>
          <CardDescription>Manage your privacy settings and data preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Public Profile
                </Label>
                <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
              </div>
              <Switch id="profile-visibility" checked={profileVisibility} onCheckedChange={setProfileVisibility} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-collection" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Data Collection
                </Label>
                <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve the service</p>
              </div>
              <Switch id="data-collection" checked={dataCollection} onCheckedChange={setDataCollection} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-emails" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Marketing Communications
                </Label>
                <p className="text-sm text-muted-foreground">Receive emails about new features and promotions</p>
              </div>
              <Switch id="marketing-emails" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics-tracking">Analytics Tracking</Label>
                <p className="text-sm text-muted-foreground">Help us understand how you use WordWise AI</p>
              </div>
              <Switch id="analytics-tracking" checked={analyticsTracking} onCheckedChange={setAnalyticsTracking} />
            </div>
          </div>

          <Button>Save Privacy Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or delete your personal data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </h4>
              <p className="text-sm text-muted-foreground">Download all your projects, documents, and settings</p>
            </div>
            <Button variant="outline">Export</Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </h4>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
