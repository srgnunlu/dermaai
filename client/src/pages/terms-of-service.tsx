import SiteFooter from '@/components/SiteFooter';

const clauses = [
  {
    title: 'Assisted Use',
    description:
      'Corio Scan provides skin-awareness, documentation, and preliminary assessment assistance for adults. It does not provide medical decisions or replace a healthcare professional.',
  },
  {
    title: 'Account Responsibilities',
    description:
      'You must be at least 18 years old. You are responsible for safeguarding login credentials, ensuring accurate user roles, and immediately reporting unauthorised access or suspected misuse.',
  },
  {
    title: 'Data Ownership',
    description:
      'Patient records and uploaded media remain the property of your organisation. Corio Scan processes data on your behalf and does not claim ownership of the clinical content you generate.',
  },
  {
    title: 'Service Availability',
    description:
      'Service availability may be affected by maintenance, network conditions, or third-party providers. Material service issues are communicated through available support channels.',
  },
  {
    title: 'Model Updates',
    description:
      'We may update service models and document significant behavioural changes. User images and health data are not used for model training or AI improvement.',
  },
  {
    title: 'Termination',
    description:
      'You may delete your account at any time. Active account-linked records and supported uploaded files are deleted when the request is processed, subject to legal retention and provider backup cycles.',
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-300">
            Terms of Service
          </span>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            Terms for Corio Scan
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            These terms govern Corio Scan use by adults for personal use or by healthcare
            professionals for documentation and preliminary assessment assistance.
          </p>

          <div className="mt-10 grid gap-6">
            {clauses.map((clause) => (
              <div
                key={clause.title}
                className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-foreground">{clause.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{clause.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 rounded-2xl border border-border bg-card/80 p-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Service Operations</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We monitor service health and investigate reported reliability or security issues.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Contact for Legal Notices</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                destek@corioscan.com • Corio Scan, Istanbul, Turkey.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
