# Human study runbook

## Researcher setup

1. Confirm BDD100K pilot data, tasks, and YOLO11 reference boxes are ready.

```bash
python -m experiments.prepare_bdd100k --source-dir data/bdd100k_official --output-dir data/bdd100k_prepared --extract
python -m experiments.import_bdd100k --config configs/default.yaml --bdd-labels data/bdd100k_prepared/bdd100k_labels/100k/train --image-root data/bdd100k_prepared/bdd100k_images_100k/100k/train --limit 300 --reset-db
python -m experiments.create_tasks --config configs/default.yaml
python -m experiments.yolo11_pipeline --config configs/default.yaml --dataset bdd100k --split pilot --limit 300 --weights models/yolo11n.pt --output outputs/bdd100k/yolo11_predictions.jsonl
python -m experiments.import_suggestions --config configs/default.yaml --input outputs/bdd100k/yolo11_predictions.jsonl
```

2. To clear existing human submissions and reopen all tasks:

```bash
python -m experiments.reset_annotations --config configs/default.yaml
```

3. Start services.

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8001
```

```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5174
```

## Annotator instructions

Open `http://<server-ip>:5174`, stay on the **Annotate** tab, enter the assigned participant ID, then click **Resume / Start next image**.

For each image:

- Label all visible targets from the class list.
- If reference boxes appear, review each one—edit, delete, or keep as needed.
- If no reference boxes appear, draw boxes from the raw image.
- Use only the 8 classes shown in the UI.
- When the image is complete, click **Submit and continue**.

Do **not** explain AI-induced label noise, SCLNScore, or the true purpose of the three experimental conditions to participants.

## Researcher monitoring

Use the **Researcher** tab for aggregate progress and downloadable artifacts. After collection, run:

```bash
python -m experiments.export_features --config configs/default.yaml --output outputs/features.csv --refresh-db
python -m experiments.train_sclnscore --features outputs/features.csv --output-dir outputs/scln
python -m experiments.evaluate_review --features outputs/scln/features_scored.csv --output-dir outputs/review
python -m experiments.generate_report --features outputs/scln/features_scored.csv --review-metrics outputs/review/review_policy_metrics.csv --output-dir outputs/report
```
