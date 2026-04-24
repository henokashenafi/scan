"""
Phase 1 — Convert annotation CSV to Surya fine-tune format.

Reads the CSV, crops each word region from its image,
and saves a HuggingFace dataset with (image, text) pairs.

Usage:
    python prepare_finetune_data.py

Output: /home/yared/Downloads/amharic-ocr with annotation/dataset/surya_dataset/
"""

import os
import csv
from PIL import Image
from datasets import Dataset
from collections import defaultdict

DATASET_DIR = "/home/yared/Downloads/amharic-ocr with annotation/dataset"
IMAGES_DIR  = os.path.join(DATASET_DIR, "images")
CSV_PATH    = os.path.join(DATASET_DIR, "anotation.csv")
OUTPUT_DIR  = os.path.join(DATASET_DIR, "surya_dataset")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Group annotations by filename
annotations = defaultdict(list)
with open(CSV_PATH, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        annotations[row['filename']].append(row)

print(f"Found annotations for {len(annotations)} images")

images_out = []
texts_out  = []
skipped    = 0

for filename, boxes in annotations.items():
    img_path = os.path.join(IMAGES_DIR, filename)
    if not os.path.exists(img_path):
        print(f"  MISSING: {filename}")
        skipped += 1
        continue

    img = Image.open(img_path).convert('RGB')
    w, h = img.size

    for box in boxes:
        text = box['text'].strip()
        if not text:
            continue

        xmin = int(float(box['xmin']) * w)
        ymin = int(float(box['ymin']) * h)
        xmax = int(float(box['xmax']) * w)
        ymax = int(float(box['ymax']) * h)

        # Add small padding around the crop
        pad = 2
        xmin = max(0, xmin - pad)
        ymin = max(0, ymin - pad)
        xmax = min(w, xmax + pad)
        ymax = min(h, ymax + pad)

        # Skip degenerate boxes
        if xmax <= xmin or ymax <= ymin:
            continue

        crop = img.crop((xmin, ymin, xmax, ymax))
        images_out.append(crop)
        texts_out.append(text)

print(f"Total word crops: {len(images_out)}")
print(f"Skipped images: {skipped}")

# Build HuggingFace dataset
dataset = Dataset.from_dict({"image": images_out, "text": texts_out})
dataset.save_to_disk(OUTPUT_DIR)

print(f"\nDataset saved to: {OUTPUT_DIR}")
print(f"Ready for Surya fine-tuning on Google Colab.")
