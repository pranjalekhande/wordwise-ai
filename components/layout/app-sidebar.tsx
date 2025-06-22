"use client"

import { FileText, Home, Settings, LogOut, PenTool } from "lucide-react"
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
import { useUser, SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    title: "InstaCarousels",
    url: "/",
    icon: FileText,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: PenTool,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { user } = useUser()

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4 lg:p-6 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <span className="text-lg lg:text-xl font-bold">I</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg lg:text-xl font-bold text-foreground truncate">WordWise AI</h2>
            <p className="text-xs lg:text-sm text-muted-foreground font-medium truncate">Instagram Carousel Creator</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3 lg:p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="group flex items-center gap-3 px-3 py-3 lg:px-4 lg:py-4 rounded-lg hover:bg-accent/50 transition-all duration-200">
                      <item.icon className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      <span className="text-sm lg:text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 lg:p-4 border-t border-border/40">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
          <Avatar className="h-9 w-9 lg:h-10 lg:w-10 ring-2 ring-background shadow-md flex-shrink-0">
            <AvatarImage src={user?.imageUrl || "/placeholder.svg"} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm lg:text-base">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm lg:text-base font-semibold text-foreground truncate">{user?.fullName || "User"}</p>
            <p className="text-xs lg:text-sm text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
          </div>
          <SignOutButton>
            <Button variant="ghost" size="sm" className="hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </SignOutButton>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
