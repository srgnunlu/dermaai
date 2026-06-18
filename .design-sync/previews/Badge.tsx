import { Badge } from 'corioscan-ui';

export const Variants = () => (
  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
    <Badge variant="destructive">High risk</Badge>
    <Badge variant="default">Reviewed</Badge>
    <Badge variant="secondary">Pending</Badge>
    <Badge variant="outline">Draft</Badge>
    <Badge variant="destructive">Urgent</Badge>
    <Badge variant="default">Approved</Badge>
    <Badge variant="secondary">In progress</Badge>
    <Badge variant="outline">Archived</Badge>
  </div>
);

export const CaseStatusBadges = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: 'var(--muted-foreground)', width: 160 }}>Lesion #A-1042</span>
      <Badge variant="destructive">High risk</Badge>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: 'var(--muted-foreground)', width: 160 }}>Lesion #B-0391</span>
      <Badge variant="secondary">Pending review</Badge>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: 'var(--muted-foreground)', width: 160 }}>Lesion #C-0218</span>
      <Badge variant="default">Cleared</Badge>
    </div>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: 'var(--muted-foreground)', width: 160 }}>Lesion #D-0774</span>
      <Badge variant="outline">Draft</Badge>
    </div>
  </div>
);
