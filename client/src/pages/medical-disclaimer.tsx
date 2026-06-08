import SiteFooter from '@/components/SiteFooter';

const statements = [
  'Corio Scan provides AI-assisted possible findings and awareness information based on submitted imagery and context.',
  'The app does not make medical decisions or replace examination, testing, or consultation by a qualified healthcare professional.',
  'Urgency indicators highlight potential risk but do not replace institutional escalation policies or emergency triage procedures.',
  'Personal users and healthcare professionals must use the app only for awareness, documentation, and preliminary assessment assistance.',
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
            Professional Care Remains Essential
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Corio Scan is an AI-assisted skin awareness and preliminary assessment helper. It does
            not replace professional judgement, testing, or consultation.
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
