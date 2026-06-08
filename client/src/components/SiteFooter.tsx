import { Link } from 'wouter';
import { Microscope } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <Microscope className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-lg font-semibold text-foreground">Corio<span className="text-cyan-600"> Scan</span></p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  AI-Assisted Skin Awareness
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Skin awareness, preliminary assessment, structured reporting, and documentation
              tools for adults and healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-foreground">Terms of Service</Link>
              </li>
              <li>
                <Link href="/medical-disclaimer" className="hover:text-foreground">Medical Disclaimer</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/documentation" className="hover:text-foreground">Documentation</Link>
              </li>
              <li>
                <Link href="/contact-support" className="hover:text-foreground">Contact Support</Link>
              </li>
              <li>
                <Link href="/technical-requirements" className="hover:text-foreground">Technical Requirements</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Corio Scan. AI-assisted skin awareness and preliminary
            assessment. Not a substitute for professional medical care.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
