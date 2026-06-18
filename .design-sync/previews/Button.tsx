import { Button } from 'corioscan-ui';
import { Camera, Download } from 'lucide-react';

export const Variants = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button>Start scan</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="destructive">Delete case</Button>
    <Button variant="outline">Export PDF</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="link">View details</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button size="icon" aria-label="Capture"><Camera /></Button>
  </div>
);

export const WithIconAndStates = () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
    <Button><Camera /> Capture lesion</Button>
    <Button variant="outline"><Download /> Download report</Button>
    <Button disabled>Analyzing…</Button>
  </div>
);
