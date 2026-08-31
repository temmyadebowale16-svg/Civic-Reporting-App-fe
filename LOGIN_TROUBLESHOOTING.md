# 🔧 Admin Login Troubleshooting Guide

## Quick Diagnosis

Follow these steps to diagnose and fix the login issue:

### Step 1: Check if Superuser Exists

In the backend terminal, run:

```bash
cd backend
python debug_auth.py
```

This will show you:

- ✅ All users in the database
- ✅ If you have a superuser
- ✅ If tokens exist
- ✅ Database connection status

**Expected output:**

```
1️⃣  All Users in Database:
  • admin
    └─ ✅ Staff | ✅ Has Token | Active: True

2️⃣  Superuser Check:
  ✅ Superuser Found: admin
```

### Step 2: If No Superuser Exists → Create One

```bash
python manage.py createsuperuser
```

Follow the prompts:

```
Username: admin
Email address: admin@example.com
Password: ••••••••
Password (again): ••••••••
Superuser created successfully.
```

⚠️ **Remember your password!** You'll need it to login.

### Step 3: Verify Django Settings

Make sure your `.env` file has `DEBUG=True`:

```bash
cat .env
```

Should show:

```
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
SECRET_KEY=...
```

### Step 4: Check Backend is Running

In terminal with backend, you should see:

```
Starting development server at http://127.0.0.1:8000/
```

### Step 5: Test Login Endpoint Directly

Use `curl` or Postman to test the login endpoint:

```bash
curl -X POST http://127.0.0.1:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourpassword"}'
```

**Success response (200):**

```json
{
  "token": "abc123...",
  "username": "admin"
}
```

**Failure responses:**

- **400**: Missing username/password
- **401**: Invalid credentials
- **403**: Account exists but not staff
- **429**: Too many attempts (wait 5 minutes)

### Step 6: Frontend Check

Open browser console (`F12` → Console tab) and look for:

```javascript
// You should see:
Attempting login with username: admin
Login successful: { token: "abc123..." }

// Or error:
Login error: 401 {detail: "Invalid username or password."}
```

## Common Issues & Solutions

| Issue                                     | Cause                         | Solution                                |
| ----------------------------------------- | ----------------------------- | --------------------------------------- |
| "Invalid username or password" (401)      | Wrong credentials             | Check username/password spelling        |
| "Invalid username or password" (401)      | User doesn't exist            | Run `python manage.py createsuperuser`  |
| "Account doesn't have admin access" (403) | User exists but not staff     | See "Fix: Promote User to Staff" below  |
| "Too many login attempts" (429)           | Rate limit (5 attempts/5 min) | Wait 5 minutes and try again            |
| Connection error                          | Backend not running           | Run `python manage.py runserver`        |
| Connection error                          | Wrong API URL                 | Check `VITE_API_URL` in frontend `.env` |

## Fix: Promote User to Staff

If the user exists but isn't marked as staff:

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
user = User.objects.get(username='admin')
user.is_staff = True
user.is_superuser = True
user.save()
print(f"✅ User {user.username} is now staff!")
exit()
```

## Fix: Reset User Password

```bash
python manage.py changepassword admin
```

Then enter the new password twice.

## Complete Backend Restart

If something seems stuck:

```bash
# Stop backend (Ctrl+C in terminal)

# Clear Django cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()
>>> exit()

# Run migrations (if needed)
python manage.py migrate

# Restart server
python manage.py runserver
```

## Verify Backend Logs

Look at the Django console output. When you try to login, you should see:

```
[dd/mmm/yyyy HH:MM:SS] "POST /api/admin/login/ HTTP/1.1" 200 OK
```

If you see `401`, `403`, or errors, check the error messages.

## Frontend Debugging

1. Open browser DevTools: `F12`
2. Go to **Network** tab
3. Try to login
4. Click on the `admin/login/` request
5. View the **Response** tab to see what error the backend returned
6. Check **Console** tab for JavaScript errors

## Still Having Issues?

Provide this information:

1. Output of `python debug_auth.py`
2. The exact error message from the login form
3. Network response (from DevTools)
4. Django console output when you try to login

---

## Quick Reference: Common Commands

```bash
# Create superuser
python manage.py createsuperuser

# Change password
python manage.py changepassword username

# Check users
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.all()

# Make user staff
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='admin')
>>> user.is_staff = True
>>> user.save()

# Clear cache
python manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()

# Debug script
python debug_auth.py
```
