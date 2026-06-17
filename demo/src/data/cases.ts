// SCLN Case Gallery — real BDD100K frames with real ground-truth, YOLO11, and human final labels.
//
// GT / AI: cases_manifest.json. Human review: cases_human_review.json.

import manifest from './cases_manifest.json';
import humanReviewManifest from './cases_human_review.json';
import { publicPath } from '../publicPath';

export type AIErrorType =
  | 'class'
  | 'localization'
  | 'hallucination'
  | 'missing'
  | 'duplicate'
  | 'wrong_object'
  | 'correct';

export type HumanDecision = 'accept' | 'edit' | 'create' | 'delete' | 'edit_class';

export interface CaseBox {
  class: string;
  bbox: [number, number, number, number];
  confidence?: number;
}

export interface HumanFinalLabel extends CaseBox {
  labelId: number;
  errorType: string;
}

export interface HumanReview {
  taskId: number;
  condition: string;
  decision: HumanDecision;
  reviewTimeMs: number;
  reviewTimeSynthetic: boolean;
  bboxEditDistance: number | null;
  aiFinalIou: number | null;
  final: HumanFinalLabel;
  sourceSuggestionId: number | null;
}

export interface AnnotationCase {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  externalId: string;
  width: number;
  height: number;
  errorType: AIErrorType;
  focus: { gt: CaseBox | null; ai: CaseBox | null; iou: number };
  allBoxes: { gt: CaseBox[]; ai: CaseBox[] };
  humanReview: HumanReview | null;
}

interface ManifestEntry {
  id: string;
  errorType: string;
  image: { file: string; externalId: string; width: number; height: number };
  focus: { gt: CaseBox | null; ai: CaseBox | null; iou: number };
  allBoxes: { gt: CaseBox[]; ai: CaseBox[] };
}

interface HumanReviewEntry {
  case_id: string;
  task_id: number;
  condition: string;
  decision: HumanDecision;
  review_time_ms: number;
  review_time_synthetic: boolean;
  bbox_edit_distance: number | null;
  ai_final_iou: number | null;
  final: {
    label_id: number;
    class: string;
    bbox: [number, number, number, number];
    error_type: string;
  };
  source_suggestion_id: number | null;
}

const copy: Record<string, { title: string; description: string }> = {
  'case-1': {
    title: 'Correct suggestion',
    description:
      'The detector proposes this car with high confidence and near-perfect overlap with ground truth. The annotator accepted the suggestion unchanged — our positive control.',
  },
  'case-2': {
    title: 'Class confusion',
    description:
      'The box is well-placed, but YOLOv8 nano labels this Jeep as a truck. The annotator accepted the suggestion without correcting the class — a class_error versus ground-truth car.',
  },
  'case-3': {
    title: 'Localization error',
    description:
      'Right class, wrong extent: the suggested car box was far too large. The annotator edited the bbox toward the true object size before submitting.',
  },
  'case-4': {
    title: 'Hallucination',
    description:
      'The model proposes a bus where no such object exists in ground truth. The annotator accepted the false positive rather than deleting it — final label is wrong_object.',
  },
  'case-5': {
    title: 'Missing object',
    description:
      'A real car in ground truth that the detector did not flag. With no AI suggestion, the annotator added a new box from scratch.',
  },
};

const humanByCaseId = new Map(
  (humanReviewManifest.cases as HumanReviewEntry[]).map((row) => [row.case_id, row]),
);

function mapHumanReview(entry: HumanReviewEntry): HumanReview {
  return {
    taskId: entry.task_id,
    condition: entry.condition,
    decision: entry.decision,
    reviewTimeMs: entry.review_time_ms,
    reviewTimeSynthetic: entry.review_time_synthetic,
    bboxEditDistance: entry.bbox_edit_distance,
    aiFinalIou: entry.ai_final_iou,
    final: {
      labelId: entry.final.label_id,
      class: entry.final.class,
      bbox: entry.final.bbox,
      errorType: entry.final.error_type,
    },
    sourceSuggestionId: entry.source_suggestion_id,
  };
}

function build(entry: ManifestEntry): AnnotationCase {
  const c = copy[entry.id] ?? { title: entry.id, description: '' };
  const humanEntry = humanByCaseId.get(entry.id);
  return {
    id: entry.id,
    title: c.title,
    description: c.description,
    imagePath: publicPath(`cases/${entry.image.file}`),
    externalId: entry.image.externalId,
    width: entry.image.width,
    height: entry.image.height,
    errorType: entry.errorType as AIErrorType,
    focus: entry.focus,
    allBoxes: entry.allBoxes,
    humanReview: humanEntry ? mapHumanReview(humanEntry) : null,
  };
}

export const cases: AnnotationCase[] = (manifest.cases as unknown as ManifestEntry[]).map(build);

export const viewerCase: AnnotationCase = build(manifest.viewer as unknown as ManifestEntry);

export const humanReviewAvailable = cases.every((c) => c.humanReview != null);

export function formatReviewTime(ms: number): string {
  if (ms >= 60_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function decisionLabel(decision: HumanDecision): string {
  const labels: Record<HumanDecision, string> = {
    accept: 'Accept',
    edit: 'Edit bbox',
    create: 'Add box',
    delete: 'Delete',
    edit_class: 'Edit class',
  };
  return labels[decision];
}
