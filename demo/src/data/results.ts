// RQ1–RQ3 & RQ5: measured results from outputs/report/ (synced from server).
// RQ4: still pending.

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  placeholder: boolean;
}

export const studyStats = {
  totalLabels: 272_888,
  totalErrors: 86_680,
  overallErrorRate: 0.3176,
  aurocScln: 0.648,
  auprcScln: 0.469,
  auprcRandomBaseline: 0.3176,
};

export const rq1Data = {
  title: 'RQ1: Error Modes',
  question: 'Do AI-assisted annotation errors differ from Human-only errors?',
  answer:
    'Overall FDER is similar across conditions (**32.9%** AI-assisted vs **31.5%** human-only), but the **error mix shifts**: AI-assisted labels carry more **bbox errors and false positives**, while human-only has slightly more **class errors** and **misses**.',
  overallFder: {
    labels: ['Human-only', 'AI-assisted', 'AI + Confidence'],
    values: [31.5, 32.9, 30.8],
  },
  conditions: [
    { key: 'human_only', labels: 93_715, errors: 29_548, fder: 31.5 },
    { key: 'ai_assisted', labels: 90_345, errors: 29_748, fder: 32.9 },
    { key: 'ai_assisted_confidence', labels: 88_828, errors: 27_384, fder: 30.8 },
  ],
  fderByCondition: {
    labels: ['FDER-box', 'FDER-class', 'FDER-miss', 'FDER-fp', 'FDER-dup'],
    humanOnly: [12.0, 4.0, 0.2, 10.3, 1.2],
    aiAssisted: [13.9, 3.8, 0.3, 10.1, 1.2],
    aiAssistedConf: [11.5, 4.1, 0.2, 10.0, 1.2],
  },
  placeholder: false,
};

export const rq2Data = {
  title: 'RQ2: AI Error Inheritance',
  question: 'When AI gives a wrong suggestion, do humans inherit the same error — especially at high confidence?',
  answer:
    'Among final labels linked to a wrong AI suggestion, **72.5%** keep the **same error type**. This rises from **66.4%** (AI conf 0.25–0.50) to **87.5%** (conf 0.75–1.00) — high-confidence wrong suggestions are **more likely to be inherited unchanged**.',
  inheritanceByConfidence: {
    labels: ['0.25–0.50', '0.50–0.75', '0.75–1.00'],
    sameErrorInherited: [66.4, 72.6, 87.5],
    aiWrongRate: [43.3, 18.9, 6.0],
  },
  summary: {
    sourceLinkedFinalLabels: 51_633,
    fromWrongAi: 8_691,
    sameErrorInherited: 6_298,
    overallInheritanceRate: 72.5,
  },
  placeholder: false,
};

export interface ReviewPolicyRow {
  name: string;
  auprc: number | null;
  precisionAt1: number;
  precisionAt5: number;
  recallAt5: number;
  recallAt10: number;
  recallAt20: number;
}

export const rq3Data = {
  title: 'RQ3: SCLNScore vs Review Strategies',
  question: 'Under a limited review budget, does SCLNScore beat traditional re-review strategies?',
  answer:
    'SCLNScore reaches **AUPRC 0.469** (AUROC **0.648**). At **P@5%** it scores **0.595** vs **0.317** random — while **high-confidence review collapses** (P@1% **0.021**). High-loss / Confident Learning rank by oracle error labels and are **not deployable**; SCLNScore is the best practical policy among blind methods.',
  sclnMetrics: {
    auroc: studyStats.aurocScln,
    auprc: studyStats.auprcScln,
    randomAuprcBaseline: studyStats.auprcRandomBaseline,
  },
  policies: [
    {
      name: 'Random',
      auprc: null,
      precisionAt1: 0.314,
      precisionAt5: 0.317,
      recallAt5: 0.05,
      recallAt10: 0.1,
      recallAt20: 0.2,
    },
    {
      name: 'Low-confidence',
      auprc: null,
      precisionAt1: 0.325,
      precisionAt5: 0.321,
      recallAt5: 0.05,
      recallAt10: 0.101,
      recallAt20: 0.2,
    },
    {
      name: 'High-confidence',
      auprc: null,
      precisionAt1: 0.021,
      precisionAt5: 0.043,
      recallAt5: 0.007,
      recallAt10: 0.023,
      recallAt20: 0.073,
    },
    {
      name: 'Ensemble disagreement',
      auprc: null,
      precisionAt1: 0.679,
      precisionAt5: 0.573,
      recallAt5: 0.09,
      recallAt10: 0.159,
      recallAt20: 0.277,
    },
    {
      name: 'SCLNScore',
      auprc: studyStats.auprcScln,
      precisionAt1: 0.734,
      precisionAt5: 0.595,
      recallAt5: 0.094,
      recallAt10: 0.175,
      recallAt20: 0.32,
    },
    {
      name: 'High-loss',
      auprc: null,
      precisionAt1: 1.0,
      precisionAt5: 1.0,
      recallAt5: 0.157,
      recallAt10: 0.315,
      recallAt20: 0.63,
    },
    {
      name: 'Confident learning',
      auprc: null,
      precisionAt1: 1.0,
      precisionAt5: 1.0,
      recallAt5: 0.157,
      recallAt10: 0.315,
      recallAt20: 0.63,
    },
  ] satisfies ReviewPolicyRow[],
  placeholder: false,
};

export const rq4Data = {
  title: 'RQ4: Feature Importance (Ablation)',
  question: 'Which factors matter most for detecting AI-induced label noise?',
  answer:
    'Removing **human interaction-trace features** causes the **largest drop in AUPRC**, followed by AI confidence / error type and model disagreement. **Human–AI interaction signals are the key** to identifying AI-contaminated labels.',
  ablation: {
    full: 0.49,
    groups: [
      { name: 'w/o Human trace', auprc: 0.34, drop: 0.15 },
      { name: 'w/o AI features', auprc: 0.41, drop: 0.08 },
      { name: 'w/o Object', auprc: 0.45, drop: 0.04 },
      { name: 'w/o Scene', auprc: 0.46, drop: 0.03 },
      { name: 'w/o Interface', auprc: 0.47, drop: 0.02 },
    ],
  },
  placeholder: true,
};

export interface TransferMetric {
  label: string;
  bddInDomain: number;
  bddToNuImages: number;
  /** When true, values are error rates in percent (e.g. 31.8). */
  isPercent?: boolean;
}

export const rq5Data = {
  title: 'RQ5: Cross-Dataset Transfer',
  question: 'Can SCLNScore trained on BDD100K transfer to other datasets?',
  answer:
    'After transfer to nuImages, ranking metrics decrease: AUROC **0.665 → 0.607**, AUPRC **0.472 → 0.418**, R@10% **0.174 → 0.126**. nuImages error rate is **30.8%** (random AUPRC baseline); transferred AUPRC **0.418** is **11.0 pp above** that baseline — without retraining, SCLNScore still ranks erroneous labels ahead of random review.',
  nuImagesImages: 9_752,
  metrics: [
    { label: 'Err. rate', bddInDomain: 31.8, bddToNuImages: 30.8, isPercent: true },
    { label: 'AUROC', bddInDomain: 0.665, bddToNuImages: 0.607 },
    { label: 'AUPRC', bddInDomain: 0.472, bddToNuImages: 0.418 },
    { label: 'R@10%', bddInDomain: 0.174, bddToNuImages: 0.126 },
  ] satisfies TransferMetric[],
  placeholder: false,
};

export const benchmarkStats = {
  annotators: 370,
  images: 100_000,
  conditions: 3,
  numClasses: 8,
  traceFields: [
    'action_type',
    'review_time',
    'bbox_edit_distance',
    'ai_final_iou',
    'ai_confidence',
    'class_changed',
    'ai_error_type',
    'final_correctness',
  ],
  classes: [
    'car',
    'pedestrian',
    'rider',
    'bus',
    'truck',
    'motorcycle',
    'traffic light',
    'traffic sign',
  ],
  placeholder: false,
};

export const isPlaceholder = false;
