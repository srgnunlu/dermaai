import { ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

// Shown when an authenticated user lacks the role required for a page
// (e.g. a dermatologist opening the admin panel).
export function AccessDenied({ message }: { message?: string }) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center"
      data-testid="access-denied"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Access denied</h1>
      <p className="text-muted-foreground">
        {message || 'You do not have permission to view this page.'}
      </p>
      <Link href="/">
        <Button variant="outline">Go to Home</Button>
      </Link>
    </div>
  );
}

export default AccessDenied;
