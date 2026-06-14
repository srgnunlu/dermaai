import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Stethoscope,
  Shield,
  Brain,
  Clock,
  FileText,
  Users,
  Upload,
  Sparkles,
  ClipboardCheck,
  ShieldCheck,
  BadgeCheck,
  Microscope,
  ArrowRight,
} from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: 'HIPAA-conscious data handling' },
  { icon: Brain, label: 'Dual-AI: Gemini 3 + GPT-5.5' },
  { icon: BadgeCheck, label: 'Peer-reviewed methodology' },
  { icon: Microscope, label: 'Built for clinical workflows' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload',
    description:
      'Add one or more dermoscopic or clinical skin images and optional patient context in a guided wizard.',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'AI Analysis',
    description:
      'Two independent models — Gemini 3 and GPT-5.5 — review the case in parallel and surface possible findings with confidence scores.',
  },
  {
    step: '03',
    icon: ClipboardCheck,
    title: 'Results',
    description:
      'Compare model agreement, review urgency flags, and export a structured awareness report in seconds.',
  },
];

const FEATURES = [
  {
    icon: Brain,
    color: 'cyan',
    title: 'Dual AI Analysis',
    description:
      'Uses Google Gemini 3 and OpenAI GPT-5.5 to provide possible findings with clearly labelled model confidence scores.',
  },
  {
    icon: Shield,
    color: 'emerald',
    title: 'Secure & Private',
    description:
      'Privacy-focused data handling with encrypted storage and user authentication to help protect patient information.',
  },
  {
    icon: FileText,
    color: 'violet',
    title: 'Detailed Reports',
    description:
      'Generate awareness reports with possible findings, general recommendations, and escalation reminders.',
  },
  {
    icon: Clock,
    color: 'amber',
    title: 'Case History',
    description:
      'Track and review all previous cases with complete analysis history and patient information.',
  },
  {
    icon: Users,
    color: 'indigo',
    title: 'Patient Management',
    description:
      'Efficiently manage patient records with detailed medical history and demographic information.',
  },
  {
    icon: Shield,
    color: 'rose',
    title: 'Urgency Detection',
    description:
      'Automatically identifies conditions requiring immediate medical attention with clear visual indicators.',
  },
] as const;

const FEATURE_ICON_TONE: Record<string, string> = {
  cyan: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
};

const signIn = () => {
  window.location.href = '/api/auth/google';
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full"></div>
              <div className="feature-icon relative p-4 rounded-2xl">
                <Stethoscope className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            Corio<span className="gradient-text"> Scan</span>
          </h1>
          <p className="text-lg text-cyan-600 dark:text-cyan-400 font-medium mb-4">
            AI-Assisted Skin Awareness Platform
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Skin-awareness, documentation, and preliminary assessment assistance for adults and
            healthcare professionals
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={signIn}
              data-testid="button-google-login"
              className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <GoogleIcon />
              Sign in with Google
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="px-8 py-6 text-lg border-cyan-300 dark:border-cyan-700"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="glass-card-light flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="how-it-works" className="mt-24 scroll-mt-24">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-400">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
              From image to insight in three steps
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, i) => (
              <div key={step} className="relative">
                <Card className="glass-card-light h-full border-0">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="feature-icon flex h-12 w-12 items-center justify-center rounded-xl">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <span className="text-3xl font-bold text-cyan-500/20 dark:text-cyan-400/20">
                        {step}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {description}
                    </p>
                  </CardContent>
                </Card>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-cyan-400/50 md:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8 mt-24">
          {FEATURES.map(({ icon: Icon, color, title, description }) => (
            <Card
              key={title}
              className="premium-card border-0 shadow-lg transition-shadow hover:shadow-xl"
              data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <CardHeader>
                <div className={`p-3 rounded-xl w-fit mb-2 ${FEATURE_ICON_TONE[color]}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTA Section */}
        <div className="relative mt-24 overflow-hidden rounded-3xl p-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-teal-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
            <p className="text-lg text-cyan-50 mb-8 max-w-xl mx-auto">
              Sign in with your Google account to access the Corio Scan platform — no setup required.
            </p>
            <Button
              size="lg"
              onClick={signIn}
              data-testid="button-get-started"
              className="bg-white text-cyan-700 hover:bg-cyan-50 px-8 py-6 text-lg font-semibold shadow-xl transition-all flex items-center gap-2 mx-auto"
            >
              <GoogleIcon />
              Continue with Google
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
