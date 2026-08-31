#!/usr/bin/env python
"""
Debug script to check superuser status and authentication issues.
Run from backend directory: python debug_auth.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicproject.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

print("=" * 60)
print("🔍 CIVIC REPORTING APP - AUTH DEBUG")
print("=" * 60)

# Check 1: List all users
print("\n1️⃣  All Users in Database:")
print("-" * 60)
users = User.objects.all()
if users.exists():
    for user in users:
        token_status = "✅ Has Token" if Token.objects.filter(user=user).exists() else "❌ No Token"
        is_staff = "✅ Staff" if user.is_staff else "❌ Not Staff"
        print(f"  • {user.username}")
        print(f"    └─ {is_staff} | {token_status} | Active: {user.is_active}")
else:
    print("  ❌ NO USERS FOUND IN DATABASE")

# Check 2: Verify a specific superuser
print("\n2️⃣  Superuser Check:")
print("-" * 60)
superusers = User.objects.filter(is_staff=True, is_superuser=True)
if superusers.exists():
    for su in superusers:
        print(f"  ✅ Superuser Found: {su.username}")
        print(f"     • is_active: {su.is_active}")
        print(f"     • is_staff: {su.is_staff}")
        print(f"     • is_superuser: {su.is_superuser}")
else:
    print("  ❌ NO SUPERUSER FOUND")

# Check 3: Test authentication
print("\n3️⃣  Test Authentication:")
print("-" * 60)
from django.contrib.auth import authenticate

# Try to authenticate with a user from the database
if users.exists():
    test_user = users.first()
    print(f"  Testing with user: {test_user.username}")
    print(f"  (Note: Can't test password without knowing it)")
    print(f"  • is_staff: {test_user.is_staff}")
    print(f"  • is_active: {test_user.is_active}")
else:
    print("  ⚠️  No users to test")

# Check 4: Token status
print("\n4️⃣  Auth Tokens:")
print("-" * 60)
tokens = Token.objects.all()
if tokens.exists():
    for token in tokens:
        print(f"  ✅ Token for user: {token.user.username}")
        print(f"     • Token: {token.key[:20]}...")
else:
    print("  ❌ NO TOKENS FOUND")

# Check 5: Database connection
print("\n5️⃣  Database Status:")
print("-" * 60)
try:
    from django.db import connection
    connection.ensure_connection()
    print(f"  ✅ Database connected")
    print(f"  • Engine: {connection.settings_dict['ENGINE']}")
    print(f"  • Database: {connection.settings_dict['NAME']}")
except Exception as e:
    print(f"  ❌ Database error: {e}")

print("\n" + "=" * 60)
print("📝 TROUBLESHOOTING STEPS:")
print("=" * 60)
print("""
If you see "NO SUPERUSER FOUND":
  1. Run: python manage.py createsuperuser
  2. Enter username, email, and password when prompted
  3. Re-run this script to verify

If you see "NO TOKENS FOUND":
  1. This is normal - tokens are created on first login
  2. Try logging in through the API

If authentication fails in the app:
  1. Check the Django console for error messages
  2. Verify username/password are correct
  3. Make sure user is marked as staff (is_staff=True)
  4. Try accessing /admin with the same credentials

To reset a superuser password:
  python manage.py changepassword <username>
""")
print("=" * 60)
