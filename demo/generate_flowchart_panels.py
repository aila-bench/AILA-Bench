#!/usr/bin/env python3
"""Generate flowchart overlay panels — styles from demo/box_style.json."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from PIL import Image, ImageDraw

from box_render import (
    STYLE,
    draw_ai_focus_box,
    draw_ai_suggestion_box,
    draw_final_box,
    draw_gt_box,
    draw_gt_focus_box,
    load_font,
)

ROOT = Path(__file__).resolve().parent
DATA = json.loads((ROOT / "flowchart_data.json").read_text())
NOTATION_EXPORT = ROOT / DATA["notation"]["exportFile"]
REREVIEW_CSV = ROOT / DATA["rereview"]["exportFile"]
NOTATION_OUT = ROOT / "public/flowchart/notation"
REREVIEW_OUT = ROOT / "public/flowchart/rereview"
REREVIEW_OUTPUT_WIDTH = 640
REREVIEW_TARGET_BBOX_PX = 220
LARGE_BBOX_AREA_PX2 = DATA["rereview"].get("largeBboxAreaPx2", 15000)


def bbox_key(bbox: list[float]) -> tuple[float, ...]:
    return tuple(round(v, 1) for v in bbox)


def budget_slug(budget: str) -> str:
    return budget.replace("%", "pct")


def crop_and_scale(img: Image.Image, bbox: list[float]) -> tuple[Image.Image, list[float]]:
    """Crop around bbox and scale so the box is readable in a ~640px-wide flowchart panel."""
    x, y, w, h = bbox
    iw, ih = img.size

    crop_w = max(w * REREVIEW_OUTPUT_WIDTH / REREVIEW_TARGET_BBOX_PX, w * 2.5)
    crop_h = max(h * REREVIEW_OUTPUT_WIDTH / REREVIEW_TARGET_BBOX_PX, h * 2.5)
    crop_size = min(max(crop_w, crop_h), iw, ih)

    cx, cy = x + w / 2, y + h / 2
    x0 = max(0, min(cx - crop_size / 2, iw - crop_size))
    y0 = max(0, min(cy - crop_size / 2, ih - crop_size))
    x1 = min(iw, x0 + crop_size)
    y1 = min(ih, y0 + crop_size)
    x0_i, y0_i = int(x0), int(y0)
    x1_i, y1_i = int(x1), int(y1)

    cropped = img.crop((x0_i, y0_i, x1_i, y1_i))
    local_bbox = [x - x0_i, y - y0_i, w, h]

    scale = REREVIEW_OUTPUT_WIDTH / cropped.width
    new_w = int(round(cropped.width * scale))
    new_h = int(round(cropped.height * scale))
    cropped = cropped.resize((new_w, new_h), Image.LANCZOS)
    local_bbox = [v * scale for v in local_bbox]

    return cropped, local_bbox


def generate_notation(font) -> None:
    notation = json.loads(NOTATION_EXPORT.read_text())
    task = notation["ai_assisted_task"]
    gold = notation["gold_match"]
    focus_ai = task["ai_box"]
    focus_final = task["final_label"]
    focus_gt = gold

    ai_boxes = notation["all_ai_suggestions"]
    gt_boxes = notation["all_gold_boxes"]

    image_path = ROOT / "public/flowchart/notation" / "0062ab5a-54bb129b.jpg"
    NOTATION_OUT.mkdir(parents=True, exist_ok=True)
    base = Image.open(image_path).convert("RGB")

    base.save(NOTATION_OUT / "panel-1-input.jpg", quality=92)

    focus_suggestion_id = task["suggestion_id"]

    img = base.copy()
    draw = ImageDraw.Draw(img)
    for box in ai_boxes:
        draw_ai_suggestion_box(
            draw,
            box["bbox"],
            box["class"],
            box.get("confidence"),
            font,
            story_focus=box["id"] == focus_suggestion_id,
        )
    img.save(NOTATION_OUT / "panel-2-ai-suggestion.jpg", quality=92)

    img = base.copy()
    draw = ImageDraw.Draw(img)
    focus_key = bbox_key(focus_gt["bbox"])
    for box in gt_boxes:
        if bbox_key(box["bbox"]) == focus_key:
            continue
        draw_gt_box(draw, box["bbox"], labeled=False, category=box["class"], font=font)
    draw_gt_box(
        draw,
        focus_gt["bbox"],
        labeled=True,
        category=focus_gt["class"],
        font=font,
        label_position="inside_top",
    )
    img.save(NOTATION_OUT / "panel-3-ground-truth.jpg", quality=92)

    img = base.copy()
    draw = ImageDraw.Draw(img)
    draw_final_box(
        draw,
        focus_final["bbox"],
        focus_final["class"],
        focus_final.get("error_type"),
        font,
    )
    img.save(NOTATION_OUT / "panel-4-final-label.jpg", quality=92)

    img = base.copy()
    draw = ImageDraw.Draw(img)
    draw_ai_focus_box(draw, focus_ai["bbox"], focus_ai["class"], focus_ai["confidence"], font)
    draw_gt_focus_box(draw, focus_gt["bbox"], focus_gt["class"], font)
    img.save(NOTATION_OUT / "panel-focus-gt-ai.jpg", quality=92)

    print(f"Wrote notation panels to {NOTATION_OUT}")


def generate_rereview(font) -> None:
    REREVIEW_OUT.mkdir(parents=True, exist_ok=True)

    with REREVIEW_CSV.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            ext_id = row["image_external_id"]
            budget = row["budget_tier"]
            image_path = REREVIEW_OUT / f"{ext_id}.jpg"
            if not image_path.exists():
                raise FileNotFoundError(
                    f"Missing {image_path}. Fetch from server train/ dir before generating overlays."
                )

            bbox = json.loads(row["bbox"])
            base = Image.open(image_path).convert("RGB")
            bbox_area = float(row.get("bbox_area") or 0)

            full = base.copy()
            full_draw = ImageDraw.Draw(full)
            draw_final_box(full_draw, bbox, row["final_class"], row["error_type"], font)

            slug = budget_slug(budget)
            full_path = REREVIEW_OUT / f"panel-{slug}-full.jpg"
            full.save(full_path, quality=92)

            if bbox_area >= LARGE_BBOX_AREA_PX2:
                overlay = full
            else:
                cropped, local_bbox = crop_and_scale(base, bbox)
                overlay = cropped.copy()
                overlay_draw = ImageDraw.Draw(overlay)
                draw_final_box(overlay_draw, local_bbox, row["final_class"], row["error_type"], font)

            overlay_path = REREVIEW_OUT / f"panel-{slug}-overlay.jpg"
            overlay.save(overlay_path, quality=92)

            score = row["scln_score"]
            rank = row["rank"]
            mode = "full" if bbox_area >= LARGE_BBOX_AREA_PX2 else "crop"
            print(
                f"  {budget} rank {rank} SCLNScore {score} ({mode}) -> {overlay_path.name} ({ext_id})"
            )

    print(f"Wrote re-review overlays to {REREVIEW_OUT}")


def main() -> None:
    font = load_font(STYLE["labelFontSizePx"])
    generate_notation(font)
    generate_rereview(font)
    print(f"box_style.json border={STYLE['borderWidthPx']}px")


if __name__ == "__main__":
    main()
