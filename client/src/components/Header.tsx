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
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import type { Case } from '@shared/schema';

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);
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
    { name: 'Diagnosis', href: '/diagnosis', icon: Activity },
    { name: 'Case History', href: '/case-history', icon: History },
    { name: 'Settings', href: '/settings', icon: Settings },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield });
    navigation.push({ name: 'Analytics', href: '/analytics', icon: BarChart3 });
    navigation.push({ name: 'Dermatologist Review', href: '/dermatologist', icon: Stethoscope });
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    try {
      queryClient.clear();
      await fetch('/api/logout', {
        method: 'POST',
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
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <a className="flex items-center gap-3" data-testid="link-home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Microscope className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-white">DermaAI</span>
              <span className="text-xs text-blue-200">Medical Support</span>
            </span>
          </a>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
            className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 text-slate-200 hover:bg-slate-800 md:flex"
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
                className="relative h-10 w-10 rounded-full border border-slate-800 bg-slate-900/60"
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
                    <p
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400"
                      data-testid="text-role"
                    >
                      Administrator
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <div className="md:hidden">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href}>
                        <a
                          className="flex w-full items-center"
                          data-testid={`mobile-link-${item.name.toLowerCase().replace(' ', '-')}`}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{item.name}</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  data-testid="mobile-alerts"
                  onSelect={() => setAlertsOpen(true)}
                >
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span>Alerts</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>

              <DropdownMenuItem
                onClick={handleLogout}
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-red-300">
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-200">
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
                            {caseItem.finalDiagnoses?.[0]?.name || 'Awaiting diagnosis'}
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
