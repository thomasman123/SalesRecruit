"use client"

import { useState, useEffect } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea as SA } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"
import { useToast } from "@/components/ui/use-toast"

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
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(true)

  // Filter states
  const [filters, setFilters] = useState({
    industries: [] as string[],
    priceRanges: [] as string[],
    leadSources: [] as string[],
    commissionStructures: [] as string[],
    teamSizes: [] as string[],
    remoteCompatible: false,
  })

  const { toast } = useToast();

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

  const handleStarToggle = (id: number) => {
    setOpportunities((prev) => prev.map((opp) => (opp.id === id ? { ...opp, starred: !opp.starred } : opp)))
  }

  const handleApply = async (opportunity: Opportunity) => {
    const supabase = getSupabaseClient();
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({ title: "Not logged in", description: "Please log in to apply.", variant: "destructive" });
        return;
      }

      // Ensure user exists in public.users (handles existing accounts created before trigger)
      const { error: upsertError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.email!.split("@")[0],
        role: user.user_metadata?.role ?? "sales-professional",
      });
      if (upsertError) {
        console.error("Error ensuring user exists:", upsertError);
        toast({ title: "User setup failed", description: "Could not set up user profile.", variant: "destructive" });
        return;
      }

      // Check if already applied
      const { data: existing, error: checkError } = await supabase
        .from("applicants")
        .select("id")
        .eq("job_id", opportunity.id)
        .eq("email", user.email ?? "")
        .maybeSingle();
      if (checkError) throw checkError;
      if (existing) {
        toast({ title: "Already applied", description: "You have already applied for this job.", variant: "destructive" });
        return;
      }
      // Prepare applicant data from user metadata
      const meta = user.user_metadata || {};
      const insertData: {
        name: string;
        email: string;
        location: string;
        avatar_url: string | null;
        experience: string;
        highest_ticket: string;
        sales_style: string;
        tools: string;
        video_url: string | null;
        job_id: number;
        status: string;
        starred: boolean;
        user_id: string;
      } = {
        name: (meta.full_name as string) || user.email || "",
        email: user.email || "",
        location: (meta.location as string) || "",
        avatar_url: (meta.avatar_url as string) || null,
        experience: (meta.exactRole as string) || (meta.experience as string) || "",
        highest_ticket: (meta.highestTicket as string) || "",
        sales_style: (meta.salesStyle as string) || (meta.salesProcess as string) || "",
        tools: (meta.crmExperience as string) || (meta.tools as string) || "",
        video_url: (meta.videoUrl as string) || null,
        job_id: opportunity.id,
        status: "new",
        starred: false,
        user_id: user.id,
      };
      const { error: insertError } = await supabase.from("applicants").insert(insertData);
      if (insertError) throw insertError;
      toast({ title: "Application submitted!", description: `You have applied to ${opportunity.companyName}.` });
      // Optionally update UI (e.g., set status to pending)
      setOpportunities((prev) => prev.map((opp) => opp.id === opportunity.id ? { ...opp, status: "pending" } : opp));
    } catch (err: any) {
      toast({ title: "Application failed", description: err.message || "Could not apply.", variant: "destructive" });
    }
  };

  const filterOptions = {
    industries: ["Coaching", "Agency", "SaaS", "Fitness", "E-commerce", "Real Estate"],
    priceRanges: ["$1-3K", "$3-10K", "$10K+"],
    leadSources: ["Inbound", "Outbound", "Hybrid"],
    commissionStructures: ["100% Commission", "Base + Commission", "Draw Against Commission"],
    teamSizes: ["Solo closer", "Setters in place", "Full team"],
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "interviewing":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />
      case "interviewing":
        return <Phone className="w-3 h-3" />
      case "accepted":
        return <CheckCircle className="w-3 h-3" />
      case "rejected":
        return <X className="w-3 h-3" />
      default:
        return null
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 max-w-7xl mx-auto px-6 overflow-hidden">
      {/* Left Panel - Filters */}
      <FadeIn delay={100}>
        <div className={cn("transition-all duration-300 flex-shrink-0", showFilters ? "w-80" : "w-0 overflow-hidden")}>
          <div className="h-full flex flex-col bg-dark-800/50 border border-dark-600 rounded-lg">
            <div className="flex items-center justify-between p-6 border-b border-dark-600 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Filter className="w-5 h-5 mr-3 text-purple-400" />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="md:hidden text-gray-400 hover:text-white transition-colors p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-8">
                {/* Industries */}
                <div>
                  <Label className="text-white mb-4 block text-base font-semibold">Industries</Label>
                  <div className="space-y-3">
                    {filterOptions.industries.map((industry) => (
                      <div key={industry} className="flex items-center space-x-3">
                        <Checkbox
                          id={industry}
                          checked={filters.industries.includes(industry)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                industries: [...prev.industries, industry],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                industries: prev.industries.filter((i) => i !== industry),
                              }))
                            }
                          }}
                          className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <Label
                          htmlFor={industry}
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1"
                        >
                          {industry}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-dark-600" />

                {/* Price Range */}
                <div>
                  <Label className="text-white mb-4 block text-base font-semibold">Offer Price Range</Label>
                  <div className="space-y-3">
                    {filterOptions.priceRanges.map((range) => (
                      <div key={range} className="flex items-center space-x-3">
                        <Checkbox
                          id={range}
                          checked={filters.priceRanges.includes(range)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                priceRanges: [...prev.priceRanges, range],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                priceRanges: prev.priceRanges.filter((r) => r !== range),
                              }))
                            }
                          }}
                          className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <Label
                          htmlFor={range}
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1"
                        >
                          {range}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-dark-600" />

                {/* Lead Source */}
                <div>
                  <Label className="text-white mb-4 block text-base font-semibold">Lead Source</Label>
                  <div className="space-y-3">
                    {filterOptions.leadSources.map((source) => (
                      <div key={source} className="flex items-center space-x-3">
                        <Checkbox
                          id={source}
                          checked={filters.leadSources.includes(source)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                leadSources: [...prev.leadSources, source],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                leadSources: prev.leadSources.filter((s) => s !== source),
                              }))
                            }
                          }}
                          className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <Label
                          htmlFor={source}
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1"
                        >
                          {source}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-dark-600" />

                {/* Commission Structure */}
                <div>
                  <Label className="text-white mb-4 block text-base font-semibold">Commission Structure</Label>
                  <div className="space-y-3">
                    {filterOptions.commissionStructures.map((structure) => (
                      <div key={structure} className="flex items-center space-x-3">
                        <Checkbox
                          id={structure}
                          checked={filters.commissionStructures.includes(structure)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                commissionStructures: [...prev.commissionStructures, structure],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                commissionStructures: prev.commissionStructures.filter((s) => s !== structure),
                              }))
                            }
                          }}
                          className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <Label
                          htmlFor={structure}
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1 leading-relaxed"
                        >
                          {structure}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-dark-600" />

                {/* Team Size */}
                <div>
                  <Label className="text-white mb-4 block text-base font-semibold">Team Size / Sales Infra</Label>
                  <div className="space-y-3">
                    {filterOptions.teamSizes.map((size) => (
                      <div key={size} className="flex items-center space-x-3">
                        <Checkbox
                          id={size}
                          checked={filters.teamSizes.includes(size)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters((prev) => ({
                                ...prev,
                                teamSizes: [...prev.teamSizes, size],
                              }))
                            } else {
                              setFilters((prev) => ({
                                ...prev,
                                teamSizes: prev.teamSizes.filter((s) => s !== size),
                              }))
                            }
                          }}
                          className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                        />
                        <Label
                          htmlFor={size}
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1"
                        >
                          {size}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-dark-600" />

                {/* Remote Compatible */}
                <div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remote"
                      checked={filters.remoteCompatible}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          remoteCompatible: checked as boolean,
                        }))
                      }}
                      className="border-dark-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                    />
                    <Label
                      htmlFor="remote"
                      className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors flex-1"
                    >
                      Remote Time Zone Compatible
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Filters (sticky bottom) */}
            <div className="p-6 border-t border-dark-600 flex-shrink-0">
              <AnimatedButton
                variant="ghost"
                className="w-full text-sm hover:bg-dark-700"
                onClick={() => {
                  setFilters({
                    industries: [],
                    priceRanges: [],
                    leadSources: [],
                    commissionStructures: [],
                    teamSizes: [],
                    remoteCompatible: false,
                  })
                }}
              >
                Clear All Filters
              </AnimatedButton>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Middle Panel - Opportunity Cards */}
      <FadeIn delay={200}>
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search and Sort Bar */}
          <div className="mb-6 space-y-4 flex-shrink-0">
            <div className="flex gap-4">
              {!showFilters && (
                <AnimatedButton variant="outline" size="sm" onClick={() => setShowFilters(true)} className="md:hidden">
                  <Filter className="w-4 h-4" />
                </AnimatedButton>
              )}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <AnimatedInput
                  type="text"
                  placeholder="Search opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                  variant="glow"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 h-12 border-dark-600 bg-dark-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-700 border-dark-600">
                  <SelectItem value="newest" className="text-white hover:bg-dark-600">
                    Newest
                  </SelectItem>
                  <SelectItem value="lucrative" className="text-white hover:bg-dark-600">
                    Most Lucrative
                  </SelectItem>
                  <SelectItem value="best-fit" className="text-white hover:bg-dark-600">
                    Best Fit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {(filters.industries.length > 0 ||
              filters.priceRanges.length > 0 ||
              filters.leadSources.length > 0 ||
              filters.commissionStructures.length > 0 ||
              filters.teamSizes.length > 0 ||
              filters.remoteCompatible) && (
              <div className="flex flex-wrap gap-2">
                {[
                  ...filters.industries,
                  ...filters.priceRanges,
                  ...filters.leadSources,
                  ...filters.commissionStructures,
                  ...filters.teamSizes,
                ].map((filter) => (
                  <Badge
                    key={filter}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1"
                  >
                    {filter}
                  </Badge>
                ))}
                {filters.remoteCompatible && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
                    Remote Compatible
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Opportunities List */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-6 pr-4 md:grid-cols-1 xl:grid-cols-2 pb-6">
              {opportunities.map((opportunity) => (
                <AnimatedCard
                  key={opportunity.id}
                  variant="interactive"
                  className={cn(
                    "p-6 cursor-pointer bg-dark-800/50 border-dark-600 hover:border-purple-500/50 transition-all duration-300",
                    selectedOpportunity?.id === opportunity.id && "border-purple-500/50 bg-dark-700/50",
                  )}
                  onClick={() => setSelectedOpportunity(opportunity)}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4 flex-1">
                      <img
                        src={opportunity.logo || "/placeholder.svg"}
                        alt={opportunity.companyName}
                        className="w-14 h-14 rounded-lg object-cover border border-dark-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white truncate">{opportunity.companyName}</h3>
                          {opportunity.new && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-2 py-1">NEW</Badge>
                          )}
                          {opportunity.status && (
                            <Badge
                              className={cn("text-xs flex items-center gap-1 px-2 py-1", getStatusColor(opportunity.status))}
                            >
                              {getStatusIcon(opportunity.status)}
                              {opportunity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-purple-400 font-medium text-base mb-1">{opportunity.offerType}</p>
                        <p className="text-gray-400 text-sm">{opportunity.industry}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStarToggle(opportunity.id)
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-300 flex-shrink-0",
                        opportunity.starred
                          ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                          : "text-gray-400 hover:text-yellow-400 hover:bg-dark-700",
                      )}
                    >
                      <Star className={cn("w-5 h-5", opportunity.starred && "fill-current")} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Briefcase className="w-4 h-4 mr-3 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{opportunity.salesRole}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <DollarSign className="w-4 h-4 mr-3 text-purple-400 flex-shrink-0" />
                      <span className="font-mono truncate">{opportunity.commissionPotential}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Zap className="w-4 h-4 mr-3 text-purple-400 flex-shrink-0" />
                      <span className="truncate">Lead Flow: {opportunity.leadFlowProvided ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin className="w-4 h-4 mr-3 text-purple-400 flex-shrink-0" />
                      <span className="truncate">{opportunity.remoteCompatible ? "Remote" : "On-site"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {opportunity.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-dark-700 text-gray-300 border-dark-600 text-xs px-2 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {opportunity.tags.length > 3 && (
                      <Badge
                        variant="secondary"
                        className="bg-dark-700 text-gray-400 border-dark-600 text-xs px-2 py-1"
                      >
                        +{opportunity.tags.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <AnimatedButton
                    variant="purple"
                    size="sm"
                    className="w-full h-10"
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    View Role Details
                  </AnimatedButton>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Right Panel - Role Details */}
      <FadeIn delay={300}>
        <div className={cn("transition-all duration-300 flex-shrink-0", selectedOpportunity ? "w-96" : "w-0 overflow-hidden")}>
          {selectedOpportunity && (
            <div className="h-full overflow-hidden flex flex-col bg-dark-800/50 border border-dark-600 rounded-lg">
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <img
                        src={selectedOpportunity.logo || "/placeholder.svg"}
                        alt={selectedOpportunity.companyName}
                        className="w-16 h-16 rounded-lg object-cover border border-dark-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-white mb-1 truncate">{selectedOpportunity.companyName}</h2>
                        <p className="text-purple-400 text-base mb-1 truncate">{selectedOpportunity.offerType}</p>
                        <p className="text-gray-400 text-sm">{selectedOpportunity.industry}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOpportunity(null)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Video Intro */}
                  {selectedOpportunity.videoIntro && (
                    <div className="mb-8">
                      <div className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-dark-600 transition-colors border border-dark-600">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-500/30 transition-colors">
                            <Play className="w-6 h-6 text-purple-400" />
                          </div>
                          <p className="text-sm text-gray-400">Watch intro from founder</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Company Overview */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-3 text-purple-400" />
                      Company Overview
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.companyOverview}</p>
                  </div>

                  {/* What You'll Be Selling */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-3 text-purple-400" />
                      What You'll Be Selling
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.whatYouSell}</p>
                  </div>

                  {/* Sales Process */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-3 text-purple-400" />
                      Sales Process
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.salesProcess}</p>
                  </div>

                  {/* What's Provided */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-3 text-purple-400" />
                      What's Provided
                    </h3>
                    <ul className="space-y-3">
                      {selectedOpportunity.whatsProvided?.map((item, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 mr-3 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Who This Role Is NOT For */}
                  {selectedOpportunity.notFor && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-3 text-red-400" />
                        Who This Role Is NOT For
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        {selectedOpportunity.notFor}
                      </p>
                    </div>
                  )}

                  {/* Commission Breakdown */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-3 text-purple-400" />
                      Commission Breakdown
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed font-mono bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      {selectedOpportunity.commissionBreakdown}
                    </p>
                  </div>

                  {/* Expected Ramp Time */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-3 text-purple-400" />
                      Expected Ramp Time
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.rampTime}</p>
                  </div>

                  {/* Working Hours */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-3 text-purple-400" />
                      Working Hours
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.workingHours}</p>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="p-6 border-t border-dark-600 flex-shrink-0">
                <AnimatedButton
                  variant="purple"
                  className="w-full h-12 text-base font-semibold"
                  onClick={() => handleApply(selectedOpportunity)}
                  disabled={selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected"}
                >
                  {selectedOpportunity.status === "pending"
                    ? "Application Pending"
                    : selectedOpportunity.status === "interviewing"
                      ? "Continue Interview Process"
                      : selectedOpportunity.status === "accepted"
                        ? "Already Accepted"
                        : selectedOpportunity.status === "rejected"
                          ? "Application Rejected"
                          : "Apply Now"}
                </AnimatedButton>
                {!selectedOpportunity.status && (
                  <p className="text-xs text-gray-400 text-center mt-3">Quick apply with your Helios Recruit profile</p>
                )}
              </div>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
