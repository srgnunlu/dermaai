import SiteFooter from '@/components/SiteFooter';

const requirements = [
  {
    title: 'Network',
    items: [
      'HTTPS access to api.corioscan.com and storage.corioscan.com on ports 443/80.',
      'Outbound access to Google Cloud Storage or Cloudinary (if configured for media hosting).',
      'Minimum 10 Mbps upload bandwidth per concurrent clinician for high-resolution imaging.',
    ],
  },
  {
    title: 'Workstation',
    items: [
      'Modern browser (Chrome, Edge, or Safari) released within the past 12 months.',
      'Display resolution of 1440px width or higher for optimal dermatoscopic review.',
      'Hardware acceleration enabled for smooth image rendering in the analysis viewer.',
    ],
  },
  {
    title: 'Security',
    items: [
      'Single sign-on (SAML/OIDC) or Corio Scan MFA for production environments.',
      'Role-based access configured for clinicians, supervisors, and administrators.',
      'Quarterly review of audit logs and AI override reports by clinical governance teams.',
    ],
  },
  {
    title: 'Integrations',
    items: [
      'Optional HL7/FHIR connectors for pushing structured reports to Electronic Health Records.',
      'Webhook endpoints secured with HMAC signatures for receiving analysis completion events.',
      'Export capability to SFTP for long-term archiving when required by local regulation.',
    ],
  },
];

export default function TechnicalRequirementsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="inline-flex items-center rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
            Technical Requirements
          </span>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            Environment Checklist for Corio Scan Deployment
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Prepare your infrastructure for Corio Scan with the configuration checklist below. Meeting
            these requirements ensures reliable AI performance, secure case handling, and fast
            turnaround for dual-model consensus analyses.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {requirements.map((section) => (
              <div
                key={section.title}
                className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
              >
                <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card/80 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">On-premises deployment?</p>
            <p className="mt-2">
              Contact our engineering team for container images, infrastructure diagrams, and
              validated hardware specs for hospital networks that require dedicated hosting.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
