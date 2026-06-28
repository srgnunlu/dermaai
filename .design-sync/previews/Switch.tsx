import { Switch, Label } from 'corioscan-ui';

export const AIPreScreening = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch id="ai-prescreening" defaultChecked />
      <Label htmlFor="ai-prescreening">Enable AI pre-screening</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch id="auto-report" />
      <Label htmlFor="auto-report">Auto-generate PDF report</Label>
    </div>
  </div>
);

export const SwitchStates = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 300 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch id="sw-on" defaultChecked />
      <Label htmlFor="sw-on">On — dermoscopy overlay active</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch id="sw-off" />
      <Label htmlFor="sw-off">Off — raw image mode</Label>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Switch id="sw-disabled" disabled />
      <Label htmlFor="sw-disabled" style={{ color: 'var(--muted-foreground)' }}>
        Disabled — pending calibration
      </Label>
    </div>
  </div>
);
