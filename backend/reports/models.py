import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


def generate_reference_code():
    """Short, human-shareable reference code, e.g. CR-A1B2C3."""
    return f"CR-{uuid.uuid4().hex[:6].upper()}"


class Report(models.Model):
    CATEGORY_CHOICES = [
        ("roads", "Roads"),
        ("water", "Water"),
        ("electricity", "Electricity"),
        ("waste", "Waste"),
        ("public_safety", "Public Safety"),
        ("other", "Other"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("acknowledged", "Acknowledged"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
        ("closed", "Closed"),
    ]

    reference_code = models.CharField(
        max_length=12, unique=True, default=generate_reference_code, editable=False
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(
        max_length=5000,
        help_text="Detailed description of the issue"
    )
    latitude = models.FloatField(
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)],
        help_text="Latitude must be between -90 and 90"
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)],
        help_text="Longitude must be between -180 and 180"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference_code} ({self.get_category_display()}) - {self.get_status_display()}"


class ReportPhoto(models.Model):
    report = models.ForeignKey(Report, related_name="photos", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="report_photos/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.report.reference_code}"
