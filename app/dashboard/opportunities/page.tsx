"use client"

import { useState } from "react"
import { AnimatedCard } from "@/components/ui/animated-card"
import { AnimatedButton } from "@/components/ui/animated-button"
import { AnimatedInput } from "@/components/ui/animated-input"
import { FadeIn } from "@/components/ui/fade-in"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
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

// Mock data for opportunities
const mockOpportunities = [
  {
    id: 1,
    companyName: "TechGrowth Solutions",
    logo: "/placeholder.svg?height=48&width=48&query=tech company logo",
    offerType: "$5K Executive Coaching Program",
    leadFlowProvided: true,
    salesRole: "Closer",
    callVolume: "15-20",
    commissionPotential: "$8K-$15K/mo",
    tags: ["Inbound", "High-Ticket", "Coaching", "Full Team"],
    industry: "Coaching",
    priceRange: "$3-10K",
    leadSource: "Inbound",
    commissionStructure: "100% Commission",
    teamSize: "Full team",
    remoteCompatible: true,
    status: null,
    starred: false,
    new: true,
    // Detailed info
    companyOverview:
      "TechGrowth Solutions is a leading executive coaching firm specializing in helping tech startup founders scale their companies from $1M to $10M ARR.",
    whatYouSell:
      "You'll be selling our flagship 12-week executive coaching program that includes 1-on-1 sessions, group masterminds, and access to our proprietary scaling framework. Target buyers are tech founders doing $500K-$3M in revenue.",
    salesProcess:
      "One-call close model with warm transfers from our setter team. Average call duration is 45-60 minutes. We use HubSpot CRM with custom pipelines. Full script provided but we encourage personalization.",
    whatsProvided: [
      "Pre-qualified warm leads (8-10 daily)",
      "Full CRM access with automation",
      "Proven sales script and rebuttals",
      "Weekly sales training calls",
      "Dedicated sales manager support",
      "Commission tracking dashboard",
    ],
    notFor:
      "This role is NOT for salespeople who rely heavily on scripts or those uncomfortable with consultative selling to high-level executives.",
    commissionBreakdown:
      "15% commission on all sales. Average deal size $5K = $750 per sale. Top performers closing 2-3 deals/week.",
    rampTime: "2-3 weeks to first close, 6-8 weeks to full productivity",
    workingHours: "Flexible hours, but most calls happen 10am-6pm EST",
    videoIntro: "https://www.loom.com/share/example123",
  },
  {
    id: 2,
    companyName: "FitPro Academy",
    logo: "/placeholder.svg?height=48&width=48&query=fitness logo",
    offerType: "$3K Online Fitness Certification",
    leadFlowProvided: true,
    salesRole: "Hybrid",
    callVolume: "20-25",
    commissionPotential: "$5K-$10K/mo",
    tags: ["Outbound", "Mid-Ticket", "Fitness", "Setters in place"],
    industry: "Fitness",
    priceRange: "$1-3K",
    leadSource: "Hybrid",
    commissionStructure: "Base + Commission",
    teamSize: "Setters in place",
    remoteCompatible: true,
    status: "pending",
    starred: true,
    new: false,
    companyOverview:
      "FitPro Academy is the premier online certification program for personal trainers looking to build 6-figure online coaching businesses.",
    whatYouSell:
      "Our comprehensive certification program that teaches fitness professionals how to build and scale online coaching businesses. Includes business systems, marketing training, and ongoing mentorship.",
    salesProcess:
      "Two-call close process. Initial discovery call (30 min) followed by strategy session (45 min). Mix of inbound and outbound leads.",
    whatsProvided: [
      "Daily lead flow (mix of warm and cold)",
      "Complete sales training program",
      "Base salary + commission structure",
      "Health benefits after 90 days",
      "Career advancement opportunities",
    ],
    notFor: "Not suitable for those without fitness industry knowledge or passion for health and wellness.",
    commissionBreakdown: "$2K base + 10% commission. Average 3-4 sales/week = $3-4K commission on top of base.",
    rampTime: "3-4 weeks to proficiency",
    workingHours: "9am-5pm PST with some evening calls",
    videoIntro: null,
  },
  {
    id: 3,
    companyName: "SaaS Scale Pro",
    logo: "/placeholder.svg?height=48&width=48&query=saas logo",
    offerType: "$10K SaaS Growth Accelerator",
    leadFlowProvided: false,
    salesRole: "Closer",
    callVolume: "8-12",
    commissionPotential: "$10K-$25K/mo",
    tags: ["Inbound", "High-Ticket", "SaaS", "Solo closer"],
    industry: "SaaS",
    priceRange: "$10K+",
    leadSource: "Inbound",
    commissionStructure: "100% Commission",
    teamSize: "Solo closer",
    remoteCompatible: true,
    status: "interviewing",
    starred: true,
    new: false,
    companyOverview:
      "SaaS Scale Pro helps B2B SaaS companies accelerate growth through proven GTM strategies and hands-on implementation.",
    whatYouSell:
      "90-day intensive program for SaaS founders to implement scalable growth systems, optimize pricing, and build predictable revenue engines.",
    salesProcess:
      "Consultative one-call close with pre-qualified founders. Calls typically run 60-90 minutes with deep discovery and strategic recommendations.",
    whatsProvided: [
      "Highly qualified inbound leads",
      "Comprehensive sales enablement materials",
      "Direct access to founder for deal support",
      "Uncapped commission potential",
    ],
    notFor:
      "Not for transactional sellers or those who can't handle complex, strategic conversations with technical founders.",
    commissionBreakdown: "20% commission on $10K deals = $2K per sale. Top rep doing $50K+/month.",
    rampTime: "4-6 weeks due to technical complexity",
    workingHours: "Flexible, most calls 11am-7pm EST",
    videoIntro: "https://www.loom.com/share/example456",
  },
]

type Opportunity = (typeof mockOpportunities)[0]

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState(mockOpportunities)
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

  const handleStarToggle = (id: number) => {
    setOpportunities((prev) => prev.map((opp) => (opp.id === id ? { ...opp, starred: !opp.starred } : opp)))
  }

  const handleApply = (opportunity: Opportunity) => {
    console.log("Applying to:", opportunity.companyName)
    // Handle application logic
  }

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
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left Panel - Filters */}
      <FadeIn delay={100}>
        <div className={cn("transition-all duration-300", showFilters ? "w-64" : "w-0 overflow-hidden")}>
          <AnimatedCard variant="hover-glow" className="h-full p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <Filter className="w-4 h-4 mr-2 text-purple-400" />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="md:hidden text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Industries */}
              <div>
                <Label className="text-white mb-3 block text-sm font-medium">Industries</Label>
                <div className="space-y-2">
                  {filterOptions.industries.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
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
                        className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor={industry}
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
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
                <Label className="text-white mb-3 block text-sm font-medium">Offer Price Range</Label>
                <div className="space-y-2">
                  {filterOptions.priceRanges.map((range) => (
                    <div key={range} className="flex items-center space-x-2">
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
                        className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor={range}
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
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
                <Label className="text-white mb-3 block text-sm font-medium">Lead Source</Label>
                <div className="space-y-2">
                  {filterOptions.leadSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
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
                        className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor={source}
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
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
                <Label className="text-white mb-3 block text-sm font-medium">Commission Structure</Label>
                <div className="space-y-2">
                  {filterOptions.commissionStructures.map((structure) => (
                    <div key={structure} className="flex items-center space-x-2">
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
                        className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor={structure}
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors text-xs"
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
                <Label className="text-white mb-3 block text-sm font-medium">Team Size / Sales Infra</Label>
                <div className="space-y-2">
                  {filterOptions.teamSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
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
                        className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor={size}
                        className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={filters.remoteCompatible}
                    onCheckedChange={(checked) => {
                      setFilters((prev) => ({
                        ...prev,
                        remoteCompatible: checked as boolean,
                      }))
                    }}
                    className="border-dark-600 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                  />
                  <Label
                    htmlFor="remote"
                    className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                  >
                    Remote Time Zone Compatible
                  </Label>
                </div>
              </div>

              {/* Clear Filters */}
              <AnimatedButton
                variant="ghost"
                className="w-full text-sm"
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
          </AnimatedCard>
        </div>
      </FadeIn>

      {/* Middle Panel - Opportunity Cards */}
      <FadeIn delay={200}>
        <div className="flex-1 flex flex-col">
          {/* Search and Sort Bar */}
          <div className="mb-4 space-y-4">
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
                  className="pl-10"
                  variant="glow"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-dark-600 bg-dark-700 text-white">
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
                    className="bg-purple-500/20 text-purple-400 border-purple-500/30"
                  >
                    {filter}
                  </Badge>
                ))}
                {filters.remoteCompatible && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    Remote Compatible
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Opportunities List */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {opportunities.map((opportunity) => (
                <AnimatedCard
                  key={opportunity.id}
                  variant="interactive"
                  className={cn(
                    "p-6 cursor-pointer",
                    selectedOpportunity?.id === opportunity.id && "border-purple-500/50",
                  )}
                  onClick={() => setSelectedOpportunity(opportunity)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <img
                        src={opportunity.logo || "/placeholder.svg"}
                        alt={opportunity.companyName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-white">{opportunity.companyName}</h3>
                          {opportunity.new && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">NEW</Badge>
                          )}
                          {opportunity.status && (
                            <Badge
                              className={cn("text-xs flex items-center gap-1", getStatusColor(opportunity.status))}
                            >
                              {getStatusIcon(opportunity.status)}
                              {opportunity.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-purple-400 font-medium">{opportunity.offerType}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStarToggle(opportunity.id)
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        opportunity.starred
                          ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
                          : "text-gray-400 hover:text-yellow-400 hover:bg-dark-700",
                      )}
                    >
                      <Star className={cn("w-5 h-5", opportunity.starred && "fill-current")} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-400">
                      <Briefcase className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{opportunity.salesRole}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Phone className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{opportunity.callVolume} calls/week</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                      <span className="font-mono">{opportunity.commissionPotential}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Zap className="w-4 h-4 mr-2 text-purple-400" />
                      <span>Lead Flow: {opportunity.leadFlowProvided ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Users className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{opportunity.teamSize}</span>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{opportunity.remoteCompatible ? "Remote" : "On-site"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {opportunity.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-dark-700 text-gray-300 border-dark-600 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <AnimatedButton
                    variant="purple"
                    size="sm"
                    className="w-full"
                    animation="scale"
                    icon={<ChevronRight className="w-4 h-4" />}
                  >
                    View Role
                  </AnimatedButton>
                </AnimatedCard>
              ))}
            </div>
          </ScrollArea>
        </div>
      </FadeIn>

      {/* Right Panel - Role Details */}
      <FadeIn delay={300}>
        <div className={cn("transition-all duration-300", selectedOpportunity ? "w-96" : "w-0 overflow-hidden")}>
          {selectedOpportunity && (
            <AnimatedCard variant="hover-glow" className="h-full overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start space-x-4">
                      <img
                        src={selectedOpportunity.logo || "/placeholder.svg"}
                        alt={selectedOpportunity.companyName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedOpportunity.companyName}</h2>
                        <p className="text-purple-400">{selectedOpportunity.offerType}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedOpportunity(null)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Video Intro */}
                  {selectedOpportunity.videoIntro && (
                    <div className="mb-6">
                      <div className="aspect-video bg-dark-700 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-dark-600 transition-colors">
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-purple-400" />
                      Company Overview
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.companyOverview}</p>
                  </div>

                  {/* What You'll Be Selling */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-purple-400" />
                      What You'll Be Selling
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.whatYouSell}</p>
                  </div>

                  {/* Sales Process */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-purple-400" />
                      Sales Process
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{selectedOpportunity.salesProcess}</p>
                  </div>

                  {/* What's Provided */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-purple-400" />
                      What's Provided
                    </h3>
                    <ul className="space-y-2">
                      {selectedOpportunity.whatsProvided.map((item, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Who This Role Is NOT For */}
                  {selectedOpportunity.notFor && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                        Who This Role Is NOT For
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        {selectedOpportunity.notFor}
                      </p>
                    </div>
                  )}

                  {/* Commission Breakdown */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                      Commission Breakdown
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed font-mono bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      {selectedOpportunity.commissionBreakdown}
                    </p>
                  </div>

                  {/* Expected Ramp Time */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-purple-400" />
                      Expected Ramp Time
                    </h3>
                    <p className="text-gray-300 text-sm">{selectedOpportunity.rampTime}</p>
                  </div>

                  {/* Working Hours */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-purple-400" />
                      Working Hours
                    </h3>
                    <p className="text-gray-300 text-sm">{selectedOpportunity.workingHours}</p>
                  </div>
                </div>
              </ScrollArea>

              {/* Apply Button */}
              <div className="p-6 border-t border-dark-600">
                <AnimatedButton
                  variant="purple"
                  className="w-full"
                  animation="glow"
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
                  <p className="text-xs text-gray-400 text-center mt-2">Quick apply with your SalesRecruit profile</p>
                )}
              </div>
            </AnimatedCard>
          )}
        </div>
      </FadeIn>
    </div>
  )
}
