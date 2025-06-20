"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Download, Trash2, Eye, EyeOff } from "lucide-react"

export function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState("private")
  const [dataTracking, setDataTracking] = useState(false)
  const [analyticsSharing, setAnalyticsSharing] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Handle account deletion
      console.log("Account deletion requested")
    }
  }

  const handleDataExport = () => {
    // Handle data export
    console.log("Data export requested")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>Control how your information is used and shared</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Profile Visibility</Label>
            <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Public - Anyone can see your profile
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Private - Only you can see your profile
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Data Tracking</Label>
              <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve the app</p>
            </div>
            <Switch checked={dataTracking} onCheckedChange={setDataTracking} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Analytics Sharing</Label>
              <p className="text-sm text-muted-foreground">Share anonymized analytics to help improve features</p>
            </div>
            <Switch checked={analyticsSharing} onCheckedChange={setAnalyticsSharing} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Receive emails about new features and tips</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export or delete your account data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">Download all your carousels, documents, and settings</p>
            </div>
            <Button variant="outline" onClick={handleDataExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <Alert className="border-destructive">
            <Trash2 className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm">Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  Delete Account
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
