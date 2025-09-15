import { Link } from "wouter";
import { Microscope, History, User, Settings, Bell, Shield, Key, Palette, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SettingsPage() {
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
                <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Case History
                </a>
              </Link>
              <Link href="/settings">
                <a className="text-sm font-medium text-foreground transition-colors">
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>
          
          <div className="space-y-6">
            {/* AI Model Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2" size={20} />
                  AI Model Preferences
                </CardTitle>
                <CardDescription>Configure AI analysis settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-gemini">Use Gemini 2.5 Flash</Label>
                  <Switch id="use-gemini" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-openai">Use ChatGPT-5</Label>
                  <Switch id="use-openai" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Minimum Confidence Threshold (%)</Label>
                  <Input type="number" id="confidence-threshold" defaultValue="40" min="0" max="100" />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2" size={20} />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Manage data privacy and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto-save cases</Label>
                  <Switch id="auto-save" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anonymize">Anonymize patient data</Label>
                  <Switch id="anonymize" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Data retention period</Label>
                  <Select defaultValue="90">
                    <SelectTrigger id="retention">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appearance Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2" size={20} />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the application appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select defaultValue="system">
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode">Compact mode</Label>
                  <Switch id="compact-mode" />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="mr-2" size={20} />
                  Notifications
                </CardTitle>
                <CardDescription>Configure notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="analysis-complete">Analysis complete notifications</Label>
                  <Switch id="analysis-complete" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="urgent-cases">Urgent case alerts</Label>
                  <Switch id="urgent-cases" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">Sound notifications</Label>
                  <Switch id="sound" />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button className="bg-primary hover:bg-primary/90">
                Save Settings
              </Button>
            </div>
          </div>
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