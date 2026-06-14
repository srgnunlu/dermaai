import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

const RELOAD_FLAG = 'dermaai:chunk-reloaded';

// Detects the classic post-deploy failure: a lazily-loaded JS chunk whose
// hashed filename changed in a new build, so the old reference 404s and the
// dynamic import() rejects. Browsers phrase this several different ways.
function isChunkLoadError(error: Error | null): boolean {
  const msg = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return (
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

function safeSession(action: 'get' | 'set' | 'remove'): boolean {
  try {
    if (action === 'get') return sessionStorage.getItem(RELOAD_FLAG) === '1';
    if (action === 'set') sessionStorage.setItem(RELOAD_FLAG, '1');
    if (action === 'remove') sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // sessionStorage can be unavailable (private mode quotas) — fail safe.
  }
  return false;
}

/**
 * App-wide safety net: catches render/runtime errors in the React tree and
 * shows a friendly recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log for diagnostics. Never include user/patient data here.
    console.error('[ErrorBoundary] Unhandled UI error:', error, info.componentStack);

    // Stale-bundle recovery: a code chunk failed to load — almost always because
    // a new deploy replaced it while this tab was open. Reload once to pull the
    // fresh bundle. The session flag prevents a reload loop if it doesn't help.
    if (isChunkLoadError(error) && !safeSession('get')) {
      safeSession('set');
      window.location.reload();
    }
  }

  reset = () => {
    safeSession('remove');
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(error, this.reset);

    const chunk = isChunkLoadError(error);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
        <div className="glass-card-light w-full max-w-md rounded-2xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {chunk
              ? 'A new version of the app is available. Reloading to get the latest version…'
              : 'An unexpected error interrupted this page. You can try again, or return to the home screen. No patient data was affected.'}
          </p>

          {/* Surfaced error details — lets us see the real cause when reported. */}
          <details className="mt-4 text-left">
            <summary className="cursor-pointer select-none text-xs text-muted-foreground">
              Technical details
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
              {error.name}: {error.message}
              {error.stack ? `\n\n${error.stack.split('\n').slice(0, 8).join('\n')}` : ''}
            </pre>
          </details>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => (chunk ? window.location.reload() : this.reset())}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {chunk ? 'Reload' : 'Try again'}
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <a href="/">
                <Home className="h-4 w-4" />
                Go home
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
