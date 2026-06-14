import { Link, useLocation } from 'wouter';
import { Home, ScanLine, FolderClock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'New Scan', href: '/diagnosis', icon: ScanLine },
  { name: 'Cases', href: '/case-history', icon: FolderClock },
  { name: 'Profile', href: '/profile', icon: UserIcon },
];

/**
 * Fixed bottom tab bar for mobile. Provides thumb-reachable navigation to the
 * core flows while the hamburger Sheet keeps the full menu. Hidden on >= md.
 */
export default function BottomNav() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.href;
          return (
            <li key={tab.name} className="flex-1">
              <Link href={tab.href}>
                <a
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`tab-${tab.name.toLowerCase().replace(' ', '-')}`}
                >
                  <span
                    className={`flex h-9 w-11 items-center justify-center rounded-full transition-colors ${
                      isActive ? 'bg-primary/15 text-primary' : 'text-current'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>{tab.name}</span>
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
