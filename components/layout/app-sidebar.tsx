"use client"

import { Calendar, FileText, Home, Settings, LayoutTemplateIcon as Template, User, LogOut, PenTool } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth, useUser, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    title: "InstaCarousels",
    url: "/",
    icon: FileText,
    description: "Create & manage carousels"
  },
  {
    title: "Documents",
    url: "/documents",
    icon: PenTool,
    description: "Write & edit content"
  },
  {
    title: "Templates",
    url: "/templates",
    icon: Template,
    description: "Ready-made designs"
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
    description: "Schedule content"
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "App preferences"
  },
]

export function AppSidebar() {
  const { user } = useUser()
  const { isSignedIn } = useAuth()

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <span className="text-lg font-bold">W</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">WordWise AI</h2>
            <p className="text-sm text-muted-foreground font-medium">Instagram Carousel Creator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:translate-x-1">
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/40">
        {isSignedIn ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
              <AvatarImage src={user?.imageUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            <SignOutButton>
              <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </Button>
            </SignOutButton>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Demo User</p>
              <p className="text-xs text-muted-foreground truncate">demo@wordwise.ai</p>
            </div>
          </div>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
