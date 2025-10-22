import SiteFooter from '@/components/SiteFooter';

const clauses = [
  {
    title: 'Clinical Use',
    description:
      'DermaAI provides clinical decision support and should be used by licensed healthcare professionals. All diagnoses and treatment plans remain the responsibility of the supervising clinician.',
  },
  {
    title: 'Account Responsibilities',
    description:
      'You are responsible for safeguarding login credentials, ensuring accurate user roles, and immediately reporting unauthorised access or suspected misuse.',
  },
  {
    title: 'Data Ownership',
    description:
      'Patient records and uploaded media remain the property of your organisation. DermaAI processes data on your behalf and does not claim ownership of the clinical content you generate.',
  },
  {
    title: 'Service Availability',
    description:
      'DermaAI targets 99.5% uptime. Planned maintenance windows are communicated at least 48 hours in advance. Critical incidents are reported through your nominated contact.',
  },
  {
    title: 'Model Updates',
    description:
      "We continuously improve AI models. Significant behavioural changes are documented in release notes and can be reviewed in your organisation's audit trail.",
  },
  {
    title: 'Termination',
    description:
      'You may terminate access at any time. Upon termination we provide a secure export of stored case data and purge remaining content within 30 days unless legal retention is required.',
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
            Professional Agreement for DermaAI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            These terms govern the use of DermaAI by healthcare providers and organisations. By
            accessing the platform you agree to follow the safeguards described below to protect
            patients, maintain compliance, and preserve service quality.
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
              <h3 className="text-lg font-semibold text-foreground">Service Level Commitments</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We monitor model performance, infrastructure uptime, and queue processing times
                around the clock. Escalations follow our ISO 27001-aligned runbooks.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Contact for Legal Notices</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                legal@dermaai.health • DermaAI Compliance, 18 Klinik Str, Zürich 8001, Switzerland.
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
