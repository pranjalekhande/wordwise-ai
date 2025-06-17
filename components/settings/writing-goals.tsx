"use client"

import { useState, useEffect } from "react"
import { Target, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface UserStats {
  todayWordCount: number
  dailyWordTarget: number
  writingScore: number
  weeklyProjectCount: number
  weeklyProjectTarget: number
  userSettings: {
    dailyWordTarget: number
    weeklyProjectTarget: number
    preferredWritingTime: string
  }
}

export function WritingGoals() {
  const [dailyWordTarget, setDailyWordTarget] = useState("500")
  const [weeklyProjects, setWeeklyProjects] = useState("3")
  const [preferredTime, setPreferredTime] = useState("morning")
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/user/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
        // Set form values from fetched data
        setDailyWordTarget(data.userSettings.dailyWordTarget.toString())
        setWeeklyProjects(data.userSettings.weeklyProjectTarget.toString())
        setPreferredTime(data.userSettings.preferredWritingTime)
      }
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/stats", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyWordTarget: parseInt(dailyWordTarget),
          weeklyProjectTarget: parseInt(weeklyProjects),
          preferredWritingTime: preferredTime,
        }),
      })

      if (response.ok) {
        // Refresh stats after saving
        await fetchUserStats()
        alert("Settings saved successfully!")
      } else {
        alert("Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Writing Goals</CardTitle>
          <CardDescription>Set targets to stay motivated and track your progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="daily-target">Daily Word Target</Label>
              <Input
                id="daily-target"
                type="number"
                value={dailyWordTarget}
                onChange={(e) => setDailyWordTarget(e.target.value)}
                min="100"
                max="5000"
                step="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekly-projects">Weekly Projects Target</Label>
              <Input
                id="weekly-projects"
                type="number"
                value={weeklyProjects}
                onChange={(e) => setWeeklyProjects(e.target.value)}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred-time">Preferred Writing Time</Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (6AM - 12PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12PM - 6PM)</SelectItem>
                <SelectItem value="evening">Evening (6PM - 12AM)</SelectItem>
                <SelectItem value="night">Night (12AM - 6AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Goals
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Track your writing achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading progress...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Daily Words
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {stats?.todayWordCount || 0} / {stats?.dailyWordTarget || 500}
                  </span>
                </div>
                <Progress 
                  value={((stats?.todayWordCount || 0) / (stats?.dailyWordTarget || 500)) * 100} 
                  className="h-2" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Weekly Projects
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {stats?.weeklyProjectCount || 0} / {stats?.weeklyProjectTarget || 3}
                  </span>
                </div>
                <Progress 
                  value={((stats?.weeklyProjectCount || 0) / (stats?.weeklyProjectTarget || 3)) * 100} 
                  className="h-2" 
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Writing Score</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats?.writingScore || 0}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
