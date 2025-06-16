"use client"

import { CreditCard, Download, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function BillingSettings() {
  const billingData = {
    plan: "Pro",
    price: "$19.99",
    period: "month",
    nextBilling: "July 16, 2024",
    paymentMethod: "**** **** **** 4242",
    invoices: [
      { id: "INV-001", date: "June 16, 2024", amount: "$19.99", status: "Paid" },
      { id: "INV-002", date: "May 16, 2024", amount: "$19.99", status: "Paid" },
      { id: "INV-003", date: "April 16, 2024", amount: "$19.99", status: "Paid" },
    ],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{billingData.plan} Plan</h3>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Current
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {billingData.price}/{billingData.period} • Next billing: {billingData.nextBilling}
              </p>
            </div>
            <div className="space-x-2">
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Payment Method</h4>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <span>{billingData.paymentMethod}</span>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Download your invoices and view payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingData.invoices.map((invoice, index) => (
              <div key={invoice.id}>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-1">
                    <p className="font-medium">{invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{invoice.amount}</span>
                    <Badge variant="outline">{invoice.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {index < billingData.invoices.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
