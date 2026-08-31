from rest_framework import generics, permissions, pagination
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.contrib.auth import authenticate
from django.core.cache import cache
from datetime import datetime, timedelta
import logging

from .models import Report
from .serializers import AdminStatusUpdateSerializer, ReportCreateSerializer, ReportSerializer

logger = logging.getLogger(__name__)


class StandardPageNumberPagination(pagination.PageNumberPagination):
    """Standard pagination for list views."""
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class LoginThrottle(AnonRateThrottle):
    """Rate limit login attempts to prevent brute force attacks."""
    scope = "login"
    rate = "5/5m"  # 5 attempts per 5 minutes per IP

    def throttle_success(self):
        """Called when a request is allowed."""
        return super().throttle_success()

    def throttle_failure(self):
        """Called when a request is throttled."""
        return False


class ReportCreateView(generics.CreateAPIView):
    """POST /api/reports/  -- citizens submit a new report anonymously."""

    queryset = Report.objects.all()
    serializer_class = ReportCreateSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        # Return the full report (with reference_code) using the read serializer
        output = ReportSerializer(report, context={"request": request})
        return Response(output.data, status=201)


class ReportListView(generics.ListAPIView):
    """GET /api/reports/public/  -- public list/map of all reports."""

    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardPageNumberPagination


class ReportLookupView(APIView):
    """GET /api/reports/lookup/<reference_code>/ -- citizen tracks their own report."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, reference_code):
        try:
            report = Report.objects.get(reference_code=reference_code.upper())
        except Report.DoesNotExist:
            return Response({"detail": "No report found with that reference code."}, status=404)
        serializer = ReportSerializer(report, context={"request": request})
        return Response(serializer.data)


class AdminLoginView(APIView):
    """POST /api/admin/login/  -- staff login, returns an auth token."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        # Validate input
        if not username or not password:
            logger.warning(f"Login attempt with missing credentials from {self.get_client_ip(request)}")
            return Response(
                {"detail": "Username and password are required."},
                status=400
            )

        # Check rate limit manually (backup to throttle_classes)
        client_ip = self.get_client_ip(request)
        cache_key = f"login_attempts:{client_ip}"
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            logger.warning(f"Login rate limit exceeded for IP: {client_ip}")
            return Response(
                {"detail": "Too many login attempts. Please try again in 5 minutes."},
                status=429
            )

        # Increment attempts counter
        cache.set(cache_key, attempts + 1, timeout=300)  # 5 minutes

        # Attempt authentication
        user = authenticate(request, username=username, password=password)
        
        if user is None:
            logger.warning(f"Failed login attempt for username: {username} from {client_ip}")
            return Response(
                {"detail": "Invalid username or password."},
                status=401
            )
        
        if not user.is_staff:
            logger.warning(f"Non-staff user login attempt: {username} from {client_ip}")
            return Response(
                {"detail": "This account does not have admin access."},
                status=403
            )

        # Reset attempts on successful login
        cache.delete(cache_key)
        logger.info(f"Successful admin login for user: {username}")

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})

    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR", "unknown")
        return ip


class AdminReportListView(generics.ListAPIView):
    """GET /api/admin/reports/  -- staff-only, all reports for the dashboard."""

    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardPageNumberPagination


class AdminReportStatusUpdateView(generics.UpdateAPIView):
    """PATCH /api/admin/reports/<id>/status/  -- staff-only, update a report's status."""

    queryset = Report.objects.all()
    serializer_class = AdminStatusUpdateSerializer
    permission_classes = [permissions.IsAdminUser]

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        report = self.get_object()
        response.data = ReportSerializer(report, context={"request": request}).data
        return response

