import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { getMergedDiagnoses, getStatusBadge } from './adminUtils';

interface CaseDetailModalProps {
  caseItem: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Renders a single AI model's diagnosis list (Gemini / GPT) with shared styling.
function ModelDiagnoses({
  title,
  accent,
  diagnoses,
}: {
  title: string;
  accent: 'blue' | 'green' | 'orange';
  diagnoses: any[];
}) {
  const tone = {
    blue: {
      border: 'border-blue-300',
      dot: 'bg-blue-600',
      heading: 'text-blue-900',
      bar: 'border-blue-600',
      num: 'bg-blue-600',
      chip: 'bg-blue-100 text-blue-900',
      feature: 'bg-blue-100 text-blue-900 border-blue-300',
    },
    green: {
      border: 'border-green-300',
      dot: 'bg-green-600',
      heading: 'text-green-900',
      bar: 'border-green-600',
      num: 'bg-green-600',
      chip: 'bg-green-100 text-green-900',
      feature: 'bg-green-100 text-green-900 border-green-300',
    },
    orange: {
      border: 'border-orange-300',
      dot: 'bg-orange-600',
      heading: 'text-orange-900',
      bar: 'border-orange-600',
      num: 'bg-orange-600',
      chip: 'bg-orange-100 text-orange-900',
      feature: 'bg-orange-100 text-orange-900 border-orange-300',
    },
  }[accent];

  return (
    <div className="mb-6">
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b-2 ${tone.border}`}>
        <div className={`w-4 h-4 rounded ${tone.dot}`} />
        <h4 className={`text-base font-bold ${tone.heading}`}>{title}</h4>
      </div>
      <div className="space-y-3">
        {diagnoses.slice(0, 5).map((diagnosis: any, index: number) => (
          <div
            key={index}
            className={`border-l-4 ${tone.bar} bg-white p-4 rounded-r-lg shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${tone.num} text-white text-xs font-bold`}
                  >
                    {index + 1}
                  </span>
                  <h5 className="font-bold text-gray-900 text-sm">{diagnosis.name}</h5>
                </div>
              </div>
              <div className="ml-2 text-right">
                <div className={`inline-block px-2 py-1 rounded ${tone.chip} font-semibold text-xs`}>
                  {diagnosis.confidence}%
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{diagnosis.description}</p>

            {diagnosis.keyFeatures && diagnosis.keyFeatures.length > 0 && (
              <div className="mb-2">
                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                  Key Features:
                </span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {diagnosis.keyFeatures.map((feature: string, idx: number) => (
                    <Badge key={idx} className={`${tone.feature} text-xs`}>
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {diagnosis.recommendations && diagnosis.recommendations.length > 0 && (
              <div>
                <span className="font-semibold text-xs text-gray-900 uppercase tracking-wide">
                  Recommendations:
                </span>
                <ul className="list-disc list-inside text-xs text-gray-700 mt-2 space-y-1">
                  {diagnosis.recommendations.map((rec: string, idx: number) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaseDetailModal({ caseItem, open, onOpenChange }: CaseDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Case Details</DialogTitle>
          <DialogDescription>Comprehensive view of case {caseItem?.caseId}</DialogDescription>
        </DialogHeader>

        {caseItem && (
          <div className="space-y-6" data-testid="case-details-content">
            {/* Case Information */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Case Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Case ID:</span> {caseItem.caseId}
                  </p>
                  <p>
                    <span className="font-medium">User:</span> {caseItem.user?.email || 'Unknown'}
                  </p>
                  <p>
                    <span className="font-medium">Patient ID:</span> {caseItem.patientId || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {getStatusBadge(caseItem.status)}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {caseItem.createdAt ? format(new Date(caseItem.createdAt), 'PPpp') : 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Clinical Information</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Lesion Location:</span>{' '}
                    {caseItem.lesionLocation || 'Not specified'}
                  </p>
                  <p>
                    <span className="font-medium">Symptoms:</span>{' '}
                    {caseItem.symptoms || 'None reported'}
                  </p>
                  {caseItem.medicalHistory && caseItem.medicalHistory.length > 0 && (
                    <p>
                      <span className="font-medium">Medical History:</span>{' '}
                      {caseItem.medicalHistory.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dermatologist Diagnosis */}
            {caseItem.dermatologistDiagnosis && (
              <div>
                <h3 className="font-semibold mb-2 text-green-700">Dermatologist Diagnosis</h3>
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Diagnosis:</span>{' '}
                      {caseItem.dermatologistDiagnosis}
                    </p>
                    {caseItem.dermatologistNotes && (
                      <p>
                        <span className="font-medium">Clinical Notes:</span>{' '}
                        {caseItem.dermatologistNotes}
                      </p>
                    )}
                    {caseItem.dermatologistDiagnosedAt && (
                      <p className="text-xs text-muted-foreground">
                        Diagnosed on:{' '}
                        {format(new Date(caseItem.dermatologistDiagnosedAt), 'PPpp')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Case Images */}
            {(caseItem.imageUrls?.length ?? 0) > 0 || caseItem.imageUrl ? (
              <div>
                <h3 className="font-semibold mb-2">
                  Case Image{(caseItem.imageUrls?.length ?? 0) > 1 ? 's' : ''}
                </h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div
                    className={`grid gap-4 ${
                      (caseItem.imageUrls?.length ?? 1) === 1
                        ? 'grid-cols-1'
                        : (caseItem.imageUrls?.length ?? 1) === 2
                          ? 'grid-cols-2'
                          : 'grid-cols-2 sm:grid-cols-3'
                    }`}
                  >
                    {(caseItem.imageUrls && caseItem.imageUrls.length > 0
                      ? caseItem.imageUrls
                      : [caseItem.imageUrl]
                    ).map((imageUrl: string, index: number) => (
                      <div key={index} className="relative">
                        <img
                          src={
                            imageUrl.startsWith('https://storage.googleapis.com')
                              ? `/objects/${imageUrl.split('/.private/')[1]}`
                              : imageUrl
                          }
                          alt={`Case image ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-48 object-contain rounded border border-gray-200"
                          data-testid={`case-image-${index}`}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {(caseItem.imageUrls?.length ?? 1) > 1 && (
                          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                            Image {index + 1}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {/* AI Diagnosis Results */}
            {getMergedDiagnoses(caseItem).length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">AI Diagnosis Results</h3>

                {caseItem?.geminiAnalysis?.diagnoses?.length > 0 && (
                  <ModelDiagnoses
                    title="Gemini 3 Analysis"
                    accent="blue"
                    diagnoses={caseItem.geminiAnalysis.diagnoses}
                  />
                )}

                {caseItem?.openaiAnalysis?.diagnoses?.length > 0 && (
                  <ModelDiagnoses
                    title="GPT-5.5 Analysis"
                    accent="green"
                    diagnoses={caseItem.openaiAnalysis.diagnoses}
                  />
                )}

                {caseItem?.claudeAnalysis?.diagnoses?.length > 0 && (
                  <ModelDiagnoses
                    title="Claude Sonnet 4.6 Analysis"
                    accent="orange"
                    diagnoses={caseItem.claudeAnalysis.diagnoses}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CaseDetailModal;
