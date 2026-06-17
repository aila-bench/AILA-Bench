"""Shared bbox overlay rendering — must match demo CaseFrame / focusBoxes in App.tsx."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from PIL import ImageDraw, ImageFont

STYLE_PATH = Path(__file__).resolve().parent / "box_style.json"
STYLE = json.loads(STYLE_PATH.read_text())

LabelPosition = Literal["top", "bottom", "inside_top"]


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def hex_rgb(color: str) -> tuple[int, int, int]:
    color = color.lstrip("#")
    return tuple(int(color[i : i + 2], 16) for i in (0, 2, 4))


def class_color(category: str) -> str:
    return STYLE["classColors"].get(category, STYLE["classColors"]["car"])


def ai_label(category: str, confidence: float | None = None, prefix: str = "AI") -> str:
    if confidence is None:
        return f"{prefix}: {category}"
    return f"{prefix}: {category} {round(confidence * 100)}%"


def gt_label(category: str) -> str:
    return f"GT: {category}"


def final_label(category: str, error_type: str | None = None) -> str:
    if error_type:
        return f"Final: {category} ({error_type})"
    return f"Final: {category}"


def draw_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    color: str,
    *,
    label: str | None = None,
    label_position: LabelPosition = "bottom",
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont | None = None,
) -> None:
    width = STYLE["borderWidthPx"]
    x, y, w, h = bbox
    rgb = hex_rgb(color)
    draw.rectangle((x, y, x + w, y + h), outline=rgb, width=width)

    if not label:
        return

    font = font or load_font(STYLE["labelFontSizePx"])
    pad_x = STYLE["labelPadX"]
    pad_y = STYLE["labelPadY"]
    left, top, right, bottom = draw.textbbox((0, 0), label, font=font)
    tw, th = right - left, bottom - top
    pill_w = tw + pad_x * 2
    pill_h = th + pad_y * 2

    tx = x
    if label_position == "top":
        ty = y - pill_h
    elif label_position == "inside_top":
        ty = y + pad_y
    else:
        ty = y + h + pad_y

    draw.rectangle((tx, ty, tx + pill_w, ty + pill_h), fill=rgb)
    text_y = ty + (pill_h - th) // 2 - top
    draw.text((tx + pad_x, text_y), label, fill=(255, 255, 255), font=font)


def draw_ai_focus_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    category: str,
    confidence: float | None,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
) -> None:
    draw_box(
        draw,
        bbox,
        STYLE["aiFocusColor"],
        label=ai_label(category, confidence),
        label_position="bottom",
        font=font,
    )


def draw_gt_focus_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    category: str,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    *,
    label_position: LabelPosition = "inside_top",
) -> None:
    draw_box(
        draw,
        bbox,
        STYLE["gtColor"],
        label=gt_label(category),
        label_position=label_position,
        font=font,
    )


def draw_gt_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    *,
    labeled: bool = False,
    category: str = "car",
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont | None = None,
    label_position: LabelPosition = "inside_top",
) -> None:
    draw_box(
        draw,
        bbox,
        STYLE["gtColor"],
        label=gt_label(category) if labeled else None,
        label_position=label_position,
        font=font,
    )


def draw_ai_class_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    category: str,
    confidence: float | None,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    *,
    show_prefix: bool = True,
) -> None:
    label = ai_label(category, confidence) if show_prefix else category
    if not show_prefix and confidence is not None:
        label = f"{category} {round(confidence * 100)}%"
    draw_box(
        draw,
        bbox,
        class_color(category),
        label=label,
        label_position="bottom",
        font=font,
    )


def draw_ai_suggestion_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    category: str,
    confidence: float | None,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    *,
    story_focus: bool = False,
) -> None:
    """Uniform AI-layer color; optional yellow highlight for the focal error in panel 2."""
    color = STYLE["aiStoryFocusColor"] if story_focus else STYLE["aiFocusColor"]
    draw_box(
        draw,
        bbox,
        color,
        label=ai_label(category, confidence),
        label_position="bottom",
        font=font,
    )


def draw_final_box(
    draw: ImageDraw.ImageDraw,
    bbox: list[float],
    category: str,
    error_type: str | None,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
) -> None:
    draw_box(
        draw,
        bbox,
        STYLE["finalColor"],
        label=final_label(category, error_type),
        label_position="bottom",
        font=font,
    )
