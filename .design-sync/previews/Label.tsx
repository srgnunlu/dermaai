import { Label, Input, Checkbox } from 'corioscan-ui';

export const WithInput = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 300 }}>
    <Label htmlFor="patient-id">Patient ID</Label>
    <Input id="patient-id" placeholder="e.g. PT-20240618" />
  </div>
);

export const WithCheckboxRow = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="consent" defaultChecked />
      <Label htmlFor="consent">Patient has provided informed consent</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="photo-consent" />
      <Label htmlFor="photo-consent">Patient consents to photo storage</Label>
    </div>
  </div>
);

export const Variants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
    <Label>Body region</Label>
    <Label style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
      Muted — optional field
    </Label>
    <Label style={{ color: 'var(--destructive)' }}>
      Required — lesion diameter
    </Label>
  </div>
);
