import SiteFooter from '@/components/SiteFooter';

const statements = [
  'Corio Scan generates differential diagnoses and priority assessments based on submitted imagery and case notes. Outputs are advisory only.',
  'Only qualified clinicians may make diagnostic or treatment decisions. Always confirm AI suggestions with patient examination, history, and relevant tests.',
  'Urgency indicators highlight potential risk but do not replace institutional escalation policies or emergency triage procedures.',
  'Corio Scan does not provide medical guidance directly to patients. Patient-facing use is prohibited without clinician supervision.',
  'The platform is not certified as a medical device in every jurisdiction. Ensure usage complies with local regulatory frameworks.',
  'Clinical governance teams should review periodic audit logs, model release notes, and documented limitations before expanding usage.',
];

export default function MedicalDisclaimerPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
            Medical Disclaimer
          </span>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            Clinical Oversight Remains Essential
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Corio Scan augments dermatology workflows with AI-driven insights. It does not replace
            professional judgement, diagnostic testing, or patient consultation. Review the
            statements below with your clinical governance team before deploying the platform.
          </p>

          <div className="mt-10 space-y-4">
            {statements.map((entry) => (
              <div key={entry} className="rounded-xl border border-border bg-card/80 p-5">
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {entry}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-yellow-400/40 bg-yellow-500/5 p-5 text-sm text-yellow-200">
            <p className="font-semibold">Clinical Safety Lead</p>
            <p className="mt-2">
              Assign a safety officer responsible for reviewing AI-assisted cases, documenting
              overrides, and coordinating feedback with the Corio Scan medical science team.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
