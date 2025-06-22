"use client"

import { CreditCard, Download, Star, AlertCircle, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function BillingSettings() {
  const demoData = {
    plan: "Free",
    price: "$0.00",
    period: "month",
    nextBilling: "No billing required",
    paymentMethod: "No payment method",
    invoices: [
      { id: "DEMO-001", date: "Demo Invoice", amount: "$0.00", status: "Demo" },
      { id: "DEMO-002", date: "Sample Data", amount: "$0.00", status: "Demo" },
      { id: "DEMO-003", date: "Preview Only", amount: "$0.00", status: "Demo" },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong>Demo Page:</strong> This is a preview of the billing interface. Actual billing and subscription features will be available when WordWise AI launches.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your current subscription and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{demoData.plan} Plan</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Current
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {demoData.price}/{demoData.period} • {demoData.nextBilling}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                All features currently available for free during demo
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline" disabled className="opacity-60">
                Upgrade Plan
              </Button>
              <Button variant="outline" disabled className="opacity-60">
                Manage
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{demoData.paymentMethod}</span>
              </div>
              <Button variant="outline" size="sm" disabled className="opacity-60">
                Add Payment
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Payment methods will be available when billing is implemented
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Future Pricing Plans</CardTitle>
          <CardDescription>Planned subscription tiers for WordWise AI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <div className="space-y-2">
                <h3 className="font-semibold">Free Plan</h3>
                <p className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5 carousels per month</li>
                  <li>• Basic templates</li>
                  <li>• Standard support</li>
                </ul>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg border-primary bg-primary/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Pro Plan</h3>
                  <Badge variant="default" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <p className="text-2xl font-bold">$19<span className="text-sm font-normal">/month</span></p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited carousels</li>
                  <li>• Premium templates</li>
                  <li>• AI optimization</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Coming Soon:</strong> Paid plans will be available after the beta period. All current users will have early access to Pro features.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo Billing History</CardTitle>
          <CardDescription>Sample invoice data for interface preview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoData.invoices.map((invoice, index) => (
              <div key={invoice.id}>
                <div className="flex items-center justify-between py-3 opacity-60">
                  <div className="space-y-1">
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="outline">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm" disabled>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {index < demoData.invoices.length - 1 && <Separator />}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Actual billing history will appear here once subscription features are launched
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
