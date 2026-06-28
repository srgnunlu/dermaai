import { Avatar, AvatarFallback, AvatarImage } from 'corioscan-ui';

export const FallbackInitials = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
    <Avatar>
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>AY</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>MD</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>OD</AvatarFallback>
    </Avatar>
  </div>
);

export const CaseAssignees = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Avatar>
        <AvatarFallback>SK</AvatarFallback>
      </Avatar>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Dr. Sergen Kanpolat</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Emergency Medicine</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Avatar>
        <AvatarFallback>AY</AvatarFallback>
      </Avatar>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Dr. Ayse Yildiz</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Dermatology</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <Avatar>
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Dr. Mehmet Demir</div>
        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Pathology</div>
      </div>
    </div>
  </div>
);
