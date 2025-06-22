"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Download, Trash2, Eye, EyeOff, AlertCircle, Lock } from "lucide-react"

export function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState("private")
  const [dataTracking, setDataTracking] = useState(false)
  const [analyticsSharing, setAnalyticsSharing] = useState(false)
  const [marketingEmails, setMarketingEmails] = useState(false)

  const handleDemoAction = (action: string) => {
    alert(`Demo Mode: ${action} functionality will be available when WordWise AI launches with full privacy controls.`)
  }

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong>Demo Page:</strong> This is a preview of privacy controls. Full privacy and data management features will be implemented when WordWise AI launches.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security (Preview)
          </CardTitle>
          <CardDescription>Future privacy controls for your WordWise AI account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">Profile Visibility (Coming Soon)</Label>
            <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility} disabled>
              <div className="flex items-center space-x-2 opacity-60">
                <RadioGroupItem value="public" id="public" disabled />
                <Label htmlFor="public" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Public - Anyone can see your profile
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-60">
                <RadioGroupItem value="private" id="private" disabled />
                <Label htmlFor="private" className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Private - Only you can see your profile
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Profile sharing features will be available in future updates
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Data Tracking (Demo)</Label>
              <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve the app</p>
            </div>
            <Switch checked={dataTracking} onCheckedChange={setDataTracking} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Analytics Sharing (Demo)</Label>
              <p className="text-sm text-muted-foreground">Share anonymized analytics to help improve features</p>
            </div>
            <Switch checked={analyticsSharing} onCheckedChange={setAnalyticsSharing} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Marketing Emails (Demo)</Label>
              <p className="text-sm text-muted-foreground">Receive emails about new features and tips</p>
            </div>
            <Switch checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Privacy-First Approach</p>
            </div>
            <p className="text-xs text-green-700 dark:text-green-400">
              WordWise AI is being built with privacy as a core principle. All data processing will be transparent, 
              with strong encryption and user control over personal information.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Data Management</CardTitle>
          <CardDescription>Planned data export and account management features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">Download all your carousels, documents, and settings</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">GDPR-compliant data export coming soon</p>
            </div>
            <Button variant="outline" disabled className="opacity-60" onClick={() => handleDemoAction("Data Export")}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="space-y-3">
              <h4 className="font-medium">Data Retention Policy</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Account data: Retained until account deletion</p>
                <p>• Usage analytics: Anonymized and retained for 24 months</p>
                <p>• Generated content: Stored securely with encryption</p>
                <p>• Payment data: Handled by secure payment processors only</p>
              </div>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <Trash2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Account Deletion (Future Feature)</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Complete account deletion with data purging will be available at launch. 
                    This will include secure deletion of all personal data within 30 days.
                  </p>
                </div>
                <Button variant="outline" disabled className="opacity-60" onClick={() => handleDemoAction("Account Deletion")}>
                  Preview: Delete Account
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Compliance</CardTitle>
          <CardDescription>Our commitment to data protection and privacy laws</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">GDPR Compliance</h4>
              <p className="text-sm text-muted-foreground">
                Full compliance with EU General Data Protection Regulation for European users.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">CCPA Compliance</h4>
              <p className="text-sm text-muted-foreground">
                California Consumer Privacy Act compliance for US users with data control rights.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Data Encryption</h4>
              <p className="text-sm text-muted-foreground">
                End-to-end encryption for all sensitive data with industry-standard security.
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">No Data Selling</h4>
              <p className="text-sm text-muted-foreground">
                We will never sell your personal data or content to third parties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
