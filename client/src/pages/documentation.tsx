import SiteFooter from '@/components/SiteFooter';
import { Code, Workflow, ShieldCheck, GaugeCircle } from 'lucide-react';

const modules = [
  {
    icon: Workflow,
    title: 'Clinical Workflow',
    description:
      'Step-by-step guidance for uploading imagery, completing patient intake forms, and managing follow-up tasks once AI analysis is returned.',
  },
  {
    icon: Code,
    title: 'Integration API',
    description:
      'REST endpoints for synchronising DermaAI cases with EHR systems, including webhook triggers for analysis completion and report exports.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Compliance',
    description:
      'Encryption standards, auditing capabilities, and controls to help satisfy HIPAA, GDPR, and local healthcare data regulations.',
  },
  {
    icon: GaugeCircle,
    title: 'Model Performance',
    description:
      'Benchmark methodology, confidence scoring, and guidance on monitoring agreement between Gemini and GPT-5 analyses over time.',
  },
];

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
              Documentation Portal
            </span>
            <h1 className="mt-4 text-4xl font-bold text-foreground">
              Implementing DermaAI in Your Clinic
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Access deployment guides, workflow diagrams, and API references to configure DermaAI
              for your dermatology service. These resources assume a technical lead collaborating
              with clinical champions.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {modules.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card/80 p-6">
            <h3 className="text-lg font-semibold text-foreground">Getting Started Checklist</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm text-muted-foreground">
              <li>
                Review the onboarding guide with your clinical governance team and appoint a DermaAI
                administrator.
              </li>
              <li>
                Configure secure S3 or Cloudinary storage (if required) and verify outbound network
                policies to DermaAI endpoints.
              </li>
              <li>
                Execute a pilot with de-identified historic cases to familiarise clinicians with
                consensus reporting and confidence scores.
              </li>
              <li>
                Document sign-off and publish the use-case to your staff intranet or knowledge base.
              </li>
            </ol>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
