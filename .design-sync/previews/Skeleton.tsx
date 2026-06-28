import { Skeleton } from 'corioscan-ui';

export const CaseCardLoading = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 320 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Skeleton style={{ height: 48, width: 48, borderRadius: 9999 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <Skeleton style={{ height: 14, width: '70%' }} />
        <Skeleton style={{ height: 12, width: '50%' }} />
      </div>
    </div>
    <Skeleton style={{ height: 12, width: '100%' }} />
    <Skeleton style={{ height: 12, width: '85%' }} />
    <Skeleton style={{ height: 12, width: '60%' }} />
  </div>
);

export const ReportListLoading = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 400 }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Skeleton style={{ height: 40, width: 40, borderRadius: 6 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <Skeleton style={{ height: 14, width: '65%' }} />
          <Skeleton style={{ height: 12, width: '40%' }} />
        </div>
        <Skeleton style={{ height: 22, width: 60, borderRadius: 9999 }} />
      </div>
    ))}
  </div>
);
