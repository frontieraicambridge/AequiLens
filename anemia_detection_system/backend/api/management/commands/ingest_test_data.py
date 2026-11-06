"""
Django management command to ingest multimodal test data from CSV.

Reads backend/test_data/clinical_data.csv, creates PatientRecord instances,
attaches corresponding conjunctiva and fingernail images using Django's File wrapper,
and triggers async Celery risk prediction.
"""

import csv
import json
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from api.models import PatientRecord
from api.tasks import predict_anemia_risk


class Command(BaseCommand):
    help = 'Ingests multimodal test data from CSV and attaches dummy images.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-path',
            type=str,
            default=str(settings.BASE_DIR / 'test_data' / 'clinical_data.csv'),
            help='Path to clinical_data.csv',
        )
        parser.add_argument(
            '--skip-celery',
            action='store_true',
            help='Skip dispatching Celery tasks (useful when Redis is not running).',
        )

    def handle(self, *args, **options):
        csv_path = Path(options['csv_path'])
        skip_celery = options['skip_celery']

        if not csv_path.exists():
            raise CommandError(f"Clinical data CSV not found at: {csv_path}")

        images_base = settings.BASE_DIR / 'test_data' / 'images'
        conjunctiva_dir = images_base / 'conjunctiva'
        fingernails_dir = images_base / 'fingernails'

        self.stdout.write(self.style.NOTICE(f"Reading test data from: {csv_path}"))

        created_count = 0

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)

            for row in reader:
                p_id = row['patient_id'].strip()
                s_id = row['sample_id'].strip()
                symptoms = row['symptoms'].strip()

                # Parse JSON array of ICD-10 codes
                try:
                    diagnosis_codes = json.loads(row['icd10_codes'])
                except Exception:
                    diagnosis_codes = [c.strip() for c in row['icd10_codes'].split(',') if c.strip()]

                conj_img_path = conjunctiva_dir / f"{p_id}_{s_id}_conjunctiva.jpg"
                nail_img_path = fingernails_dir / f"{p_id}_{s_id}_fingernail.jpg"

                if not conj_img_path.exists():
                    self.stdout.write(self.style.WARNING(f"Missing conjunctiva image for {p_id}/{s_id} at {conj_img_path}"))
                    continue

                if not nail_img_path.exists():
                    self.stdout.write(self.style.WARNING(f"Missing fingernail image for {p_id}/{s_id} at {nail_img_path}"))
                    continue

                # Instantiate PatientRecord
                record = PatientRecord(
                    patient_id=p_id,
                    sample_id=s_id,
                    diagnosis_codes=diagnosis_codes,
                    symptoms=symptoms,
                    status='PENDING',
                )

                # Attach image files using Django's File wrapper
                with open(conj_img_path, 'rb') as f_conj, open(nail_img_path, 'rb') as f_nail:
                    record.conjunctiva_img.save(conj_img_path.name, File(f_conj), save=False)
                    record.fingernail_img.save(nail_img_path.name, File(f_nail), save=False)
                    record.save()

                created_count += 1
                self.stdout.write(f"Created PatientRecord: {record.id} (Patient: {p_id}, Sample: {s_id})")

                # Dispatch async Celery ML prediction task
                if not skip_celery:
                    try:
                        predict_anemia_risk.delay(str(record.id))
                        record.status = 'PROCESSING'
                        record.save(update_fields=['status'])
                        self.stdout.write(f"  -> Celery prediction task dispatched for {record.id}")
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f"  -> Could not dispatch Celery task (Redis running?): {e}"))

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully ingested {created_count} test patient records!"))

