import { Label, Textarea } from 'corioscan-ui';

export const WithLabel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 340 }}>
    <Label htmlFor="clinical-notes">Clinical notes</Label>
    <Textarea
      id="clinical-notes"
      placeholder="Describe lesion characteristics: border, colour, diameter, evolution…"
      style={{ minHeight: 96 }}
    />
  </div>
);

export const States = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 340 }}>
    <Textarea
      placeholder="Differential diagnosis notes…"
      style={{ minHeight: 80 }}
    />
    <Textarea
      defaultValue="Asymmetric pigmented macule, ~6 mm, irregular border. Referred for dermoscopy. ABCDE score: A+B+C. Follow-up in 4 weeks."
      style={{ minHeight: 80 }}
    />
    <Textarea
      placeholder="Report locked after sign-off"
      disabled
      style={{ minHeight: 60 }}
    />
  </div>
);
