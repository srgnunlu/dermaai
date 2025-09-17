import { CaseHistory } from "@/components/CaseHistory";
import SiteFooter from "@/components/SiteFooter";

export default function CaseHistoryPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Case History</h1>
          <CaseHistory />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
