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

  return (
    <div style={{ height: 'calc(100vh - 8rem)', display: 'flex', gap: '1.5rem', maxWidth: '112rem', margin: '0 auto', padding: '0 1.5rem', overflow: 'hidden' }}>
      {/* Left Panel - Filters */}
      {showFilters && (
        <div style={{ width: '20rem', flexShrink: 0 }}>
          <div style={{ height: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center' }}>
                <Filter style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#a855f7' }} />
                Filters
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                style={{ color: '#9ca3af', padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Industries */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Industries</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filterOptions.industries.map((industry) => (
                      <label key={industry} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{industry}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #374151' }} />

                {/* Price Range */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Price Range</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filterOptions.priceRanges.map((range) => (
                      <label key={range} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{range}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #374151' }} />

                {/* Lead Source */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Lead Source</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filterOptions.leadSources.map((source) => (
                      <label key={source} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{source}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #374151' }} />

                {/* Commission Structure */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Commission Structure</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filterOptions.commissionStructures.map((structure) => (
                      <label key={structure} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{structure}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #374151' }} />

                {/* Team Size */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '500', marginBottom: '0.75rem', fontSize: '0.875rem' }}>Team Size</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filterOptions.teamSizes.map((size) => (
                      <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
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
                          style={{ accentColor: '#a855f7' }}
                        />
                        <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>{size}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #374151' }} />

                {/* Remote Compatible */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={filters.remoteCompatible}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          remoteCompatible: e.target.checked
                        }))
                      }}
                      style={{ accentColor: '#a855f7' }}
                    />
                    <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>Remote Compatible</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div style={{ padding: '1rem', borderTop: '1px solid #374151' }}>
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
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#d1d5db',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#d1d5db';
                  e.currentTarget.style.backgroundColor = 'transparent';
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
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
          {!showFilters && (
            <button
              onClick={() => setShowFilters(true)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Filter style={{ width: '1rem', height: '1rem' }} />
            </button>
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '1rem', height: '1rem' }} />
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.75rem',
                paddingBottom: '0.75rem',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '0.375rem',
                color: 'white',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#374151',
              border: '1px solid #4b5563',
              borderRadius: '0.375rem',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest</option>
            <option value="lucrative">Most Lucrative</option>
            <option value="best-fit">Best Fit</option>
          </select>
        </div>

        {/* Active Filters */}
        {(filters.industries.length > 0 || filters.priceRanges.length > 0 || filters.leadSources.length > 0 || filters.commissionStructures.length > 0 || filters.teamSizes.length > 0 || filters.remoteCompatible) && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[...filters.industries, ...filters.priceRanges, ...filters.leadSources, ...filters.commissionStructures, ...filters.teamSizes].map((filter) => (
              <span key={filter} style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                {filter}
              </span>
            ))}
            {filters.remoteCompatible && (
              <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                Remote Compatible
              </span>
            )}
          </div>
        )}

        {/* Opportunities List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', paddingBottom: '1rem' }}>
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.id}
                onClick={() => setSelectedOpportunity(opportunity)}
                style={{
                  padding: '1.5rem',
                  backgroundColor: '#1f2937',
                  border: selectedOpportunity?.id === opportunity.id ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid #374151',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (selectedOpportunity?.id !== opportunity.id) {
                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedOpportunity?.id !== opportunity.id) {
                    e.currentTarget.style.borderColor = '#374151';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                    <img
                      src={opportunity.logo || "/placeholder.svg"}
                      alt={opportunity.companyName}
                      style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid #374151' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opportunity.companyName}</h3>
                        {opportunity.new && (
                          <span style={{ padding: '0.25rem 0.5rem', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <p style={{ color: '#c084fc', fontWeight: '500', marginBottom: '0.25rem', margin: 0 }}>{opportunity.offerType}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>{opportunity.industry}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStarToggle(opportunity.id)
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: opportunity.starred ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                      color: opportunity.starred ? '#fbbf24' : '#9ca3af',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Star style={{ width: '1.25rem', height: '1.25rem', fill: opportunity.starred ? 'currentColor' : 'none' }} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                    <Briefcase style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    <span>{opportunity.salesRole}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                    <DollarSign style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    <span style={{ fontFamily: 'monospace' }}>{opportunity.commissionPotential}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                    <Zap style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    <span>Lead Flow: {opportunity.leadFlowProvided ? "Yes" : "No"}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                    <MapPin style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    <span>{opportunity.remoteCompatible ? "Remote" : "On-site"}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {opportunity.tags.slice(0, 3).map((tag) => (
                    <span key={tag} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#374151', color: '#d1d5db', border: '1px solid #4b5563', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      {tag}
                    </span>
                  ))}
                  {opportunity.tags.length > 3 && (
                    <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#374151', color: '#9ca3af', border: '1px solid #4b5563', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                      +{opportunity.tags.length - 3} more
                    </span>
                  )}
                </div>

                <button style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#a855f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#a855f7'}
                >
                  View Role Details
                  <ChevronRight style={{ width: '1rem', height: '1rem' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Role Details */}
      {selectedOpportunity && (
        <div style={{ width: '24rem', flexShrink: 0 }}>
          <div style={{ height: '100%', backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #374151', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
                <img
                  src={selectedOpportunity.logo || "/placeholder.svg"}
                  alt={selectedOpportunity.companyName}
                  style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid #374151' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'white', margin: 0, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOpportunity.companyName}</h2>
                  <p style={{ color: '#c084fc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedOpportunity.offerType}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                style={{ padding: '0.25rem', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Company Overview */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <Building2 style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    Company Overview
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>{selectedOpportunity.companyOverview}</p>
                </div>

                {/* What You'll Be Selling */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <Target style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    What You'll Be Selling
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>{selectedOpportunity.whatYouSell}</p>
                </div>

                {/* Sales Process */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <TrendingUp style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    Sales Process
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>{selectedOpportunity.salesProcess}</p>
                </div>

                {/* What's Provided */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <CheckCircle style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    What's Provided
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedOpportunity.whatsProvided?.map((item, index) => (
                      <li key={index} style={{ display: 'flex', alignItems: 'flex-start', fontSize: '0.875rem', color: '#d1d5db' }}>
                        <CheckCircle style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#4ade80', marginTop: '0.125rem', flexShrink: 0 }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Commission Breakdown */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <DollarSign style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    Commission Breakdown
                  </h3>
                  <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.375rem', padding: '0.75rem' }}>
                    <p style={{ color: '#d1d5db', fontSize: '0.875rem', fontFamily: 'monospace', margin: 0 }}>{selectedOpportunity.commissionBreakdown}</p>
                  </div>
                </div>

                {/* Expected Ramp Time */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <TrendingUp style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    Expected Ramp Time
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', margin: 0 }}>{selectedOpportunity.rampTime}</p>
                </div>

                {/* Working Hours */}
                <div>
                  <h3 style={{ color: 'white', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', margin: '0 0 0.5rem 0' }}>
                    <Clock style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#c084fc' }} />
                    Working Hours
                  </h3>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem', margin: 0 }}>{selectedOpportunity.workingHours}</p>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div style={{ padding: '1rem', borderTop: '1px solid #374151' }}>
              <button
                onClick={() => handleApply(selectedOpportunity)}
                disabled={selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected"}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected" ? '#6b7280' : '#a855f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  cursor: selectedOpportunity.status === "accepted" || selectedOpportunity.status === "rejected" ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (selectedOpportunity.status !== "accepted" && selectedOpportunity.status !== "rejected") {
                    e.currentTarget.style.backgroundColor = '#9333ea';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedOpportunity.status !== "accepted" && selectedOpportunity.status !== "rejected") {
                    e.currentTarget.style.backgroundColor = '#a855f7';
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
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>Quick apply with your Helios profile</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
