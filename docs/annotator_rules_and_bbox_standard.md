# Autonomous Driving 2D Object Detection Annotation Rules and Bounding-Box Standards

Version: v1.0  
Applies to: BDD100K / nuImages autonomous-driving 2D object-detection annotation studies  
Audience: annotators, trainers, quality reviewers

## 1. Annotator requirements

Annotators must:

1. Use a desktop browser reliably to complete image annotation tasks.
2. Distinguish common road objects: vehicles, pedestrians, riders, traffic lights, and traffic signs.
3. Draw axis-aligned bounding boxes to a consistent standard—no arbitrary expansion, shrinkage, or missed targets.
4. Use a unique, fixed participant ID; do not share IDs.
5. Not discuss specific images or task strategy with other annotators during the study.
6. Not use external detectors, auto-labeling tools, or scripts.
7. Log issues and contact the researcher if an image fails to load, a class is unclear, or the UI breaks—do not submit blindly.

Recommended training flow:

1. Read this document.
2. View the three temporary demo interfaces.
3. Complete 5–10 practice images.
4. Have a reviewer check for missed labels, class errors, box offset, and duplicates.
5. Enter formal annotation only after passing practice.

## 2. Study confidentiality and conduct

Annotators need only know the task is a study of annotation quality for autonomous-driving images. Do not explain finer hypotheses, model risk scores, or the true comparison across conditions.

Annotators must:

1. Judge each image independently; do not guess why reference boxes are shown or hidden.
2. If reference boxes appear, review each one—they may be wrong.
3. If no reference boxes appear, label all specified classes from the raw image.
4. Not skip small or distant targets for speed.
5. Not ignore obvious class or location errors because a box looks “close enough.”
6. Submit only after finishing each image; submission advances to the next image.

## 3. Annotation workflow

1. Open the annotation system.
2. Enter the assigned participant ID.
3. Click **Resume / Start next image**.
4. Complete annotation per the current interface:
   - **From scratch**: draw boxes on a blank image.
   - **Review references**: check existing reference boxes; edit, delete, or add.
   - **References + confidence**: same as above, with confidence scores visible.
5. Check the object list for missed labels, wrong classes, or duplicate boxes.
6. Click **Submit and continue**.
7. To leave temporarily, click **Pause timer**; on return, click **Resume timer**.

The system auto-saves unsubmitted progress. Using the same participant ID restores the last incomplete image.

## 4. Classes to annotate

Label only these 8 classes. Do not label anything outside the list.

| Class | Display name | Notes |
|---|---|---|
| car | Car | Sedans, SUVs, vans, small passenger vehicles |
| pedestrian | Pedestrian | People standing or walking, not riding |
| rider | Rider | People on bicycles, motorcycles, or e-bikes; follow UI guidance when person and vehicle overlap |
| bus | Bus | Buses and coaches |
| truck | Truck | Cargo vans, box trucks, construction vehicles, large transporters |
| motorcycle | Motorcycle | Motorcycles and e-motorcycles; label person and bike separately when clearly separable |
| traffic light | Traffic light | Signal heads, arrow lights, lamp assemblies |
| traffic sign | Traffic sign | Speed, regulatory, warning, and guide road signs |

Do **not** label:

1. Lane markings, curbs, buildings, trees, lamp posts, guardrails.
2. Distant blobs too blurry to classify.
3. Targets with only a few pixels at the image edge when class is uncertain.
4. Reflections, shadows, ads, or graphics on vehicle bodies.
5. Objects outside the 8 classes (e.g., bicycles alone, animals, generic street lights, cones).

## 5. General bounding-box principles

Boxes must tightly fit the **visible** outer contour using axis-aligned rectangles.

Requirements:

1. Box only visible portions; do not infer occluded regions.
2. Stay close to edges; avoid large background margins.
3. Do not crop off the main body of the target.
4. One real object → one box.
5. Do not merge adjacent objects into one box.
6. Both position and class must be correct.
7. Adjust reference boxes that are clearly too large, too small, misaligned, or on the wrong object.

Acceptable box:

1. Main body fully inside the box.
2. Minimal background inside the box.
3. Top/bottom/left/right edges follow visible contour.
4. No duplicate boxes on the same object.
5. Correct class.

## 6. Occlusion, truncation, and hard cases

**Occluded targets**

1. Box visible parts only.
2. Do not hallucinate occluded extent.
3. Label if enough is visible to judge class.
4. Skip if too little is visible to classify.

**Edge-truncated targets**

1. Label visible portion if class is clear.
2. Box may touch the image border.
3. Do not include area outside the image.

**Small / distant targets**

1. Label when class is identifiable.
2. Keep boxes tight even when small.
3. Skip when too small to classify reliably.

**Blur, night, rain**

1. Judge from visible pixels only.
2. Label when class is clear.
3. Skip or ask QA when class is unclear.

## 7. Per-class box standards

### 7.1 Car

Include visible body: front, rear, roof, and wheels where visible.

Notes:

1. Exclude shadows, glare, and extra background beyond trailers.
2. Separate boxes for adjacent vehicles.
3. Occluded vehicles: visible parts only.
4. Roof racks may be included if part of the visible silhouette.

### 7.2 Pedestrian

Box visible head, torso, and limbs.

Notes:

1. Handheld objects usually excluded unless inseparable from the body.
2. Separate boxes for nearby pedestrians.
3. Do not label riders as pedestrian—use **rider**.

### 7.3 Rider

People on bicycles, motorcycles, or e-bikes.

Notes:

1. If only **rider** is available, box the visible person.
2. If person and motorcycle are both clear, motorcycle may be labeled **motorcycle** separately.
3. Do not include large road or vehicle background.

### 7.4 Bus

Box the full visible bus/coach body.

Notes:

1. Distinguish from truck via windows, doors, and vehicle role.
2. Partial visibility is OK when class is clear.

### 7.5 Truck

Box visible bodies of cargo vans, box trucks, and work trucks.

Notes:

1. Small vans and box trucks → **truck**, not **car**.
2. Articulated rigs: one **truck** if clearly connected; split if separated per QA guidance.

### 7.6 Motorcycle

Box the motorcycle body.

Notes:

1. Visible rider → **rider**; bike → **motorcycle**.
2. Do not merge rider and bike into one motorcycle box.
3. Partial occlusion OK when class is clear.

### 7.7 Traffic light

Box visible signal head / lamp assembly.

Notes:

1. Usually exclude the pole.
2. Separate boxes for independent heads.
3. Label small lights when identifiable.
4. Arrow signals are **traffic light**.

### 7.8 Traffic sign

Box the visible sign face.

Notes:

1. Usually exclude the pole.
2. Separate adjacent signs with clear boundaries.
3. Speed, regulatory, warning, and guide signs count.
4. Billboards, shop signs, and license plates do not.

## 8. Reference-box review

When reference boxes appear, review each one.

**Keep** when:

1. Class is correct.
2. Box is on the right object.
3. Position roughly fits visible bounds.
4. Not a duplicate.

**Edit** when:

1. Box is on a neighboring object.
2. Box is too large (extra background or other objects).
3. Box is too small (crops main body).
4. Wrong class.
5. Multiple boxes on one object—keep the best, delete duplicates.

**Delete** when:

1. Box on a non-existent object.
2. Box on a non-target class.
3. Box on shadow, glare, ad, or road marking.
4. Duplicate of another box on the same object.

**Add** when:

1. Target present but no reference box.
2. Reference missed small, distant, or partially occluded targets.
3. Multiple objects incorrectly merged—split into separate boxes.

## 9. Common errors

**Serious**

1. Missing obvious targets.
2. Confusing car/truck or bus/truck.
3. Labeling riders as pedestrians.
4. Confusing traffic lights and signs.
5. Merging multiple objects into one box.
6. Keeping clearly wrong reference boxes.
7. Boxing non-existent objects.

**Minor**

1. Slightly loose or tight boxes with clear target.
2. Edges not fully tight.
3. Missing small low-visibility targets.

**Duplicate**

1. Two+ boxes on one object.
2. Keeping a reference box and adding a corrected duplicate without deleting the old one.

## 10. Pre-submit checklist

Before each submit:

1. Only the 8 allowed classes used.
2. No missed obvious vehicles, pedestrians, riders, lights, or signs.
3. Each box fits visible contour.
4. Each class is correct.
5. No duplicate boxes.
6. All reference boxes reviewed.
7. No spurious or irrelevant boxes.

## 11. Pause and resume

To step away:

1. Click **Pause timer**.
2. Do not change participant ID.
3. Click **Resume timer** when back.
4. If the browser closed, reopen, enter the same ID, click **Resume / Start next image**.

Recovery rules:

1. Unsubmitted work restores by participant ID.
2. IDs must be unique and fixed.
3. Two people cannot share one ID.
4. Do not switch IDs mid-study.

## 12. QA and pass criteria

Researchers should:

1. Require 5–10 practice images per annotator.
2. Start formal work only after practice passes.
3. Spot-check 5–10% of submissions in production.
4. Increase sampling for high-risk annotators.

Suggested pass thresholds:

1. Obvious miss rate &lt; 5%.
2. Serious class-error rate &lt; 3%.
3. Duplicate-box rate &lt; 3%.
4. Large offset / wrong-object rate &lt; 5%.
5. Correct use of pause, resume, and submit.

Pause formal work and retrain annotators with repeated serious errors.

## 13. Recruitment record fields

| Field | Description |
|---|---|
| annotator_id | Unique participant ID |
| training_passed | Passed practice QA |
| training_images | Number of practice images |
| formal_start_time | Formal start time |
| formal_end_time | Formal end time |
| notes | Issues, equipment problems, QA notes |

Do not store unnecessary PII in the annotation system. Store names, contact, or payment info separately from annotation data.

## 14. Training demo URLs

For annotator training only:

1. Three-condition comparison: `/demo/examples`
2. Practice UI: `/demo/practice`

These pages do not claim real tasks, accept submissions, or write to the database.

## 15. Internal reminder for researchers

If this project requires IRB, course, or employment review, follow your institution’s consent, data-protection, and compensation policies. This document defines annotation standards only—it does not replace ethics review or employment agreements.
