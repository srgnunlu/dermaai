import { CaseHistory } from "@/components/CaseHistory";
import { Link } from "wouter";
import { Microscope, History, User, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CaseHistoryPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <a className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <Microscope className="text-primary" size={28} />
                <span className="text-xl font-bold text-foreground">DermaAI</span>
              </a>
            </Link>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Diagnosis
                </a>
              </Link>
              <Link href="/case-history">
                <a className="text-sm font-medium text-foreground transition-colors">
                  Case History
                </a>
              </Link>
              <Link href="/settings">
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Settings
                </a>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Bell size={20} />
              </Button>
              <Link href="/profile">
                <a>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <User size={20} />
                  </Button>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Case History</h1>
          <CaseHistory />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 DermaAI. This tool is for medical professional use only and should not replace clinical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}