"""Export flowchart panel data (notation JSON + re-review CSV). Run from repo root."""
from __future__ import annotations

import csv
import json
import sqlite3
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(__file__).resolve().parent / "export"
NOTATION_EXT = "0062ab5a-54bb129b"
SCORED_CSV = ROOT / "outputs/scln/features_scored.csv"


def bbox_row(r) -> list[float]:
    return [round(float(r["x"]), 1), round(float(r["y"]), 1), round(float(r["width"]), 1), round(float(r["height"]), 1)]


def export_notation(conn: sqlite3.Connection) -> Path:
    img = conn.execute("select * from images where external_id=?", (NOTATION_EXT,)).fetchone()
    if img is None:
        raise SystemExit(f"Image not found: {NOTATION_EXT}")

    image_path = str((ROOT / img["file_name"]).resolve())
    gold = [
        {"class": r["category"], "bbox": bbox_row(r)}
        for r in conn.execute(
            "select category,x,y,width,height from gold_labels where image_id=? order by id",
            (img["id"],),
        )
    ]
    ai_all = [
        {
            "id": r["id"],
            "class": r["category"],
            "bbox": bbox_row(r),
            "confidence": round(float(r["confidence"]), 3) if r["confidence"] is not None else None,
            "ai_error_type": r["ai_error_type"],
        }
        for r in conn.execute(
            "select id,category,x,y,width,height,confidence,ai_error_type from ai_suggestions where image_id=? order by id",
            (img["id"],),
        )
    ]
    s883 = next(a for a in ai_all if a["id"] == 883)

    def final_for(task_id: int, suggestion_id: int = 883):
        fl = conn.execute(
            """select id,category,x,y,width,height,error_type,source_suggestion_id,confidence
               from final_labels where task_id=? and source_suggestion_id=?""",
            (task_id, suggestion_id),
        ).fetchone()
        if fl is None:
            return None
        return {
            "label_id": fl["id"],
            "class": fl["category"],
            "bbox": bbox_row(fl),
            "error_type": fl["error_type"],
            "source_suggestion_id": fl["source_suggestion_id"],
            "confidence": round(float(fl["confidence"]), 3) if fl["confidence"] is not None else None,
        }

    jeep = conn.execute(
        """select category,x,y,width,height from gold_labels
           where image_id=? and category='car' order by width*height desc limit 1""",
        (img["id"],),
    ).fetchone()

    fl414 = final_for(414)
    notation = {
        "image_external_id": NOTATION_EXT,
        "image_path": image_path,
        "width": img["width"],
        "height": img["height"],
        "ai_assisted_task": {
            "task_id": 413,
            "condition": "ai_assisted",
            "review_time_ms": conn.execute("select review_time_ms from annotation_tasks where id=413").fetchone()[0],
            "suggestion_id": 883,
            "ai_box": {
                "class": s883["class"],
                "bbox": s883["bbox"],
                "confidence": s883["confidence"],
            },
            "final_label": final_for(413),
        },
        "gold_match": {"class": jeep["category"], "bbox": bbox_row(jeep)},
        "ai_assisted_confidence_task": {
            "task_id": 414,
            "condition": "ai_assisted_confidence",
            "suggestion_id": 883,
            "confidence": fl414["confidence"] if fl414 else s883["confidence"],
            "ai_box": {
                "class": s883["class"],
                "bbox": s883["bbox"],
                "confidence": s883["confidence"],
            },
            "final_label": fl414,
        },
        "all_ai_suggestions": ai_all,
        "all_gold_boxes": gold,
    }

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "notation_0062ab5a.json"
    path.write_text(json.dumps(notation, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def export_rereview(conn: sqlite3.Connection) -> Path:
    if not SCORED_CSV.exists():
        raise SystemExit(f"Missing {SCORED_CSV}; run train_sclnscore first.")

    scored = pd.read_csv(SCORED_CSV)
    scored = scored[scored["condition"].isin(["ai_assisted", "ai_assisted_confidence"])].copy()
    scored = scored.sort_values("SCLNScore", ascending=False).reset_index(drop=True)
    n = len(scored)

    tiers = [(0.01, "1%"), (0.05, "5%"), (0.10, "10%"), (0.20, "20%")]
    seen_ext: set[str] = set()
    rows_out: list[dict] = []

    for frac, tier in tiers:
        start = max(0, int(n * frac) - 1)
        for idx in range(start, n):
            r = scored.iloc[idx]
            meta = conn.execute(
                "select external_id, file_name from images where id=?",
                (int(r["image_id"]),),
            ).fetchone()
            ext_id = meta["external_id"]
            if ext_id in seen_ext:
                continue

            bbox = None
            if pd.notna(r["label_id"]):
                fl = conn.execute(
                    "select category,x,y,width,height from final_labels where id=?",
                    (int(r["label_id"]),),
                ).fetchone()
                if fl:
                    bbox = bbox_row(fl)

            conf = r.get("source_ai_confidence")
            ai_conf = round(float(conf), 6) if pd.notna(conf) else ""

            rows_out.append(
                {
                    "budget_tier": tier,
                    "rank": idx + 1,
                    "scln_score": round(float(r["SCLNScore"]), 6),
                    "image_external_id": ext_id,
                    "image_path": str((ROOT / meta["file_name"]).resolve()),
                    "label_id": int(r["label_id"]) if pd.notna(r["label_id"]) else "",
                    "task_id": int(r["task_id"]),
                    "error_type": r["error_type"],
                    "ai_confidence": ai_conf,
                    "final_class": r["category"],
                    "bbox": json.dumps(bbox) if bbox else "",
                    "condition": r["condition"],
                }
            )
            seen_ext.add(ext_id)
            break

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "rereview_frames.csv"
    fields = [
        "budget_tier", "rank", "scln_score", "image_external_id", "image_path",
        "label_id", "task_id", "error_type", "ai_confidence", "final_class",
        "bbox", "condition",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows_out)
    return path


def main() -> None:
    conn = sqlite3.connect(ROOT / "aila_bench.db")
    conn.row_factory = sqlite3.Row
    try:
        p1 = export_notation(conn)
        p2 = export_rereview(conn)
    finally:
        conn.close()
    print(f"Wrote {p1}")
    print(f"Wrote {p2}")


if __name__ == "__main__":
    main()
