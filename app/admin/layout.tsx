import { Metadata } from "next"
import AdminNavigation from "./components/AdminNavigation"
import { getUserDetails } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin Dashboard - Helios Recruit",
  description: "Administrator dashboard for Helios Recruit",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userDetails = await getUserDetails()

  if (!userDetails || userDetails.role !== "admin") {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminNavigation />
      <main className="flex-1 ml-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
} 