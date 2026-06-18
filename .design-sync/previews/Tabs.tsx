import { Tabs, TabsList, TabsTrigger, TabsContent } from 'corioscan-ui';

export const CaseOverview = () => (
  <Tabs defaultValue="overview" style={{ width: 480 }}>
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="scans">Scans</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">
      <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Patient</span>
          <span style={{ fontSize: 13 }}>Ayşe Kaya · 42 F</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Region</span>
          <span style={{ fontSize: 13 }}>Left upper arm</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Risk score</span>
          <span style={{ fontSize: 13, color: 'var(--destructive)', fontWeight: 500 }}>High — 0.82</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
          Asymmetric pigmented lesion with irregular borders. Dermoscopic features
          suggest atypical network. Referral to dermatologist recommended.
        </p>
      </div>
    </TabsContent>
    <TabsContent value="scans">
      <div style={{ padding: '12px 4px' }}>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
          3 dermoscopy images captured on 14 Jun 2026. Latest scan shows 7.2 mm
          lesion diameter. Previous scan (2 May 2026) measured 6.8 mm — +0.4 mm growth.
        </p>
      </div>
    </TabsContent>
    <TabsContent value="history">
      <div style={{ padding: '12px 4px' }}>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
          First assessed 3 Feb 2025. No prior biopsy on record. ABCDE score has
          trended upward across all three visits.
        </p>
      </div>
    </TabsContent>
  </Tabs>
);

export const ReportTabs = () => (
  <Tabs defaultValue="ai" style={{ width: 480 }}>
    <TabsList>
      <TabsTrigger value="ai">AI Analysis</TabsTrigger>
      <TabsTrigger value="report">Report</TabsTrigger>
    </TabsList>
    <TabsContent value="ai">
      <div style={{ padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <p style={{ fontSize: 13, margin: 0 }}>
          <strong>Model:</strong> DermaAssist v2.1
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
          Confidence: 91% · Differential: melanoma (primary), dysplastic nevus (secondary).
          Recommend excision biopsy for histopathologic confirmation.
        </p>
      </div>
    </TabsContent>
    <TabsContent value="report">
      <div style={{ padding: '12px 4px' }}>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
          PDF report generated 18 Jun 2026, 09:14. Includes ABCDE summary, dermoscopy
          images, and AI differential. Shared with referring physician Dr. Ertuğrul Arslan.
        </p>
      </div>
    </TabsContent>
  </Tabs>
);
