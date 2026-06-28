import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Button, Badge,
} from 'corioscan-ui';

export const CaseSummary = () => (
  <Card style={{ width: 360 }}>
    <CardHeader>
      <CardTitle>Lesion #A-1042</CardTitle>
      <CardDescription>Captured 18 Jun 2026 · Right forearm</CardDescription>
    </CardHeader>
    <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>Risk estimate</span>
        <Badge variant="destructive">High</Badge>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted-foreground)', margin: 0 }}>
        Asymmetric border with colour variation across three regions. Specialist
        review is recommended within two weeks.
      </p>
    </CardContent>
    <CardFooter style={{ display: 'flex', gap: 8 }}>
      <Button size="sm">Open case</Button>
      <Button size="sm" variant="outline">Dismiss</Button>
    </CardFooter>
  </Card>
);

export const Stat = () => (
  <Card style={{ width: 240 }}>
    <CardHeader>
      <CardDescription>Scans this month</CardDescription>
      <CardTitle style={{ fontSize: 32 }}>128</CardTitle>
    </CardHeader>
    <CardContent>
      <p style={{ fontSize: 13, color: 'var(--success)', margin: 0 }}>+18% vs. last month</p>
    </CardContent>
  </Card>
);
