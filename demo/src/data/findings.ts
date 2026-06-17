export interface Finding {
  id: string;
  title: string;
  value: string;
  description: string;
  placeholder: boolean;
}

// Top four headline findings for the Overview grid (RQ1, RQ2, RQ3).
export const findings: Finding[] = [
  {
    id: 'speed-accuracy',
    title: 'No Accuracy Gain',
    value: '32.9% vs 31.5%',
    description:
      'AI-assisted **final error rate (FDER)** is not lower than human-only — suggestions did **not improve** label accuracy overall.',
    placeholder: false,
  },
  {
    id: 'inheritance',
    title: 'Error Inheritance',
    value: '66% → 88%',
    description:
      'When AI was wrong, humans kept the **same error type** in **72.5%** of cases — rising from **66%** (low AI conf) to **88%** (high conf).',
    placeholder: false,
  },
  {
    id: 'scln-random',
    title: 'SCLNScore vs Random',
    value: '59.5% vs 31.7%',
    description:
      'At a **5% review budget**, SCLNScore **Precision@K** nearly **doubles** random sampling.',
    placeholder: false,
  },
  {
    id: 'auprc',
    title: 'SCLNScore Ranking',
    value: 'AUPRC 0.469',
    description:
      'Global label ranking quality (**AUROC 0.648**), versus **0.318** random baseline (positive rate).',
    placeholder: false,
  },
];

export const isPlaceholder = false;
