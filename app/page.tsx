"use client"

import { ProjectList } from "@/components/dashboard/project-list"

export default function Dashboard() {
  // Temporarily disabled authentication check
  // const { isSignedIn } = useAuth()

  // if (!isSignedIn) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <DemoProjectList />
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto p-6">
      <ProjectList />
    </div>
  )
}
