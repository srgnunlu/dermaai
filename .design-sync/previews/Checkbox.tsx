import { Checkbox, Label } from 'corioscan-ui';

export const ConsentCheckbox = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="consent-form" defaultChecked />
      <Label htmlFor="consent-form">I confirm patient consent for AI-assisted scan</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="share-data" />
      <Label htmlFor="share-data">Share anonymised data for model training</Label>
    </div>
  </div>
);

export const CheckboxStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="cb-unchecked" />
      <Label htmlFor="cb-unchecked">Unchecked — awaiting review</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="cb-checked" defaultChecked />
      <Label htmlFor="cb-checked">Checked — pathology confirmed</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Checkbox id="cb-disabled" disabled />
      <Label htmlFor="cb-disabled" style={{ color: 'var(--muted-foreground)' }}>
        Disabled — locked case
      </Label>
    </div>
  </div>
);
