import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { RecruiterJobsContent } from "./jobs-content"

export default function RecruiterJobsPage() {
  return (
    <AccessWrapper>
      <RecruiterJobsContent />
    </AccessWrapper>
  )
}
