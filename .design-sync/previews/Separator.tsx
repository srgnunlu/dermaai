import { Separator } from 'corioscan-ui';

export const HorizontalBetweenSections = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 420 }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Patient — Sergen K.</div>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
        DOB: 12 Mar 1988 · Fitzpatrick type III
      </div>
    </div>
    <Separator />
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Scan — Lesion #A-1042</div>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
        Captured 18 Jun 2026 · Right forearm · 4.2 mm diameter
      </div>
    </div>
    <Separator />
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>AI assessment</div>
      <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
        High risk · Asymmetric border · Specialist review recommended
      </div>
    </div>
  </div>
);

export const VerticalInlineNav = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <span style={{ fontSize: 14, color: 'var(--foreground)', fontWeight: 500 }}>Profile</span>
    <Separator orientation="vertical" style={{ height: 20 }} />
    <span style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>Cases</span>
    <Separator orientation="vertical" style={{ height: 20 }} />
    <span style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>Reports</span>
    <Separator orientation="vertical" style={{ height: 20 }} />
    <span style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>Settings</span>
  </div>
);
