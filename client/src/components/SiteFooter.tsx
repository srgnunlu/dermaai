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
                  AI-Powered Skin Analysis
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clinical decision support for dermatology teams. Dual-model AI analysis, structured
              reporting, and secure patient workflows in a single platform.
            </p>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy-policy">
                  <a className="hover:text-foreground">Privacy Policy</a>
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service">
                  <a className="hover:text-foreground">Terms of Service</a>
                </Link>
              </li>
              <li>
                <Link href="/medical-disclaimer">
                  <a className="hover:text-foreground">Medical Disclaimer</a>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/documentation">
                  <a className="hover:text-foreground">Documentation</a>
                </Link>
              </li>
              <li>
                <Link href="/contact-support">
                  <a className="hover:text-foreground">Contact Support</a>
                </Link>
              </li>
              <li>
                <Link href="/technical-requirements">
                  <a className="hover:text-foreground">Technical Requirements</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Corio Scan. AI-powered skin analysis for dermatology
            professionals. Not a substitute for professional diagnosis.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
