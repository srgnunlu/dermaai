import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { Stethoscope, Home, Activity, History, Settings, User as UserIcon, LogOut, Shield } from "lucide-react";
import type { User } from "@shared/schema";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Diagnosis", href: "/diagnosis", icon: Activity },
    { name: "Case History", href: "/case-history", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Profile", href: "/profile", icon: UserIcon },
  ];
  
  // Add admin link if user is admin
  if (user?.role === "admin") {
    navigation.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  if (!isAuthenticated) {
    return null; // Don't show header on landing page
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center space-x-2" data-testid="link-home">
                <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">MedDiagnosis AI</span>
              </a>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${location === item.href
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    data-testid={`link-${item.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={user?.profileImageUrl || ""} 
                      alt={user?.firstName || "User"} 
                    />
                    <AvatarFallback>
                      {user?.firstName?.[0] || user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none" data-testid="text-username">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-email">
                      {user?.email}
                    </p>
                    {user?.role === "admin" && (
                      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400" data-testid="text-role">
                        Administrator
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Navigation */}
                <div className="md:hidden">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link href={item.href}>
                          <a className="flex items-center w-full" data-testid={`mobile-link-${item.name.toLowerCase().replace(' ', '-')}`}>
                            <Icon className="mr-2 h-4 w-4" />
                            <span>{item.name}</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem 
                  onClick={() => window.location.href = "/api/logout"}
                  className="text-red-600 dark:text-red-400"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}