import SiteFooter from '@/components/SiteFooter';

const sections = [
  {
    title: 'Information We Collect',
    body: [
      'Account details such as name, email address, and professional credentials provided during registration.',
      'Case data uploaded by clinicians, including lesion imagery, structured patient history, and clinician annotations.',
      'System telemetry that helps us improve the service (for example browser type, usage metrics, and diagnostic performance).',
    ],
  },
  {
    title: 'How We Use Information',
    body: [
      'Deliver dermatological AI analysis and maintain a longitudinal case history for your clinical teams.',
      'Generate anonymised analytics that help improve model accuracy and platform reliability.',
      'Comply with legal obligations and respond to required audits or quality assurance assessments.',
    ],
  },
  {
    title: 'Data Protection',
    body: [
      'All content in transit is encrypted using TLS 1.2+ and is stored in encrypted databases within the European Union.',
      'Access to case data is restricted to authenticated clinical users within your organisation, and every access is logged.',
      'Backups are retained for 30 days in secure storage to support disaster recovery and continuity of care.',
    ],
  },
  {
    title: 'Your Rights',
    body: [
      'Request a copy of personal data stored in Corio Scan or ask for corrections when records are inaccurate.',
      'Request deletion of information that is no longer required for clinical operations or regulatory compliance.',
      'Appoint a data protection contact to receive breach notifications and audit responses from our team.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-400">
            Privacy Policy
          </span>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            Protecting Clinical and Patient Privacy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Corio Scan is designed for regulated clinical environments. We only collect the information
            required to deliver secure dermatological decision support and never use
            patient-identifiable data for marketing or third-party analytics.
          </p>

          <div className="mt-10 grid gap-8">
            {sections.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
                <ul className="mt-4 space-y-2 text-muted-foreground">
                  {section.body.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 text-sm text-blue-100">
            <p className="font-semibold">Questions about privacy?</p>
            <p className="mt-2">
              Email our Data Protection Officer at{' '}
              <a href="mailto:privacy@corioscan.com" className="underline">
                privacy@corioscan.com
              </a>
              . We respond to verified requests within 72 hours.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
