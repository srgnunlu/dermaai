import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SiteFooter from '@/components/SiteFooter';

export default function ContactSupportPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organisation: '',
    topic: '',
    message: '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Corio Scan Support - ${formData.topic || 'General'}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nOrganisation: ${formData.organisation}\n\n${formData.message}`
    );
    window.location.href = `mailto:destek@corioscan.com?subject=${subject}&body=${body}`;
    toast({
      title: 'Email app opened',
      description: 'Send the prepared email to reach Corio Scan support.',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Contact Support
          </span>
          <h1 className="mt-4 text-4xl font-bold text-foreground">
            We're here to help
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Reach Corio Scan support for account, billing, privacy, onboarding, or technical questions.
            Do not use this channel for medical emergencies.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6 rounded-2xl border border-border bg-card/80 p-6 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2"
                  placeholder="Dr. Sergen Ünlu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2"
                  placeholder="name@clinic.com"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Organisation</label>
                <Input
                  name="organisation"
                  value={formData.organisation}
                  onChange={handleChange}
                  className="mt-2"
                  placeholder="Dermacare Hospital"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Topic</label>
                <Input
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="mt-2"
                  placeholder="Onboarding, billing, security review..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">How can we help?</label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                className="mt-2 min-h-[160px]"
                placeholder="Describe your workflow question or issue"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Support: destek@corioscan.com</span>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                Submit Request
              </Button>
            </div>
          </form>

          <div className="mt-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 text-sm text-cyan-100">
            <p className="font-semibold">Support hours</p>
            <p className="mt-2">
              Email support is provided through destek@corioscan.com. For medical emergencies,
              contact your local emergency services.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
