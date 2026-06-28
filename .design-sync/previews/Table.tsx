import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
} from 'corioscan-ui';
import { Badge } from 'corioscan-ui';

export const CaseList = () => (
  <div style={{ width: 560 }}>
    <Table>
      <TableCaption>Recent dermoscopy cases — last 30 days</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Case</TableHead>
          <TableHead>Region</TableHead>
          <TableHead>Risk</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>A-1042</TableCell>
          <TableCell>Left upper arm</TableCell>
          <TableCell><Badge variant="destructive">High</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>14 Jun 2026</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>A-1038</TableCell>
          <TableCell>Back — lumbar</TableCell>
          <TableCell><Badge variant="secondary">Low</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>11 Jun 2026</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>A-1031</TableCell>
          <TableCell>Right cheek</TableCell>
          <TableCell><Badge variant="destructive">High</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>05 Jun 2026</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>A-1027</TableCell>
          <TableCell>Left calf</TableCell>
          <TableCell><Badge variant="secondary">Low</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>01 Jun 2026</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

export const PatientScoreTable = () => (
  <div style={{ width: 560 }}>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Lesion count</TableHead>
          <TableHead>Highest risk</TableHead>
          <TableHead>Last scan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>Ayşe Kaya</TableCell>
          <TableCell>3</TableCell>
          <TableCell><Badge variant="destructive">High</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>18 Jun 2026</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>Mehmet Demir</TableCell>
          <TableCell>1</TableCell>
          <TableCell><Badge variant="secondary">Low</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>16 Jun 2026</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ fontWeight: 500 }}>Fatma Yıldız</TableCell>
          <TableCell>5</TableCell>
          <TableCell><Badge variant="destructive">High</Badge></TableCell>
          <TableCell style={{ color: 'var(--muted-foreground)' }}>10 Jun 2026</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);
