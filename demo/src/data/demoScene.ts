// Real demo scene: a BDD100K frame with YOLOv8 nano pre-annotations.
import boxStyle from '../../box_style.json';
import { publicPath } from '../publicPath';
// Boxes and confidences are the real model outputs from
// outputs/bdd100k/yolo11_predictions.jsonl (image_external_id 0000f77c-6257be58).
// Unlike the placeholder metrics, these are genuine AI suggestions.

export interface SceneBox {
  id: number;
  category: string;
  confidence: number;
  // [x, y, width, height] in image pixel coordinates
  bbox: [number, number, number, number];
}

export const demoScene = {
  source: 'BDD100K',
  externalId: '0000f77c-6257be58',
  imagePath: publicPath('demo-assets/0000f77c-6257be58.jpg'),
  width: 1280,
  height: 720,
  model: 'YOLOv8 nano',
  // Real YOLOv8 nano detections for this frame.
  boxes: [
    { id: 1, category: 'car', confidence: 0.913, bbox: [59.3, 251.8, 304.5, 236.1] },
    { id: 2, category: 'car', confidence: 0.788, bbox: [504.7, 224.8, 405.7, 215.6] },
    { id: 3, category: 'traffic light', confidence: 0.772, bbox: [1125.4, 137.8, 35.9, 72.3] },
    { id: 4, category: 'traffic light', confidence: 0.645, bbox: [1164.3, 137.9, 31.9, 70.9] },
    { id: 5, category: 'car', confidence: 0.482, bbox: [4.9, 560.7, 1268.6, 151.1] },
  ] as SceneBox[],
};

// Color per class — shared with flowchart generator (demo/box_style.json).
export const classColors: Record<string, string> = boxStyle.classColors;

export const boxStyleTokens = boxStyle;

export function classColor(category: string): string {
  return classColors[category] ?? '#3b82f6';
}
