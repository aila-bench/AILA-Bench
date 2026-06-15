# AILA-Bench SCLN-Det MVP

End-to-end MVP for SCLN-Det experiments: BDD100K 2D detection import, YOLO11 pre-annotation, human annotation web app, interaction logging, gold-label adjudication, SCLNScore training, and review-policy evaluation.

## Included modules

- **FastAPI backend**: task assignment, image serving, annotation submission, event logging, stats, and artifact downloads.
- **React annotation UI**: three experimental conditions assigned by the backend; annotators never see the true condition name.
- **Experiment scripts**: BDD100K prep, YOLO11 inference, AI suggestion import, feature export, SCLNScore training, review-policy evaluation, and report generation.
- **Tests**: bbox/matching/error types, task-assignment constraints, API behavior, SCLNScore train/eval.

## Current data layout

Default paths:

```bash
data/bdd100k_prepared/bdd100k_images_100k/100k/train
data/bdd100k_prepared/bdd100k_labels/100k/train
outputs/bdd100k/yolo11_predictions.jsonl
```

Default pilot: 300 images × 3 tasks per image (`human_only`, `ai_assisted`, `ai_assisted_confidence`).

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd frontend
npm install
```

## Prepare BDD100K pilot

If official zips are in `data/bdd100k_official/`:

```bash
python -m experiments.prepare_bdd100k --source-dir data/bdd100k_official --output-dir data/bdd100k_prepared --extract
python -m experiments.import_bdd100k \
  --config configs/default.yaml \
  --bdd-labels data/bdd100k_prepared/bdd100k_labels/100k/train \
  --image-root data/bdd100k_prepared/bdd100k_images_100k/100k/train \
  --limit 300 \
  --reset-db
python -m experiments.create_tasks --config configs/default.yaml
python -m experiments.yolo11_pipeline \
  --config configs/default.yaml \
  --dataset bdd100k \
  --split pilot \
  --limit 300 \
  --weights models/yolo11n.pt \
  --output outputs/bdd100k/yolo11_predictions.jsonl
python -m experiments.import_suggestions --config configs/default.yaml --input outputs/bdd100k/yolo11_predictions.jsonl
```

Or use the pipeline script:

```bash
python -m experiments.run_pipeline --dataset bdd100k --limit 300
```

## Run the annotation system

Backend:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001
```

Frontend:

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5174
```

Open:

```text
http://<server-ip>:5174
```

Annotators stay on the **Annotate** tab, enter their participant ID, and click **Resume / Start next image**.

## Generate results after human annotation

```bash
python -m experiments.export_features --config configs/default.yaml --output outputs/features.csv --refresh-db
python -m experiments.train_sclnscore --features outputs/features.csv --output-dir outputs/scln
python -m experiments.evaluate_review --features outputs/scln/features_scored.csv --output-dir outputs/review
python -m experiments.generate_report --features outputs/scln/features_scored.csv --review-metrics outputs/review/review_policy_metrics.csv --output-dir outputs/report
```

Or:

```bash
python -m experiments.run_pipeline --dataset bdd100k --skip-import --skip-yolo --post-annotation
```

## Tests

```bash
python -m pytest
cd frontend
npm run build
```

## Target classes

`car`, `pedestrian`, `rider`, `bus`, `truck`, `motorcycle`, `traffic light`, `traffic sign`

The UI shows English class names; submitted labels and experiment CSVs use the canonical English values above.
