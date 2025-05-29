"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Building2,
  DollarSign,
  MapPin,
  ChevronRight,
  Briefcase,
  Zap,
  X,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { FadeIn } from "@/components/ui/fade-in"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedIcon } from "@/components/ui/animated-icon"

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
  // -----------------------------
  // State & Data Loading
  // -----------------------------
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selected, setSelected] = useState<Opportunity | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

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
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
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

  // -----------------------------
  // Derived Data
  // -----------------------------
  const filterOptions = {
    industries: ["Coaching", "Agency", "SaaS", "Fitness", "E-commerce", "Real Estate"],
    priceRanges: ["$1-3K", "$3-10K", "$10K+"],
    leadSources: ["Inbound", "Outbound", "Hybrid"],
    commissionStructures: ["100% Commission", "Base + Commission", "Draw Against Commission"],
    teamSizes: ["Solo closer", "Setters in place", "Full team"],
  }

  const filtered = opportunities.filter((o) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery ||
      o.companyName.toLowerCase().includes(q) ||
      o.offerType.toLowerCase().includes(q) ||
      o.industry.toLowerCase().includes(q)

    const matchesIndustry = filters.industries.length === 0 || filters.industries.includes(o.industry)
    const matchesPrice = filters.priceRanges.length === 0 || filters.priceRanges.includes(o.priceRange)
    const matchesLead = filters.leadSources.length === 0 || filters.leadSources.includes(o.leadSource)
    const matchesCommission = filters.commissionStructures.length === 0 || filters.commissionStructures.includes(o.commissionStructure)
    const matchesTeam = filters.teamSizes.length === 0 || filters.teamSizes.includes(o.teamSize)
    const matchesRemote = !filters.remoteCompatible || o.remoteCompatible

    return matchesSearch && matchesIndustry && matchesPrice && matchesLead && matchesCommission && matchesTeam && matchesRemote
  })

  // -----------------------------
  // Render Helpers
  // -----------------------------
  const InfoRow = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  )

  // -----------------------------
  // JSX
  // -----------------------------
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Page Header */}
      <FadeIn delay={0}>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">
            Open <span className="font-mono text-purple-400">Opportunities</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse and apply to roles that match your skills and experience.
          </p>
        </div>
      </FadeIn>

      {/* Search */}
      <FadeIn delay={150}>
        <div className="flex items-center justify-center mb-10 gap-4 max-w-lg mx-auto">
          {/* Filter Button */}
          <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-gray-400 hover:text-white hover:border-purple-500 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="text-sm">Filters</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-400" /> Filter Opportunities
              </h3>
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {/* Industries */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Industries</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.industries.map((ind) => (
                      <label key={ind} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.industries.includes(ind)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              industries: e.target.checked ? [...prev.industries, ind] : prev.industries.filter((i) => i !== ind),
                            }))
                          }}
                        />
                        {ind}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Price Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.priceRanges.map((range) => (
                      <label key={range} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.priceRanges.includes(range)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              priceRanges: e.target.checked ? [...prev.priceRanges, range] : prev.priceRanges.filter((r) => r !== range),
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
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Lead Source</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {filterOptions.leadSources.map((source) => (
                      <label key={source} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.leadSources.includes(source)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              leadSources: e.target.checked ? [...prev.leadSources, source] : prev.leadSources.filter((s) => s !== source),
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
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Commission Structure</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {filterOptions.commissionStructures.map((cs) => (
                      <label key={cs} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.commissionStructures.includes(cs)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              commissionStructures: e.target.checked ? [...prev.commissionStructures, cs] : prev.commissionStructures.filter((c) => c !== cs),
                            }))
                          }}
                        />
                        {cs}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Team Size */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Team Size</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {filterOptions.teamSizes.map((ts) => (
                      <label key={ts} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={filters.teamSizes.includes(ts)}
                          onChange={(e) => {
                            setFilters((prev) => ({
                              ...prev,
                              teamSizes: e.target.checked ? [...prev.teamSizes, ts] : prev.teamSizes.filter((t) => t !== ts),
                            }))
                          }}
                        />
                        {ts}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Remote Compatible */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={filters.remoteCompatible}
                      onChange={(e) => setFilters((prev) => ({ ...prev, remoteCompatible: e.target.checked }))}
                    />
                    Remote Compatible
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                  onClick={() => setFilters({ industries: [], priceRanges: [], leadSources: [], commissionStructures: [], teamSizes: [], remoteCompatible: false })}
                >
                  Clear All
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
                  onClick={() => setFilterDialogOpen(false)}
                >
                  Apply Filters
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-dark-700 border border-dark-600 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-0 outline-none transition-colors"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </FadeIn>

      {/* Opportunities Grid */}
      <FadeIn delay={250}>
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No opportunities found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((op, idx) => (
              <FadeIn delay={idx * 100} key={op.id}>
                <AnimatedCard
                  variant="interactive"
                  className="p-6 group"
                  onClick={() => {
                    setSelected(op)
                    setDialogOpen(true)
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon Box */}
                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 transition-all duration-300">
                      <AnimatedIcon variant="scale" size="md" color="purple">
                        <Briefcase className="h-6 w-6" />
                      </AnimatedIcon>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold mb-1 text-white group-hover:text-purple-400 transition-colors duration-300 truncate">
                        {op.offerType}
                      </h4>
                      <p className="text-gray-400 text-sm mb-3 truncate">
                        {op.companyName} <span className="mx-1">·</span> {op.industry}
                      </p>
                      <div className="space-y-2">
                        <InfoRow icon={<DollarSign className="w-4 h-4 text-purple-400" />} text={op.commissionPotential || "Varies"} />
                        <InfoRow icon={<Briefcase className="w-4 h-4 text-purple-400" />} text={op.salesRole} />
                        <InfoRow icon={<MapPin className="w-4 h-4 text-purple-400" />} text={op.remoteCompatible ? "Remote" : "On-site"} />
                        <InfoRow icon={<Zap className="w-4 h-4 text-purple-400" />} text={`Lead Flow: ${op.leadFlowProvided ? "Yes" : "No"}`} />
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </FadeIn>
            ))}
          </div>
        )}
      </FadeIn>

      {/* Details Dialog */}
      {selected && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" /> {selected.offerType}
            </h2>
            <p className="text-gray-400 mb-4">
              {selected.companyName} <span className="mx-1">·</span> {selected.industry}
            </p>
            <div className="space-y-3 text-sm">
              <InfoRow icon={<DollarSign className="w-4 h-4 text-purple-400" />} text={`Pay Range: ${selected.commissionPotential}`} />
              <InfoRow icon={<Briefcase className="w-4 h-4 text-purple-400" />} text={`Role: ${selected.salesRole}`} />
              <InfoRow icon={<MapPin className="w-4 h-4 text-purple-400" />} text={`Location: ${selected.remoteCompatible ? "Remote" : "On-site"}`} />
              <InfoRow icon={<Zap className="w-4 h-4 text-purple-400" />} text={`Lead Flow Provided: ${selected.leadFlowProvided ? "Yes" : "No"}`} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
