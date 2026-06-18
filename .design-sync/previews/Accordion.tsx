import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from 'corioscan-ui';

export const PatientFAQ = () => (
  <Accordion type="single" collapsible defaultValue="item-1" style={{ width: 520 }}>
    <AccordionItem value="item-1">
      <AccordionTrigger>How is the skin-lesion risk score calculated?</AccordionTrigger>
      <AccordionContent>
        The risk score is derived from a deep-learning model trained on over 200,000
        dermoscopy images. It evaluates asymmetry, border irregularity, colour
        variation, diameter estimate, and evolving features (ABCDE criteria).
        Scores above 0.7 are flagged as high risk and trigger a specialist referral
        recommendation. The score supplements, but does not replace, clinical judgement.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Is my patient data kept private?</AccordionTrigger>
      <AccordionContent>
        All images are encrypted in transit (TLS 1.3) and at rest (AES-256). Data
        is stored within the EU and processed under KVKK and GDPR frameworks.
        De-identified images may be used to improve model accuracy only with
        explicit institutional consent. No data is sold to third parties.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>When should I refer a patient to a specialist?</AccordionTrigger>
      <AccordionContent>
        Refer immediately for any lesion scoring High (≥0.7) or exhibiting rapid
        growth, bleeding, or ulceration regardless of score. For Moderate scores
        (0.4–0.69), clinical context, patient history, and dermoscopic pattern
        should guide timing. Low-risk lesions may be monitored at routine intervals.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export const ScanFAQ = () => (
  <Accordion type="single" collapsible defaultValue="item-1" style={{ width: 520 }}>
    <AccordionItem value="item-1">
      <AccordionTrigger>What image quality is required for analysis?</AccordionTrigger>
      <AccordionContent>
        Images should be captured with a dermatoscope at 10× magnification or higher.
        Minimum resolution is 1024 × 1024 px. Blurry, overexposed, or partially
        obstructed images will be flagged for re-capture before AI analysis proceeds.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-2">
      <AccordionTrigger>Can multiple lesions be analysed in one session?</AccordionTrigger>
      <AccordionContent>
        Yes. Up to 20 lesions can be uploaded per session. Each lesion is analysed
        independently and receives its own risk score. A session summary report
        lists all lesions ranked by risk level.
      </AccordionContent>
    </AccordionItem>
    <AccordionItem value="item-3">
      <AccordionTrigger>How long does the analysis take?</AccordionTrigger>
      <AccordionContent>
        Standard analysis completes in under 30 seconds per lesion. During peak
        hours processing may extend to 60 seconds. Results are displayed as soon
        as they are ready — you do not need to stay on the page.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);
