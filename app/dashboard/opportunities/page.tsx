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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    industries: [] as string[],
    priceRanges: [] as string[],
    leadSources: [] as string[],
    commissionStructures: [] as string[],
    teamSizes: [] as string[],
    remoteCompatible: false,
  })

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
    const matchesLeadSource = filters.leadSources.length === 0 || 
      filters.leadSources.includes(opportunity.leadSource)
    const matchesCommissionStructure = filters.commissionStructures.length === 0 || 
      filters.commissionStructures.includes(opportunity.commissionStructure)
    const matchesTeamSize = filters.teamSizes.length === 0 || 
      filters.teamSizes.includes(opportunity.teamSize)
    const matchesRemote = !filters.remoteCompatible || opportunity.remoteCompatible
    return matchesSearch && matchesIndustry && matchesPriceRange && matchesLeadSource && matchesCommissionStructure && matchesTeamSize && matchesRemote
  })

  // --- UI ---
  const filterOptions = {
    industries: ["Coaching", "Agency", "SaaS", "Fitness", "E-commerce", "Real Estate"],
    priceRanges: ["$1-3K", "$3-10K", "$10K+"],
    leadSources: ["Inbound", "Outbound", "Hybrid"],
    commissionStructures: ["100% Commission", "Base + Commission", "Draw Against Commission"],
    teamSizes: ["Solo closer", "Setters in place", "Full team"],
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-screen-2xl mx-auto px-6 flex gap-6 overflow-hidden">
      {/* Filters Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-black/70 rounded-xl p-6 flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-purple-400" /> Filters
          </h2>
          {/* Industries */}
          <div>
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
          {/* Price Range */}
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
          {/* Lead Source */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Lead Source</h3>
            <div className="flex flex-col gap-2">
              {filterOptions.leadSources.map((source) => (
                <label key={source} className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={filters.leadSources.includes(source)}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        leadSources: e.target.checked
                          ? [...prev.leadSources, source]
                          : prev.leadSources.filter((s) => s !== source),
                      }))
                    }}
                  />
                  {source}
                </label>
              ))}
            </div>
          </div>
          {/* Commission Structure */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Commission Structure</h3>
            <div className="flex flex-col gap-2">
              {filterOptions.commissionStructures.map((structure) => (
                <label key={structure} className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={filters.commissionStructures.includes(structure)}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        commissionStructures: e.target.checked
                          ? [...prev.commissionStructures, structure]
                          : prev.commissionStructures.filter((s) => s !== structure),
                      }))
                    }}
                  />
                  {structure}
                </label>
              ))}
            </div>
          </div>
          {/* Team Size */}
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 mb-2">Team Size</h3>
            <div className="flex flex-col gap-2">
              {filterOptions.teamSizes.map((size) => (
                <label key={size} className="flex items-center gap-2 text-sm text-zinc-200">
                  <input
                    type="checkbox"
                    checked={filters.teamSizes.includes(size)}
                    onChange={(e) => {
                      setFilters((prev) => ({
                        ...prev,
                        teamSizes: e.target.checked
                          ? [...prev.teamSizes, size]
                          : prev.teamSizes.filter((s) => s !== size),
                      }))
                    }}
                  />
                  {size}
                </label>
              ))}
            </div>
          </div>
          {/* Remote Compatible */}
          <div>
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={filters.remoteCompatible}
                onChange={(e) => {
                  setFilters((prev) => ({
                    ...prev,
                    remoteCompatible: e.target.checked,
                  }))
                }}
              />
              Remote Compatible
            </label>
          </div>
        </div>
        <button
          className="mt-auto text-xs text-zinc-400 border border-zinc-700 rounded-lg px-4 py-2 hover:bg-zinc-800 hover:text-white transition"
          onClick={() => setFilters({ industries: [], priceRanges: [], leadSources: [], commissionStructures: [], teamSizes: [], remoteCompatible: false })}
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
            <div className="flex flex-col gap-6">
              {filteredOpportunities.map((op) => (
                <div
                  key={op.id}
                  className="group relative flex flex-col md:flex-row items-center md:items-stretch gap-0 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl shadow-lg px-8 py-6 transition-all duration-200 ease-in-out hover:scale-[1.025] hover:shadow-2xl hover:border-purple-500 cursor-pointer font-sans"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  onClick={() => { setSelectedOpportunity(op); setDialogOpen(true); }}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-white text-lg md:text-xl leading-tight truncate">{op.offerType}</span>
                      {op.new && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-600/90 text-white font-semibold tracking-wide shadow-sm animate-pulse">NEW</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      <span className="truncate">{op.companyName}</span>
                      <span className="mx-1">·</span>
                      <span className="truncate">{op.industry}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-zinc-200">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        <span>{op.salesRole}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-purple-400" />
                        <span className="font-mono">{op.commissionPotential}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-400" />
                        <span>{op.remoteCompatible ? "Remote" : "On-site"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span>Lead Flow: {op.leadFlowProvided ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ChevronRight className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Modal placeholder for selected opportunity */}
        {selectedOpportunity && dialogOpen && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{selectedOpportunity.offerType}</h2>
                <div className="text-zinc-400 mb-4">{selectedOpportunity.companyName} &middot; {selectedOpportunity.industry}</div>
                <div className="mb-2">Role: <span className="font-medium">{selectedOpportunity.salesRole}</span></div>
                <div className="mb-2">Pay: <span className="font-mono text-purple-400">{selectedOpportunity.commissionPotential}</span></div>
                <div className="mb-2">Location: <span>{selectedOpportunity.remoteCompatible ? "Remote" : "On-site"}</span></div>
                {/* Add more details as needed */}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
