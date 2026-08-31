#!/bin/bash
# Test script to verify the application is working correctly

echo "🔍 Testing Civic Reporting App..."
echo ""

# Check if backend is running
echo "1️⃣  Testing Backend..."
if python3 -c "import django; django.setup()" 2>/dev/null; then
    echo "✅ Django setup successful"
else
    echo "❌ Django setup failed - Make sure you're in the backend directory"
    exit 1
fi

# Check if migrations are applied
echo ""
echo "2️⃣  Checking migrations..."
python3 manage.py migrate --check 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ All migrations applied"
else
    echo "⚠️  Migrations pending - Run: python3 manage.py migrate"
fi

# Check if superuser exists
echo ""
echo "3️⃣  Checking admin user..."
if python3 manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.filter(is_staff=True).exists())" | grep -q "True"; then
    echo "✅ Admin user exists"
else
    echo "⚠️  No admin user found - Run: python3 manage.py createsuperuser"
fi

echo ""
echo "✨ Backend checks complete!"
echo ""
echo "Frontend setup:"
echo "  1. cd frontend"
echo "  2. npm install"
echo "  3. npm run dev"
echo ""
echo "Backend setup:"
echo "  1. cd backend"
echo "  2. python3 manage.py migrate (if needed)"
echo "  3. python3 manage.py runserver"
