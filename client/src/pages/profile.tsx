import { Link } from "wouter";
import { Microscope, History, User, Settings, Bell, Mail, Phone, Calendar, MapPin, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
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
                  <Button variant="ghost" size="icon" className="text-foreground">
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
          <h1 className="text-3xl font-bold text-foreground mb-6">User Profile</h1>
          
          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            {/* Profile Summary Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src="" alt="Profile" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">DR</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-semibold text-foreground">Dr. Sarah Johnson</h3>
                  <p className="text-sm text-muted-foreground mt-1">Dermatologist</p>
                  <div className="flex items-center mt-3 text-sm text-muted-foreground">
                    <Award className="mr-1" size={16} />
                    <span>Board Certified</span>
                  </div>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <MapPin className="mr-1" size={16} />
                    <span>New York, NY</span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Cases</span>
                    <span className="font-medium text-foreground">142</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium text-foreground">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy Rate</span>
                    <span className="font-medium text-success">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" defaultValue="Sarah" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" defaultValue="Johnson" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="sarah.johnson@hospital.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" />
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>Your medical credentials and specialization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="license">Medical License Number</Label>
                    <Input id="license" defaultValue="MD-123456" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" defaultValue="Dermatology" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital/Clinic</Label>
                    <Input id="hospital" defaultValue="New York General Hospital" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" defaultValue="12" />
                  </div>
                </CardContent>
              </Card>

              {/* Account Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">Change Password</Button>
                  <Button variant="outline" className="w-full">Enable Two-Factor Authentication</Button>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary/90">
                  Save Changes
                </Button>
              </div>
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