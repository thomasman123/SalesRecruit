export async function getTopMatchesForOpportunity(opportunityId: number, page: number = 1, pageSize: number = 5) {
  const res = await fetch("/api/get-top-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: opportunityId, page, pageSize }),
  })
  if (!res.ok) {
    throw new Error("Failed to fetch top matches")
  }
  return res.json() as Promise<{ items: any[]; total: number }>
} 