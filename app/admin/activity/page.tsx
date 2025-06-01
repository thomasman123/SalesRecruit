"use client"

import { useEffect, useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, RefreshCw, Download } from "lucide-react"
import { format } from "date-fns"

interface ActivityLog {
  id: number
  user_id: string
  user_role: string
  user_email: string
  action_type: string
  entity_type: string
  entity_id: string | null
  metadata: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [entityFilter, setEntityFilter] = useState("all")
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchLogs()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-logs')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          const newLog = payload.new as ActivityLog
          setLogs(prev => [newLog, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, roleFilter, actionFilter, entityFilter])

  const fetchLogs = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (!error && data) {
      setLogs(data)
    }
    
    setLoading(false)
  }

  const filterLogs = () => {
    let filtered = [...logs]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.metadata?.title && log.metadata.title.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(log => log.user_role === roleFilter)
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action_type === actionFilter)
    }

    // Entity filter
    if (entityFilter !== "all") {
      filtered = filtered.filter(log => log.entity_type === entityFilter)
    }

    setFilteredLogs(filtered)
  }

  const formatActionType = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-green-500",
      updated: "bg-blue-500",
      deleted: "bg-red-500",
      applied: "bg-purple-500",
      sent_message: "bg-indigo-500",
      scheduled_interview: "bg-orange-500",
      status_changed: "bg-yellow-500",
      logged_in: "bg-cyan-500",
      logged_out: "bg-gray-500"
    }
    return colors[action] || "bg-gray-500"
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.user_email,
        log.user_role,
        log.action_type,
        log.entity_type,
        log.entity_id || '',
        JSON.stringify(log.metadata || {}),
        log.ip_address || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  // Get unique values for filters
  const uniqueActions = [...new Set(logs.map(log => log.action_type))]
  const uniqueEntities = [...new Set(logs.map(log => log.entity_type))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Monitor all user actions in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchLogs}
            variant="outline"
            size="sm"
            className="border-gray-700 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportLogs}
            variant="outline"
            size="sm"
            className="border-gray-700 hover:bg-gray-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by email, action, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="recruiter">Recruiter</SelectItem>
              <SelectItem value="sales-professional">Sales Professional</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {formatActionType(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Entities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {uniqueEntities.map(entity => (
                <SelectItem key={entity} value={entity}>
                  {entity.charAt(0).toUpperCase() + entity.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card className="bg-gray-900 border-gray-800">
        <div className="p-6">
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading activity logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No activity logs found</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getActionColor(log.action_type)}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-white">{log.user_email}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.user_role}
                          </Badge>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-300">{formatActionType(log.action_type)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-300">{log.entity_type}</span>
                        </div>
                        
                        {log.metadata && (
                          <div className="mt-1 text-sm text-gray-400">
                            {log.metadata.title && (
                              <span>"{log.metadata.title}"</span>
                            )}
                            {log.metadata.name && (
                              <span>{log.metadata.name}</span>
                            )}
                            {log.metadata.old_status && log.metadata.new_status && (
                              <span>
                                Status: {log.metadata.old_status} → {log.metadata.new_status}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {log.ip_address && (
                          <div className="mt-1 text-xs text-gray-500">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right text-sm text-gray-500 flex-shrink-0">
                        {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  )
} 