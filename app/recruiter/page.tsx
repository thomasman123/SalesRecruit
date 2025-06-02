import { AccessWrapper } from "@/components/recruiter/access-wrapper"
import { RecruiterDashboardContent } from "./dashboard-content"

export default function RecruiterDashboardPage() {
  return (
    <AccessWrapper>
      <RecruiterDashboardContent />
    </AccessWrapper>
  )
}
