import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import {
  Microscope,
  Activity,
  History,
  Settings,
  User as UserIcon,
  LogOut,
  Shield,
  Bell,
  BarChart3,
  Stethoscope,
  FlaskConical,
  Menu,
} from 'lucide-react';
import { getCsrfHeaders, queryClient } from '@/lib/queryClient';
import type { Case } from '@shared/schema';

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  const { data: cases = [], isLoading: casesLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const urgentCases = useMemo(() => {
    return cases.filter((caseItem) =>
      caseItem.finalDiagnoses?.some((diagnosis) => diagnosis.isUrgent)
    );
  }, [cases]);

  const recentCases = useMemo(() => cases.slice(0, 10), [cases]);

  const navigation = [
    { name: 'Analysis', href: '/diagnosis', icon: Activity },
    { name: 'Case History', href: '/case-history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
    navigation.push({ name: 'Analytics', href: '/analytics', icon: BarChart3 });
    navigation.push({ name: 'Dermatologist Review', href: '/dermatologist', icon: Stethoscope });
    navigation.push({ name: 'Research', href: '/research-analytics', icon: FlaskConical });
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      queryClient.clear();
      await fetch('/api/logout', {
        method: 'POST',
        headers: await getCsrfHeaders(),
        credentials: 'include',
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      queryClient.clear();
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger → slide-in navigation */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-xl border border-border bg-card/60 text-foreground hover:bg-accent md:hidden"
                aria-label="Open navigation menu"
                data-testid="button-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-border bg-background/95 p-0 backdrop-blur-xl"
            >
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-3">
                  <span className="feature-icon flex h-10 w-10 items-center justify-center rounded-xl text-white">
                    <Microscope className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-display text-base font-semibold tracking-tight text-foreground">
                      Corio<span className="text-primary"> Scan</span>
                    </span>
                    <span className="text-xs text-muted-foreground">AI-Powered Skin Analysis</span>
                  </span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                        data-testid={`drawer-link-${item.name.toLowerCase().replace(' ', '-')}`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAlertsOpen(true);
                  }}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  data-testid="drawer-alerts"
                >
                  <Bell className="h-5 w-5" />
                  <span>Alerts</span>
                  {urgentCases.length > 0 && (
                    <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                      {urgentCases.length}
                    </span>
                  )}
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/">
            <a className="flex items-center gap-3" data-testid="link-home">
              <span className="feature-icon flex h-10 w-10 items-center justify-center rounded-xl text-white">
                <Microscope className="h-5 w-5" />
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Corio<span className="text-primary"> Scan</span>
                </span>
                <span className="text-xs text-muted-foreground">AI-Powered Skin Analysis</span>
              </span>
            </a>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
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

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="hidden items-center gap-2 rounded-full border border-border bg-card/60 text-foreground hover:bg-accent md:flex"
            data-testid="button-alerts"
            onClick={() => setAlertsOpen(true)}
          >
            <Bell className="h-4 w-4" />
            Alerts
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-11 w-11 rounded-full border border-border bg-card/60"
                data-testid="button-user-menu"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || 'User'} />
                  <AvatarFallback>{user?.firstName?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none" data-testid="text-username">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || 'User'}
                  </p>
                  <p
                    className="text-xs leading-none text-muted-foreground"
                    data-testid="text-email"
                  >
                    {user?.email}
                  </p>
                  {user?.role === 'admin' && (
                    <p className="text-xs font-semibold text-primary" data-testid="text-role">
                      Administrator
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive"
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alerts & Notifications</DialogTitle>
            <DialogDescription>
              Track urgent dermatology cases and recent AI analyses. Adjust delivery preferences
              from Settings → Notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-destructive">
                Urgent Cases
              </h3>
              <div className="mt-3 rounded-lg border border-border bg-card/60">
                {casesLoading ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Checking for urgent alerts…
                  </p>
                ) : urgentCases.length > 0 ? (
                  <ScrollArea className="max-h-48">
                    <ul className="divide-y divide-border">
                      {urgentCases.map((caseItem) => {
                        const urgentDiagnosis = caseItem.finalDiagnoses?.find(
                          (diagnosis) => diagnosis.isUrgent
                        );
                        return (
                          <li key={caseItem.id} className="px-4 py-3 text-sm">
                            <p className="font-semibold text-foreground">{caseItem.caseId}</p>
                            <p className="text-muted-foreground">
                              {urgentDiagnosis?.name || 'Urgent condition detected'}
                            </p>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    No urgent cases currently flagged.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                Recent Analyses
              </h3>
              <div className="mt-3 rounded-lg border border-border bg-card/60">
                {casesLoading ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    Loading recent activity…
                  </p>
                ) : recentCases.length > 0 ? (
                  <ScrollArea className="max-h-64">
                    <ul className="divide-y divide-border">
                      {recentCases.map((caseItem) => (
                        <li key={caseItem.id} className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{caseItem.caseId}</span>
                            <span className="text-xs uppercase text-muted-foreground">
                              {caseItem.status}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            {caseItem.finalDiagnoses?.[0]?.name || 'Awaiting analysis'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                ) : (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    No analyses yet. Upload a case to get started.
                  </p>
                )}
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
