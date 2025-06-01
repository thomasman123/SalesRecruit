"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, UserCheck, Shield, User, Activity } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_activity?: string | null
  total_actions?: number
  actions_today?: number
  actions_this_week?: number
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const supabase = createSupabaseClient()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    const role = searchParams.get('role')
    if (role && ['recruiter', 'sales-professional', 'admin'].includes(role)) {
      setRoleFilter(role)
    }
    fetchUsers()
  }, [searchParams])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    
    // Fetch users and their activity data
    const [
      { data: usersData, error: usersError },
      { data: activityData, error: activityError }
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_user_activity_summary')
        .select('*')
    ])

    if (!usersError && usersData) {
      // Merge activity data with user data
      const mergedData = usersData.map(user => {
        const activity = activityData?.find(a => a.user_id === user.id)
        return {
          ...user,
          last_activity: activity?.last_activity,
          total_actions: activity?.total_actions || 0,
          actions_today: activity?.actions_today || 0,
          actions_this_week: activity?.actions_this_week || 0
        }
      })
      setUsers(mergedData)
    }
    
    setLoading(false)
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "User role updated successfully"
      })
      fetchUsers()
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />
      case 'recruiter':
        return <User className="w-4 h-4" />
      case 'sales-professional':
        return <UserCheck className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-500'
      case 'recruiter':
        return 'text-blue-500'
      case 'sales-professional':
        return 'text-green-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users Management</h1>
        <p className="text-gray-400 mt-1">View and manage all platform users</p>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48 bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="recruiter">Recruiters</SelectItem>
              <SelectItem value="sales-professional">Sales Professionals</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-xl font-semibold text-gray-400">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {user.role.replace('-', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Activity className="w-4 h-4" />
                      <span>{user.total_actions || 0} total actions</span>
                      <span className="text-gray-600">•</span>
                      <span>{user.actions_today || 0} today</span>
                    </div>

                    <div className="text-xs text-gray-500">
                      {user.last_activity ? (
                        <>Last active: {format(new Date(user.last_activity), 'MMM d, HH:mm')}</>
                      ) : (
                        <>Joined: {format(new Date(user.created_at), 'MMM d, yyyy')}</>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => window.location.href = `/admin/activity?user=${user.email}`}
                    >
                      View Activity
                    </DropdownMenuItem>
                    {user.role !== 'admin' && (
                      <DropdownMenuItem 
                        onClick={() => updateUserRole(user.id, 'admin')}
                      >
                        Make Admin
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'recruiter' && (
                      <DropdownMenuItem 
                        onClick={() => updateUserRole(user.id, 'recruiter')}
                      >
                        Make Recruiter
                      </DropdownMenuItem>
                    )}
                    {user.role !== 'sales-professional' && (
                      <DropdownMenuItem 
                        onClick={() => updateUserRole(user.id, 'sales-professional')}
                      >
                        Make Sales Professional
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 