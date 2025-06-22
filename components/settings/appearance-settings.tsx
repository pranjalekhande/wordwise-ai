"use client"

import { useState, useEffect } from "react"
import { Monitor, Moon, Sun, Palette, Type, Globe, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface AppearancePreferences {
  theme: "light" | "dark" | "system"
  language: string
  font_size: "small" | "medium" | "large"
  auto_save: boolean
  spell_check: boolean
  compact_mode: boolean
}

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useState<AppearancePreferences>({
    theme: "light",
    language: "en",
    font_size: "medium",
    auto_save: true,
    spell_check: true,
    compact_mode: false,
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadPreferences()
    
    // Apply default font size immediately
    applyFontSize("medium")
  }, [])

  // Sync theme with next-themes when preferences change
  useEffect(() => {
    if (mounted && theme !== preferences.theme) {
      setTheme(preferences.theme)
    }
  }, [preferences.theme, mounted, theme, setTheme])

  // Apply font size changes to document root
  useEffect(() => {
    if (mounted) {
      applyFontSize(preferences.font_size)
    }
  }, [preferences.font_size, mounted])

  const applyFontSize = (fontSize: "small" | "medium" | "large") => {
    const root = document.documentElement
    
    // Remove existing font size classes
    root.classList.remove("font-size-small", "font-size-medium", "font-size-large")
    
    // Add new font size class
    root.classList.add(`font-size-${fontSize}`)
    
    // Also set CSS custom properties for more granular control
    const fontSizeMap = {
      small: "14px",
      medium: "16px", 
      large: "18px"
    }
    
    root.style.setProperty("--base-font-size", fontSizeMap[fontSize])
  }

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/user/settings")
      if (response.ok) {
        const { settings } = await response.json()
        if (settings.preferences) {
          const loadedPrefs = {
            theme: settings.preferences.theme || "light",
            language: settings.preferences.language || "en",
            font_size: settings.preferences.font_size || "medium",
            auto_save: settings.preferences.auto_save ?? true,
            spell_check: settings.preferences.spell_check ?? true,
            compact_mode: settings.preferences.compact_mode ?? false,
          }
          setPreferences(loadedPrefs)
          
          // Set theme immediately
          if (mounted) {
            setTheme(loadedPrefs.theme)
            applyFontSize(loadedPrefs.font_size)
          }
        }
      } else {
        toast.error("Failed to load appearance settings")
      }
    } catch (error) {
      console.error("Error loading preferences:", error)
      toast.error("Failed to load appearance settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = <K extends keyof AppearancePreferences>(
    key: K,
    value: AppearancePreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
    
    // Apply theme change immediately
    if (key === "theme" && mounted) {
      setTheme(value as string)
    }
    
    // Apply font size change immediately
    if (key === "font_size" && mounted) {
      applyFontSize(value as "small" | "medium" | "large")
    }
  }

  const savePreferences = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: preferences
        }),
      })

      if (response.ok) {
        setHasChanges(false)
        toast.success("Appearance settings saved successfully!")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast.error("Failed to save appearance settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading appearance settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading appearance settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const themeOptions = [
    {
      value: "light" as const,
      label: "Light",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "Dark",
      icon: Moon,
    },
    {
      value: "system" as const,
      label: "System",
      icon: Monitor,
    },
  ]

  const languages = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "it", label: "Italiano", flag: "🇮🇹" },
    { value: "pt", label: "Português", flag: "🇵🇹" },
  ]

  const fontSizes = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium"},
    { value: "large", label: "Large" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme & Display
          </CardTitle>
          <CardDescription>
            Customize how WordWise AI looks and feels for your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Theme</Label>
            </div>
            <RadioGroup 
              value={preferences.theme} 
              onValueChange={(value: "light" | "dark" | "system") => 
                handlePreferenceChange("theme", value)
              } 
              className="grid grid-cols-3 gap-4"
            >
              {themeOptions.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value} 
                    className="sr-only" 
                  />
                  <Label 
                    htmlFor={option.value} 
                    className={`
                      flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                      ${preferences.theme === option.value 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-muted hover:border-border hover:bg-muted/50'
                      }
                    `}
                  >
                    <option.icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="font-size" className="text-base font-medium">Font Size</Label>
            </div>
            <Select 
              value={preferences.font_size} 
              onValueChange={(value: "small" | "medium" | "large") => 
                handlePreferenceChange("font_size", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    <div className="flex flex-col">
                      <span>{size.label}</span>
                      <span className="text-xs text-muted-foreground">{size.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Font Size Preview */}
            
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a more compact interface
              </p>
            </div>
            <Switch
              checked={preferences.compact_mode}
              onCheckedChange={(checked) => handlePreferenceChange("compact_mode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Set your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="language" className="text-base font-medium">Interface Language (Coming Soon)</Label>
            <Select value="en" disabled>
              <SelectTrigger className="opacity-60">
                <SelectValue placeholder="English 🇺🇸" />
              </SelectTrigger>
            </Select>
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
              <strong>Coming Soon:</strong> Multi-language support is in development. The interface will be available in multiple languages in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editor Preferences</CardTitle>
          <CardDescription>
            Customize your content editing experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Auto-save</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your work as you type
              </p>
            </div>
            <Switch
              checked={preferences.auto_save}
              onCheckedChange={(checked) => handlePreferenceChange("auto_save", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Spell Check</Label>
              <p className="text-sm text-muted-foreground">
                Highlight spelling errors while you type
              </p>
            </div>
            <Switch
              checked={preferences.spell_check}
              onCheckedChange={(checked) => handlePreferenceChange("spell_check", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                  You have unsaved changes
                </p>
              </div>
              <Button onClick={savePreferences} disabled={isSaving}>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
