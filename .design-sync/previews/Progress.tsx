import { Progress } from 'corioscan-ui';

export const ScanUploadStages = () => (
  <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Uploading scan…</span>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>25%</span>
      </div>
      <Progress value={25} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Analysing lesion…</span>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>60%</span>
      </div>
      <Progress value={60} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--primary)' }}>Report ready</span>
        <span style={{ fontSize: 13, color: 'var(--primary)' }}>100%</span>
      </div>
      <Progress value={100} />
    </div>
  </div>
);

export const BatchProcessing = () => (
  <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Session A-1042</span>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>100%</span>
      </div>
      <Progress value={100} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Session A-1043</span>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>72%</span>
      </div>
      <Progress value={72} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Session A-1044</span>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>0%</span>
      </div>
      <Progress value={0} />
    </div>
  </div>
);
