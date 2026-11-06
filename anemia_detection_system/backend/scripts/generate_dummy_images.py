"""
Script to generate synthetic placeholder images for testing the Anemia Detection System.

Reads backend/test_data/clinical_data.csv and generates 224x224 solid-colored
placeholder JPEG images with text annotations for conjunctiva and fingernail beds.
"""

import csv
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Set up paths relative to the script location
SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
TEST_DATA_DIR = BACKEND_DIR / 'test_data'
CSV_PATH = TEST_DATA_DIR / 'clinical_data.csv'
CONJUNCTIVA_DIR = TEST_DATA_DIR / 'images' / 'conjunctiva'
FINGERNAILS_DIR = TEST_DATA_DIR / 'images' / 'fingernails'


def create_annotated_image(filename: Path, base_color: tuple, title_text: str, subtitle_text: str):
    """
    Creates a 224x224 RGB image with colored background and centered text labels.
    """
    img = Image.new('RGB', (224, 224), color=base_color)
    draw = ImageDraw.Draw(img)

    # Use default bitmap font
    font = ImageFont.load_default()

    # Draw border outline
    draw.rectangle([(2, 2), (221, 221)], outline=(70, 70, 70), width=2)

    # Draw text labels
    draw.text((15, 70), title_text, fill=(20, 20, 20), font=font)
    draw.text((15, 100), subtitle_text, fill=(50, 50, 50), font=font)
    draw.text((15, 130), "224x224 • Multimodal", fill=(80, 80, 80), font=font)

    img.save(filename, format='JPEG', quality=95)
    print(f"Generated: {filename.name}")


def generate_all_images():
    if not CSV_PATH.exists():
        print(f"Error: CSV file not found at {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    CONJUNCTIVA_DIR.mkdir(parents=True, exist_ok=True)
    FINGERNAILS_DIR.mkdir(parents=True, exist_ok=True)

    with open(CSV_PATH, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            p_id = row['patient_id'].strip()
            s_id = row['sample_id'].strip()

            # Conjunctiva placeholder (soft pinkish-red mucosal hue)
            conj_filename = CONJUNCTIVA_DIR / f"{p_id}_{s_id}_conjunctiva.jpg"
            create_annotated_image(
                filename=conj_filename,
                base_color=(235, 180, 180),
                title_text=f"CONJUNCTIVA",
                subtitle_text=f"ID: {p_id} / {s_id}",
            )

            # Fingernail placeholder (soft beige-tan keratin hue)
            nail_filename = FINGERNAILS_DIR / f"{p_id}_{s_id}_fingernail.jpg"
            create_annotated_image(
                filename=nail_filename,
                base_color=(240, 215, 195),
                title_text=f"FINGERNAIL",
                subtitle_text=f"ID: {p_id} / {s_id}",
            )

            count += 1

    print(f"\nSuccessfully generated {count * 2} test images across conjunctiva and fingernails folders.")


if __name__ == '__main__':
    generate_all_images()

