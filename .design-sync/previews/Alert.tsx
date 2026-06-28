import { Alert, AlertTitle, AlertDescription } from 'corioscan-ui';
import { Info, TriangleAlert } from 'lucide-react';

export const InfoAlert = () => (
  <div style={{ width: 480 }}>
    <Alert>
      <Info />
      <AlertTitle>Specialist review recommended</AlertTitle>
      <AlertDescription>
        This lesion has a dermoscopy score of 7. Based on the ABCDE criteria,
        referral to a dermatologist within two weeks is advised.
      </AlertDescription>
    </Alert>
  </div>
);

export const DestructiveAlert = () => (
  <div style={{ width: 480 }}>
    <Alert variant="destructive">
      <TriangleAlert />
      <AlertTitle>High-risk lesion detected</AlertTitle>
      <AlertDescription>
        AI analysis flagged asymmetric border, irregular pigmentation, and diameter
        &gt; 6 mm. Biopsy is strongly recommended. Do not dismiss without clinical review.
      </AlertDescription>
    </Alert>
  </div>
);
