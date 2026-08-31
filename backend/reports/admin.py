from django.contrib import admin
from .models import Report, ReportPhoto


class ReportPhotoInline(admin.TabularInline):
    model = ReportPhoto
    extra = 0
    readonly_fields = ["uploaded_at"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["reference_code", "category", "status", "created_at"]
    list_filter = ["status", "category"]
    search_fields = ["reference_code", "description"]
    readonly_fields = ["reference_code", "created_at", "updated_at"]
    inlines = [ReportPhotoInline]


@admin.register(ReportPhoto)
class ReportPhotoAdmin(admin.ModelAdmin):
    list_display = ["report", "uploaded_at"]
