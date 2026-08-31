from rest_framework import serializers
from .models import Report, ReportPhoto


class ReportPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportPhoto
        fields = ["id", "image", "uploaded_at"]


def validate_image_file(file):
    """Validate image file size and type."""
    # Check file size (max 5 MB)
    max_size = 5 * 1024 * 1024  # 5 MB
    if file.size > max_size:
        raise serializers.ValidationError(
            f"Image file size must not exceed 5 MB. Got {file.size / (1024*1024):.1f} MB."
        )

    # Check MIME type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise serializers.ValidationError(
            f"Unsupported image format. Allowed: JPEG, PNG, WebP, GIF. Got: {file.content_type}"
        )

    return file


class ReportSerializer(serializers.ModelSerializer):
    """Used for listing / public map / status lookup (read-only photos)."""

    photos = ReportPhotoSerializer(many=True, read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "reference_code",
            "category",
            "category_display",
            "description",
            "latitude",
            "longitude",
            "status",
            "status_display",
            "created_at",
            "updated_at",
            "photos",
        ]
        read_only_fields = ["id", "reference_code", "status", "created_at", "updated_at"]


class AdminStatusUpdateSerializer(serializers.ModelSerializer):
    """Used by staff to update a report's status only."""

    class Meta:
        model = Report
        fields = ["status"]


class ReportCreateSerializer(serializers.ModelSerializer):
    """Used for the citizen submission endpoint. Accepts multiple images."""

    images = serializers.ListField(
        child=serializers.ImageField(validators=[validate_image_file]),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Report
        fields = ["category", "description", "latitude", "longitude", "images"]

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        report = Report.objects.create(**validated_data)
        for image in images:
            ReportPhoto.objects.create(report=report, image=image)
        return report

