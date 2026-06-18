import { Input, Label } from 'corioscan-ui';

export const WithLabel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 280 }}>
    <Label htmlFor="email">Clinician email</Label>
    <Input id="email" type="email" placeholder="doctor@clinic.com" />
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
    <Input placeholder="Search cases…" />
    <Input defaultValue="A-1042" />
    <Input placeholder="Disabled" disabled />
    <Input type="file" />
  </div>
);
