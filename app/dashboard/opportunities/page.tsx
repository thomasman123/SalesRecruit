"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Star,
  Building2,
  DollarSign,
  Users,
  Clock,
  MapPin,
  TrendingUp,
  Phone,
  ChevronRight,
  X,
  Play,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Target,
  Zap,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"

type Job = Database["public"]["Tables"]["jobs"]["Row"]

interface Opportunity {
  id: number
  companyName: string
  logo: string
  offerType: string
  leadFlowProvided: boolean
  salesRole: string
  callVolume: string | null
  commissionPotential: string | null
  tags: string[]
  industry: string
  priceRange: string
  leadSource: string
  commissionStructure: string
  teamSize: string
  remoteCompatible: boolean
  status: string | null
  starred: boolean
  new: boolean
  companyOverview: string | null
  whatYouSell: string | null
  salesProcess: string | null
  whatsProvided: string[] | null
  notFor: string | null
  commissionBreakdown: string | null
  rampTime: string | null
  workingHours: string | null
  videoIntro: string | null
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    industries: [] as string[],
    priceRanges: [] as string[],
  })

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function loadJobs() {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false })
      if (error) {
        console.error("Error loading jobs", error)
        return
      }
      const mapped: Opportunity[] = (data as Job[]).map((j) => ({
        id: j.id,
        companyName: (j.company_overview?.split(" ")[0] ?? "Company"),
        logo: j.video_url ?? "/placeholder.svg?height=48&width=48&query=company logo",
        offerType: j.title,
        leadFlowProvided: j.lead_source !== "Outbound",
        salesRole: j.team_size?.includes("Setter") ? "Hybrid" : "Closer",
        callVolume: null,
        commissionPotential: j.price_range,
        tags: [j.industry, j.lead_source, j.commission_structure].filter(Boolean) as string[],
        industry: j.industry,
        priceRange: j.price_range,
        leadSource: j.lead_source,
        commissionStructure: j.commission_structure,
        teamSize: j.team_size,
        remoteCompatible: j.remote_compatible,
        status: null,
        starred: false,
        new: true,
        companyOverview: j.company_overview,
        whatYouSell: j.what_you_sell,
        salesProcess: j.sales_process,
        whatsProvided: j.whats_provided,
        notFor: j.not_for,
        commissionBreakdown: j.commission_breakdown,
        rampTime: j.ramp_time,
        workingHours: j.working_hours,
        videoIntro: j.video_url,
      }))
      setOpportunities(mapped)
    }
    loadJobs()
  }, [])

  // Filter and search opportunities
  const filteredOpportunities = opportunities.filter((opportunity) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || 
      opportunity.companyName.toLowerCase().includes(searchLower) ||
      opportunity.offerType.toLowerCase().includes(searchLower) ||
      opportunity.industry.toLowerCase().includes(searchLower)
    const matchesIndustry = filters.industries.length === 0 || 
      filters.industries.includes(opportunity.industry)
    const matchesPriceRange = filters.priceRanges.length === 0 || 
      filters.priceRanges.includes(opportunity.priceRange)
    return matchesSearch && matchesIndustry && matchesPriceRange
  })

  // --- UI ---
  const filterOptions = {
    industries: ["Coaching", "Agency", "SaaS", "Fitness", "E-commerce", "Real Estate"],
    priceRanges: ["$1-3K", "$3-10K", "$10K+"],
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-6 flex gap-6 overflow-hidden">
      {/* Filters Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-black/70 rounded-xl p-6 flex flex-col gap-8">
        <div>
          <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-400" /> Filters
          </h2>
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Industries</h3>
            <div className="flex flex-col gap-2">
              {filterOptions.industries.map((industry) => (
                <label key={industry} className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={filters.industries.includes(industry)}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        industries: e.target.checked
                          ? [...prev.industries, industry]
                          : prev.industries.filter((i) => i !== industry),
                      }))
                    }}
                  />
                  {industry}
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Price Range</h3>
            <div className="flex flex-col gap-2">
              {filterOptions.priceRanges.map((range) => (
                <label key={range} className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={filters.priceRanges.includes(range)}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        priceRanges: e.target.checked
                          ? [...prev.priceRanges, range]
                          : prev.priceRanges.filter((r) => r !== range),
                      }))
                    }}
                  />
                  {range}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          className="mt-auto text-xs text-zinc-400 border border-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-800 hover:text-white transition"
          onClick={() => setFilters({ industries: [], priceRanges: [] })}
        >
          Clear All Filters
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex items-center gap-4">
          <input
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500"
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Search className="w-12 h-12 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No opportunities found</h3>
              <p className="text-sm text-zinc-400">Try adjusting your search or filters to find more opportunities.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredOpportunities.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 hover:border-purple-500 transition cursor-pointer"
                >
                  <img
                    src={op.logo || "/placeholder.svg"}
                    alt={op.companyName}
                    className="w-12 h-12 rounded-lg object-cover border border-zinc-800 bg-zinc-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white truncate text-base">{op.offerType}</span>
                      {op.new && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-700 text-white font-semibold">NEW</span>
                      )}
                    </div>
                    <div className="text-zinc-400 text-xs truncate">{op.companyName} &middot; {op.industry}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[120px]">
                    <span className="text-sm text-zinc-200 font-medium">{op.salesRole}</span>
                    <span className="text-xs text-purple-400 font-mono">{op.commissionPotential}</span>
                    <span className="text-xs text-zinc-400">{op.remoteCompatible ? "Remote" : "On-site"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
