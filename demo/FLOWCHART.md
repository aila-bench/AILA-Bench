# Paper flowchart assets

Generated panels and source frames for **Figure 1 (Task & Notation)** and **Figure 2 (Re-review Ranking)**.

## Figure 1 — Task & Notation (`0062ab5a-54bb129b`)

Story: YOLO labels a Jeep as **truck**; the annotator largely accepts it → **class_error** vs ground-truth **car**.

| Panel | File | Overlay |
|---|---|---|
| Input image \(x\) | `public/flowchart/notation/panel-1-input.jpg` | none |
| AI suggestion \(\hat{y}\) | `panel-2-ai-suggestion.jpg` | all YOLO boxes · blue `#2f6fb0` · focal error yellow `#eab308` |
| Ground truth \(y^*\) | `panel-3-ground-truth.jpg` | all GT boxes · solid green `#15803d` |
| Final label \(\tilde{y}\) | `panel-4-final-label.jpg` | human final truck box (task 413) |
| Case gallery reference | `panel-focus-gt-ai.jpg` | GT + AI focus overlay |

Data source: `export/notation_0062ab5a.json` (from `aila_bench.db` via `export_flowchart_data.py`).

Regenerate overlays:

```bash
cd demo
python3 generate_flowchart_panels.py
```

### Box style (single source: `demo/box_style.json`)

Demo (`CaseFrame` / `focusBoxes`) and flowchart (`box_render.py`) share identical tokens:

| Role | Color | Border | Label |
|---|---|---|---|
| GT | `#15803d` | 2px solid | above · `GT: {class}` |
| AI focus (case gallery) | `#2f6fb0` | 2px solid | below · `AI: {class} {NN}%` |
| AI all boxes (demo viewer) | `classColors` | 2px solid | below · `AI: {class} {NN}%` |
| AI all boxes (Figure 1 panel 2) | `#2f6fb0` · focal `#eab308` | 2px solid | below · `AI: {class} {NN}%` |
| Final human (panel 4) | `#c2410c` | 2px solid | below · `Final: {class} ({error})` |

Focus object bbox (1280×720, `[x, y, w, h]`):

- GT car: `[392.8, 262.5, 288.1, 193.4]`
- AI truck (suggestion 883, conf 0.744): `[391.6, 262.3, 286.3, 191.6]`
- Final truck (task 413): `[392.1, 260.5, 288.1, 194.6]`

**Caption:** Final label from a real `ai_assisted` submission (task 413), exported from the database.

**Color logic (Figure 1):** Each panel is one annotation layer — blue = AI \(\hat{y}\), green = GT \(y^*\), orange = human final \(\tilde{y}\). Panel 2 uses uniform blue for all AI boxes **except** the story-focus suggestion (883, `AI: truck 74%`) in yellow `#eab308`, mirroring panel 3 where only the matching GT box is labeled. (The demo website viewer still uses `classColors` for interactive exploration.)

**Warning notation \(A=1\):** same frame, task 414 (`ai_assisted_confidence`), suggestion 883 confidence **0.889** (from `final_label`, not YOLO raw 0.744).

## Figure 2 — Re-review Ranking

**Active export:** `export/rereview_frames_large_bbox.csv` — large final-label boxes (area ≥ 15 000 px²) near each budget cutoff, readable on full 1280×720 frames.

Strict cutoff rows (smallest bbox at rank) remain in `export/rereview_frames.csv` for reference.

| Budget | Rank | SCLNScore | external_id | error_type | final class | bbox (w×h) |
|---|---:|---:|---|---|---|---|
| 1% | 1792 | 0.636 | `0683345e-353c53d1` | correct | car | 428×224 |
| 5% | 8962 | 0.512 | `0eaabe4f-e5b7f441` | class_error | truck | 169×158 |
| 10% | 17926 | 0.459 | `02f94134-4bd5b308` | bbox_error | truck | 177×119 |
| 20% | 35854 | 0.368 | `144ddd02-b8f6bd11` | class_error | truck | 233×175 |

Selection: scan down from cutoff rank (1791 / 8958 / 17917 / 35834); first unique image with bbox area ≥ 15 000 px², rank within +1–20 of cutoff.

Files in `public/flowchart/rereview/`:

| Budget | Source JPG | Overlay | Full frame |
|---|---|---|---|
| 1% | `0683345e-353c53d1.jpg` | `panel-1pct-overlay.jpg` | `panel-1pct-full.jpg` |
| 5% | `0eaabe4f-e5b7f441.jpg` | `panel-5pct-overlay.jpg` | `panel-5pct-full.jpg` |
| 10% | `02f94134-4bd5b308.jpg` | `panel-10pct-overlay.jpg` | `panel-10pct-full.jpg` |
| 20% | `144ddd02-b8f6bd11.jpg` | `panel-20pct-overlay.jpg` | `panel-20pct-full.jpg` |

Large-bbox rows: `panel-*-overlay.jpg` = full frame with final-label box (same as `-full.jpg`). Small-bbox CSV: overlay uses crop + zoom to 640px wide.

**Caption:** Illustrative frames at SCLNScore review-budget cutoffs (1% / 5% / 10% / 20% of ranked labels); ranks stay on the same budget line as strict cutoffs.

## Server export + local sync

On server (requires `outputs/scln/features_scored.csv` + `aila_bench.db`):

```bash
python3 demo/export_flowchart_data.py
```

Sync to local machine:

```bash
rsync -avz tsinghua:/data_hdd/lx20/AILA-Bench/demo/export/ ~/Desktop/AILA-Bench/demo/export/
rsync -avz tsinghua:/data_hdd/lx20/AILA-Bench/demo/export_flowchart_data.py ~/Desktop/AILA-Bench/demo/

for id in 0683345e-353c53d1 0eaabe4f-e5b7f441 02f94134-4bd5b308 144ddd02-b8f6bd11; do
  scp tsinghua:/data_hdd/lx20/AILA-Bench/data/bdd100k_prepared/bdd100k_images_100k/100k/train/${id}.jpg \
    demo/public/flowchart/rereview/
done

cd demo && python3 generate_flowchart_panels.py
```

To regenerate from strict small-bbox cutoffs instead, set `"exportFile": "export/rereview_frames.csv"` in `flowchart_data.json`.
