import { Settings, Shield, Palette, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SiteFooter from "@/components/SiteFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import type { UserSettings } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
  });

  // Local state for controlled components
  const [formData, setFormData] = useState<Partial<UserSettings>>({
    useGemini: true,
    useOpenAI: true,
    confidenceThreshold: 40,
    autoSaveCases: true,
    anonymizeData: false,
    dataRetention: "90",
    theme: "system",
    compactMode: false,
    analysisNotifications: true,
    urgentAlerts: true,
    soundNotifications: false,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setFormData({
        useGemini: settings.useGemini ?? true,
        useOpenAI: settings.useOpenAI ?? true,
        confidenceThreshold: settings.confidenceThreshold ?? 40,
        autoSaveCases: settings.autoSaveCases ?? true,
        anonymizeData: settings.anonymizeData ?? false,
        dataRetention: settings.dataRetention ?? "90",
        theme: settings.theme ?? "system",
        compactMode: settings.compactMode ?? false,
        analysisNotifications: settings.analysisNotifications ?? true,
        urgentAlerts: settings.urgentAlerts ?? true,
        soundNotifications: settings.soundNotifications ?? false,
      });
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest('PUT', '/api/settings', data);
      return response.json();
    },
    onSuccess: (updatedSettings: UserSettings) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
      // Apply theme immediately using ThemeProvider
      setTheme(updatedSettings.theme as "light" | "dark" | "system" || "system");
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Settings save error:", error);
      
      // Extract error message from response
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          error?.message || 
                          "Failed to save settings. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Sync theme from settings when they are loaded
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme as "light" | "dark" | "system");
    }
  }, [settings?.theme, setTheme]);

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                  <Switch 
                    id="use-gemini" 
                    checked={formData.useGemini}
                    onCheckedChange={(checked) => setFormData({...formData, useGemini: checked})}
                    data-testid="switch-use-gemini"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-openai">Use ChatGPT-5</Label>
                  <Switch 
                    id="use-openai" 
                    checked={formData.useOpenAI}
                    onCheckedChange={(checked) => setFormData({...formData, useOpenAI: checked})}
                    data-testid="switch-use-openai"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence-threshold">Minimum Confidence Threshold (%)</Label>
                  <Input 
                    type="number" 
                    id="confidence-threshold" 
                    value={formData.confidenceThreshold}
                    onChange={(e) => setFormData({...formData, confidenceThreshold: parseInt(e.target.value) || 0})}
                    min="0" 
                    max="100"
                    data-testid="input-confidence-threshold"
                  />
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
                  <Switch 
                    id="auto-save" 
                    checked={formData.autoSaveCases}
                    onCheckedChange={(checked) => setFormData({...formData, autoSaveCases: checked})}
                    data-testid="switch-auto-save"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="anonymize">Anonymize patient data</Label>
                  <Switch 
                    id="anonymize"
                    checked={formData.anonymizeData}
                    onCheckedChange={(checked) => setFormData({...formData, anonymizeData: checked})}
                    data-testid="switch-anonymize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retention">Data retention period</Label>
                  <Select 
                    value={formData.dataRetention}
                    onValueChange={(value) => setFormData({...formData, dataRetention: value})}
                  >
                    <SelectTrigger id="retention" data-testid="select-retention">
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
                  <Select 
                    value={formData.theme}
                    onValueChange={(value) => setFormData({...formData, theme: value})}
                  >
                    <SelectTrigger id="theme" data-testid="select-theme">
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
                  <Switch 
                    id="compact-mode"
                    checked={formData.compactMode}
                    onCheckedChange={(checked) => setFormData({...formData, compactMode: checked})}
                    data-testid="switch-compact-mode"
                  />
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
                  <Switch 
                    id="analysis-complete" 
                    checked={formData.analysisNotifications}
                    onCheckedChange={(checked) => setFormData({...formData, analysisNotifications: checked})}
                    data-testid="switch-analysis-notifications"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="urgent-cases">Urgent case alerts</Label>
                  <Switch 
                    id="urgent-cases" 
                    checked={formData.urgentAlerts}
                    onCheckedChange={(checked) => setFormData({...formData, urgentAlerts: checked})}
                    data-testid="switch-urgent-alerts"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sound">Sound notifications</Label>
                  <Switch 
                    id="sound"
                    checked={formData.soundNotifications}
                    onCheckedChange={(checked) => setFormData({...formData, soundNotifications: checked})}
                    data-testid="switch-sound-notifications"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
