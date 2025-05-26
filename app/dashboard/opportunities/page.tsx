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
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = !searchQuery || 
      opportunity.companyName.toLowerCase().includes(searchLower) ||
      opportunity.offerType.toLowerCase().includes(searchLower) ||
      opportunity.industry.toLowerCase().includes(searchLower) ||
      opportunity.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      opportunity.companyOverview?.toLowerCase().includes(searchLower) ||
      opportunity.whatYouSell?.toLowerCase().includes(searchLower)

    // Industry filter
    const matchesIndustry = filters.industries.length === 0 || 
      filters.industries.includes(opportunity.industry)

    // Price range filter
    const matchesPriceRange = filters.priceRanges.length === 0 || 
      filters.priceRanges.includes(opportunity.priceRange)

    // Lead source filter
    const matchesLeadSource = filters.leadSources.length === 0 || 
      filters.leadSources.includes(opportunity.leadSource)

    // Commission structure filter
    const matchesCommissionStructure = filters.commissionStructures.length === 0 || 
      filters.commissionStructures.includes(opportunity.commissionStructure)

    // Team size filter
    const matchesTeamSize = filters.teamSizes.length === 0 || 
      filters.teamSizes.includes(opportunity.teamSize)

    // Remote compatible filter
    const matchesRemote = !filters.remoteCompatible || opportunity.remoteCompatible

    return matchesSearch && matchesIndustry && matchesPriceRange && 
           matchesLeadSource && matchesCommissionStructure && matchesTeamSize && matchesRemote
  })

  // Sort opportunities
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return b.id - a.id // Assuming higher ID means newer
      case "lucrative":
        // Sort by commission potential (rough estimation)
        const getCommissionValue = (range: string) => {
          if (range.includes("$10K+")) return 10000
          if (range.includes("$3-10K")) return 6500
          if (range.includes("$1-3K")) return 2000
          return 0
        }
        return getCommissionValue(b.commissionPotential || "") - getCommissionValue(a.commissionPotential || "")
      case "best-fit":
        // Prioritize starred, then lead flow provided, then remote compatible
        const getScore = (opp: Opportunity) => {
          let score = 0
          if (opp.starred) score += 100
          if (opp.leadFlowProvided) score += 10
          if (opp.remoteCompatible) score += 5
          return score
        }
        return getScore(b) - getScore(a)
      default:
        return 0
    }
  })

  const handleStarToggle = (id: number) => {
    setOpportunities((prev) => prev.map((opp) => (opp.id === id ? { ...opp, starred: !opp.starred } : opp)))
  }

  const handleApply = async (opportunity: Opportunity) => {
    const supabase = getSupabaseClient();
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Please log in to apply.");
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
        alert("Could not set up user profile.");
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
        alert("You have already applied for this job.");
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
      alert(`You have applied to ${opportunity.companyName}.`);
      // Optionally update UI (e.g., set status to pending)
      setOpportunities((prev) => prev.map((opp) => opp.id === opportunity.id ? { ...opp, status: "pending" } : opp));
    } catch (err: any) {
      alert(err.message || "Could not apply.");
    }
  };

  const filterOptions = {
    industries: ["Coaching", "Agency", "SaaS", "Fitness", "E-commerce", "Real Estate"],
    priceRanges: ["$1-3K", "$3-10K", "$10K+"],
    leadSources: ["Inbound", "Outbound", "Hybrid"],
    commissionStructures: ["100% Commission", "Base + Commission", "Draw Against Commission"],
    teamSizes: ["Solo closer", "Setters in place", "Full team"],
  }

  // Helper function to remove a filter
  const removeFilter = (type: string, value: string) => {
    setFilters(prev => {
      switch (type) {
        case 'industry':
          return { ...prev, industries: prev.industries.filter(i => i !== value) }
        case 'priceRange':
          return { ...prev, priceRanges: prev.priceRanges.filter(r => r !== value) }
        case 'leadSource':
          return { ...prev, leadSources: prev.leadSources.filter(s => s !== value) }
        case 'commissionStructure':
          return { ...prev, commissionStructures: prev.commissionStructures.filter(s => s !== value) }
        case 'teamSize':
          return { ...prev, teamSizes: prev.teamSizes.filter(s => s !== value) }
        default:
          return prev
      }
    })
  }

  return (
    <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', gap: '1.5rem', maxWidth: '112rem', margin: '0 auto', padding: '0 1.5rem', overflow: 'hidden' }}>
      {/* Left Panel - Filters */}
      {showFilters && (
        <div style={{ width: '20rem', flexShrink: 0 }}>
          <div style={{ 
            height: '100%', 
            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: '0.75rem', 
            display: 'flex', 
            flexDirection: 'column',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '1.5rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)'
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '700', 
                color: '#ffffff', 
                display: 'flex', 
                alignItems: 'center',
                margin: 0
              }}>
                <Filter style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                style={{ 
                  color: '#888888', 
                  padding: '0.5rem', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  borderRadius: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#888888';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Industries */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Industries</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filterOptions.industries.map((industry) => (
                      <label key={industry} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.industries.includes(industry)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                industries: [...prev.industries, industry]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                industries: prev.industries.filter(i => i !== industry)
                              }))
                            }
                          }}
                          style={{ 
                            accentColor: '#a855f7',
                            width: '1rem',
                            height: '1rem'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

                {/* Price Range */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Price Range</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filterOptions.priceRanges.map((range) => (
                      <label key={range} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.priceRanges.includes(range)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                priceRanges: [...prev.priceRanges, range]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                priceRanges: prev.priceRanges.filter(r => r !== range)
                              }))
                            }
                          }}
                          style={{ 
                            accentColor: '#a855f7',
                            width: '1rem',
                            height: '1rem'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>{range}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

                {/* Lead Source */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Lead Source</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filterOptions.leadSources.map((source) => (
                      <label key={source} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.leadSources.includes(source)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                leadSources: [...prev.leadSources, source]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                leadSources: prev.leadSources.filter(s => s !== source)
                              }))
                            }
                          }}
                          style={{ 
                            accentColor: '#a855f7',
                            width: '1rem',
                            height: '1rem'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>{source}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

                {/* Commission Structure */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Commission Structure</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filterOptions.commissionStructures.map((structure) => (
                      <label key={structure} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.commissionStructures.includes(structure)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                commissionStructures: [...prev.commissionStructures, structure]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                commissionStructures: prev.commissionStructures.filter(s => s !== structure)
                              }))
                            }
                          }}
                          style={{ 
                            accentColor: '#a855f7',
                            width: '1rem',
                            height: '1rem'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>{structure}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

                {/* Team Size */}
                <div>
                  <h3 style={{ color: '#ffffff', fontWeight: '600', marginBottom: '1rem', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Team Size</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filterOptions.teamSizes.map((size) => (
                      <label key={size} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.teamSizes.includes(size)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                teamSizes: [...prev.teamSizes, size]
                              }))
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                teamSizes: prev.teamSizes.filter(s => s !== size)
                              }))
                            }
                          }}
                          style={{ 
                            accentColor: '#a855f7',
                            width: '1rem',
                            height: '1rem'
                          }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />

                {/* Remote Compatible */}
                <div>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={filters.remoteCompatible}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          remoteCompatible: e.target.checked
                        }))
                      }}
                      style={{ 
                        accentColor: '#a855f7',
                        width: '1rem',
                        height: '1rem'
                      }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>Remote Compatible</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
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
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#cccccc',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#cccccc';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Middle Panel - Opportunities */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Filter style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#888888', width: '1.25rem', height: '1.25rem' }} />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '3rem',
                paddingRight: '1rem',
                paddingTop: '1rem',
                paddingBottom: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(12px)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(12px)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <option value="newest" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Newest</option>
            <option value="lucrative" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Most Lucrative</option>
            <option value="best-fit" style={{ backgroundColor: '#000000', color: '#ffffff' }}>Best Fit</option>
          </select>
        </div>

        {/* Active Filters */}
        {(filters.industries.length > 0 || filters.priceRanges.length > 0 || filters.leadSources.length > 0 || filters.commissionStructures.length > 0 || filters.teamSizes.length > 0 || filters.remoteCompatible) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>
                Active Filters ({filteredOpportunities.length} result{filteredOpportunities.length !== 1 ? 's' : ''})
              </span>
              <button
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
                style={{
                  fontSize: '0.75rem',
                  color: '#888888',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0.25rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#888888';
                }}
              >
                Clear all
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {filters.industries.map((filter) => (
                <button
                  key={`industry-${filter}`}
                  onClick={() => removeFilter('industry', filter)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  {filter}
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              ))}
              {filters.priceRanges.map((filter) => (
                <button
                  key={`price-${filter}`}
                  onClick={() => removeFilter('priceRange', filter)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  {filter}
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              ))}
              {filters.leadSources.map((filter) => (
                <button
                  key={`lead-${filter}`}
                  onClick={() => removeFilter('leadSource', filter)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  {filter}
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              ))}
              {filters.commissionStructures.map((filter) => (
                <button
                  key={`commission-${filter}`}
                  onClick={() => removeFilter('commissionStructure', filter)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  {filter}
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              ))}
              {filters.teamSizes.map((filter) => (
                <button
                  key={`team-${filter}`}
                  onClick={() => removeFilter('teamSize', filter)}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  {filter}
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              ))}
              {filters.remoteCompatible && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, remoteCompatible: false }))}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    backgroundColor: 'rgba(168, 85, 247, 0.15)', 
                    color: '#c084fc', 
                    border: '1px solid rgba(168, 85, 247, 0.3)', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backdropFilter: 'blur(6px) saturate(0.8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.25)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
                  }}
                >
                  Remote Compatible
                  <X style={{ width: '0.75rem', height: '0.75rem' }} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Opportunities List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sortedOpportunities.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              textAlign: 'center',
              padding: '3rem'
            }}>
              <div style={{ 
                width: '4rem', 
                height: '4rem', 
                backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Search style={{ width: '2rem', height: '2rem', color: '#a855f7' }} />
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#ffffff', 
                margin: '0 0 0.5rem 0' 
              }}>
                No opportunities found
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#888888', 
                margin: '0 0 1.5rem 0',
                maxWidth: '24rem'
              }}>
                {searchQuery || filters.industries.length > 0 || filters.priceRanges.length > 0 || filters.leadSources.length > 0 || filters.commissionStructures.length > 0 || filters.teamSizes.length > 0 || filters.remoteCompatible
                  ? "Try adjusting your search or filters to find more opportunities."
                  : "No opportunities are currently available. Check back later for new postings."
                }
              </p>
              {(searchQuery || filters.industries.length > 0 || filters.priceRanges.length > 0 || filters.leadSources.length > 0 || filters.commissionStructures.length > 0 || filters.teamSizes.length > 0 || filters.remoteCompatible) && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilters({
                      industries: [],
                      priceRanges: [],
                      leadSources: [],
                      commissionStructures: [],
                      teamSizes: [],
                      remoteCompatible: false,
                    })
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)';
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', paddingBottom: '1.5rem' }}>
              {sortedOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  onClick={() => setSelectedOpportunity(opportunity)}
                  style={{
                    padding: '2rem',
                    backgroundColor: selectedOpportunity?.id === opportunity.id ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                    border: selectedOpportunity?.id === opportunity.id ? '1px solid rgba(168, 85, 247, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(12px)',
                    boxShadow: selectedOpportunity?.id === opportunity.id ? '0 25px 50px -12px rgba(168, 85, 247, 0.25)' : '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  onMouseOver={(e) => {
                    if (selectedOpportunity?.id !== opportunity.id) {
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.6)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedOpportunity?.id !== opportunity.id) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                      <img
                        src={opportunity.logo || "/placeholder.svg"}
                        alt={opportunity.companyName}
                        style={{ 
                          width: '3.5rem', 
                          height: '3.5rem', 
                          borderRadius: '0.75rem', 
                          objectFit: 'cover', 
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <h3 style={{ 
                            fontSize: '1.25rem', 
                            fontWeight: '700', 
                            color: '#ffffff', 
                            margin: 0, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap' 
                          }}>{opportunity.companyName}</h3>
                          {opportunity.new && (
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              backgroundColor: 'rgba(34, 197, 94, 0.15)', 
                              color: '#4ade80', 
                              border: '1px solid rgba(34, 197, 94, 0.3)', 
                              borderRadius: '0.5rem', 
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              letterSpacing: '0.05em'
                            }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#c084fc', fontWeight: '600', marginBottom: '0.5rem', margin: 0, fontSize: '1rem' }}>{opportunity.offerType}</p>
                        <p style={{ color: '#888888', fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>{opportunity.industry}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStarToggle(opportunity.id)
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: opportunity.starred ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: opportunity.starred ? '#fbbf24' : '#888888',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = opportunity.starred ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.color = opportunity.starred ? '#fbbf24' : '#ffffff';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = opportunity.starred ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = opportunity.starred ? '#fbbf24' : '#888888';
                      }}
                    >
                      <Star style={{ width: '1.25rem', height: '1.25rem', fill: opportunity.starred ? 'currentColor' : 'none' }} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#cccccc', fontWeight: '500' }}>
                      <Briefcase style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      <span>{opportunity.salesRole}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#cccccc', fontWeight: '500' }}>
                      <DollarSign style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{opportunity.commissionPotential}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#cccccc', fontWeight: '500' }}>
                      <Zap style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      <span>Lead Flow: {opportunity.leadFlowProvided ? "Yes" : "No"}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#cccccc', fontWeight: '500' }}>
                      <MapPin style={{ width: '1.125rem', height: '1.125rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      <span>{opportunity.remoteCompatible ? "Remote" : "On-site"}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {opportunity.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={{ 
                        padding: '0.375rem 0.75rem', 
                        backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                        color: '#cccccc', 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '0.5rem', 
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {tag}
                      </span>
                    ))}
                    {opportunity.tags.length > 3 && (
                      <span style={{ 
                        padding: '0.375rem 0.75rem', 
                        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                        color: '#888888', 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        borderRadius: '0.5rem', 
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        +{opportunity.tags.length - 3} more
                      </span>
                    )}
                  </div>

                  <button style={{
                    width: '100%',
                    padding: '0.875rem 1.5rem',
                    background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
                  }}
                  >
                    View Role Details
                    <ChevronRight style={{ width: '1.125rem', height: '1.125rem' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-Page Role Details Modal */}
      {selectedOpportunity && (
        <div 
          style={{ 
            position: 'fixed',
            top: '4rem',
            left: '16rem',
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedOpportunity(null);
            }
          }}
        >
          <div 
            style={{ 
              width: '100%',
              maxWidth: '60rem',
              maxHeight: 'calc(100vh - 10rem)',
              backgroundColor: 'rgba(0, 0, 0, 0.9)', 
              border: '1px solid rgba(255, 255, 255, 0.15)', 
              borderRadius: '0.75rem', 
              display: 'flex', 
              flexDirection: 'column',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ 
              padding: '1.25rem 1.75rem', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(0, 0, 0, 0.2) 100%)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <img
                  src={selectedOpportunity.logo || "/placeholder.svg"}
                  alt={selectedOpportunity.companyName}
                  style={{ 
                    width: '3.5rem', 
                    height: '3.5rem', 
                    borderRadius: '0.75rem', 
                    objectFit: 'cover', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '700', 
                    color: '#ffffff', 
                    margin: 0
                  }}>{selectedOpportunity.companyName}</h2>
                  <p style={{ color: '#c084fc', margin: '0.25rem 0', fontWeight: '600', fontSize: '1rem' }}>{selectedOpportunity.offerType}</p>
                  <p style={{ color: '#888888', fontSize: '0.875rem', margin: 0, fontWeight: '500' }}>{selectedOpportunity.industry}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                style={{ 
                  padding: '0.5rem', 
                  color: '#888888', 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  border: 'none', 
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#888888';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                maxWidth: '100%'
              }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Company Overview */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <Building2 style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      Company Overview
                    </h3>
                    <p style={{ color: '#cccccc', fontSize: '0.875rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{selectedOpportunity.companyOverview}</p>
                  </div>

                  {/* What You'll Be Selling */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <Target style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      What You'll Be Selling
                    </h3>
                    <p style={{ color: '#cccccc', fontSize: '0.875rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{selectedOpportunity.whatYouSell}</p>
                  </div>

                  {/* Sales Process */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <TrendingUp style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      Sales Process
                    </h3>
                    <p style={{ color: '#cccccc', fontSize: '0.875rem', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>{selectedOpportunity.salesProcess}</p>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* What's Provided */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <CheckCircle style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      What's Provided
                    </h3>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedOpportunity.whatsProvided?.map((item, index) => (
                        <li key={index} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', color: '#cccccc', fontWeight: '500' }}>
                          <CheckCircle style={{ width: '1rem', height: '1rem', marginRight: '0.75rem', color: '#4ade80', marginTop: '0.125rem', flexShrink: 0 }} />
                          <span style={{ lineHeight: '1.5' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Commission Breakdown */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <DollarSign style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      Commission Breakdown
                    </h3>
                    <div style={{ 
                      backgroundColor: 'rgba(168, 85, 247, 0.1)', 
                      border: '1px solid rgba(168, 85, 247, 0.3)', 
                      borderRadius: '0.75rem', 
                      padding: '1rem',
                      backdropFilter: 'blur(6px) saturate(0.8)'
                    }}>
                      <p style={{ color: '#cccccc', fontSize: '0.875rem', fontFamily: 'monospace', margin: 0, fontWeight: '600', lineHeight: '1.5' }}>{selectedOpportunity.commissionBreakdown}</p>
                    </div>
                  </div>

                  {/* Expected Ramp Time */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <TrendingUp style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      Expected Ramp Time
                    </h3>
                    <p style={{ color: '#cccccc', fontSize: '0.875rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>{selectedOpportunity.rampTime}</p>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <h3 style={{ color: '#ffffff', fontWeight: '700', fontSize: '1.125rem', display: 'flex', alignItems: 'center', margin: '0 0 1rem 0' }}>
                      <Clock style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.75rem', color: '#a855f7' }} />
                      Working Hours
                    </h3>
                    <p style={{ color: '#cccccc', fontSize: '0.875rem', margin: 0, fontWeight: '500', lineHeight: '1.5' }}>{selectedOpportunity.workingHours}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
              <button
                onClick={() => handleApply(selectedOpportunity)}
                disabled={selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected"}
                style={{
                  width: '100%',
                  padding: '1rem 1.5rem',
                  background: selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected" 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected" ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected" 
                    ? 'none' 
                    : '0 4px 12px rgba(168, 85, 247, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (selectedOpportunity.status !== "accepted" && selectedOpportunity.status !== "rejected") {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(168, 85, 247, 0.4)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedOpportunity.status !== "accepted" && selectedOpportunity.status !== "rejected") {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
                  }
                }}
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
              </button>
              {!selectedOpportunity.status && (
                <p style={{ fontSize: '0.75rem', color: '#888888', textAlign: 'center', margin: '0.75rem 0 0 0', fontWeight: '500' }}>Quick apply with your Helios profile</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
