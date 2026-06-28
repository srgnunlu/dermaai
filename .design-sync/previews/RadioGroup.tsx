import { RadioGroup, RadioGroupItem, Label } from 'corioscan-ui';

export const RiskLevel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 280 }}>
    <Label style={{ marginBottom: 4 }}>AI risk assessment</Label>
    <RadioGroup defaultValue="medium">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="low" id="r-low" />
        <Label htmlFor="r-low">Low — likely benign</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="medium" id="r-medium" />
        <Label htmlFor="r-medium">Medium — monitor in 3 months</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="high" id="r-high" />
        <Label htmlFor="r-high">High — urgent dermatology referral</Label>
      </div>
    </RadioGroup>
  </div>
);

export const BodyRegion = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 280 }}>
    <Label style={{ marginBottom: 4 }}>Body region</Label>
    <RadioGroup defaultValue="trunk">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="face" id="r-face" />
        <Label htmlFor="r-face">Face &amp; scalp</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="trunk" id="r-trunk" />
        <Label htmlFor="r-trunk">Trunk</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="extremities" id="r-extremities" />
        <Label htmlFor="r-extremities">Extremities</Label>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioGroupItem value="acral" id="r-acral" />
        <Label htmlFor="r-acral">Acral (palms &amp; soles)</Label>
      </div>
    </RadioGroup>
  </div>
);
