import { Slider } from 'corioscan-ui';

export const MagnificationLevel = () => (
  <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Magnification</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>40×</span>
    </div>
    <Slider defaultValue={[40]} min={10} max={100} step={5} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>10×</span>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>100×</span>
    </div>
  </div>
);

export const RiskThresholdRange = () => (
  <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Risk filter range</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>0.20 – 0.80</span>
    </div>
    <Slider defaultValue={[20, 80]} min={0} max={100} step={1} />
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>0.0</span>
      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>1.0</span>
    </div>
  </div>
);
