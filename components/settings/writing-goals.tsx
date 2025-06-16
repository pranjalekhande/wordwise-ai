"use client"

import { useState } from "react"
import { Target, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function WritingGoals() {
  const [dailyWordTarget, setDailyWordTarget] = useState("500")
  const [weeklyProjects, setWeeklyProjects] = useState("3")
  const [preferredTime, setPreferredTime] = useState("morning")

  // Demo progress data
  const progress = {
    dailyWords: 342,
    dailyTarget: 500,
    weeklyProjects: 2,
    weeklyTarget: 3,
    streak: 7,
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

          <Button>Save Goals</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
          <CardDescription>Track your writing achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Daily Words
                </Label>
                <span className="text-sm text-muted-foreground">
                  {progress.dailyWords} / {progress.dailyTarget}
                </span>
              </div>
              <Progress value={(progress.dailyWords / progress.dailyTarget) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Weekly Projects
                </Label>
                <span className="text-sm text-muted-foreground">
                  {progress.weeklyProjects} / {progress.weeklyTarget}
                </span>
              </div>
              <Progress value={(progress.weeklyProjects / progress.weeklyTarget) * 100} className="h-2" />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium">Writing Streak</span>
            </div>
            <div className="text-2xl font-bold text-primary">{progress.streak} days</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
