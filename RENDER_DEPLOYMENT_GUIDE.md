# Civic Reporting App - Render Deployment Guide

## Overview

Complete step-by-step guide for deploying to **Render.com** (free tier available).

**Why Render?**

- ✅ Free tier for projects under 750 hours/month
- ✅ Automatic deployments from GitHub
- ✅ Managed PostgreSQL (free tier available)
- ✅ HTTPS included
- ✅ No credit card needed for free tier
- ✅ One-click deployment

**Architecture**:

- Backend: Render Web Service (Python/Django)
- Frontend: Render Static Site (React/Vite) OR Netlify
- Database: Render Managed PostgreSQL

---

## Step 1: Prepare Your Repository

### 1.1 Push to GitHub

```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 1.2 Create `render.yaml` (Backend Configuration)

Create `backend/render.yaml`:

```yaml
services:
  - type: web
    name: civic-reporting-api
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput
    startCommand: gunicorn civicproject.wsgi:application

    envVars:
      - key: DEBUG
        value: false
      - key: SECRET_KEY
        fromDatabase:
          name: civic-reporting-db
          property: connectionString
      - key: PYTHON_VERSION
        value: 3.11.0

databases:
  - name: civic-reporting-db
    plan: free
    databaseName: civic_reporting_prod
    user: civic_user
    region: oregon
```

### 1.3 Create `render-build.sh`

Create `backend/render-build.sh`:

```bash
#!/bin/bash
set -e

echo "Running collectstatic..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

echo "Build complete!"
```

Make it executable:

```bash
chmod +x backend/render-build.sh
```

### 1.4 Update `.gitignore`

Ensure these are in `backend/.gitignore`:

```
.env
db.sqlite3
/media/
/staticfiles/
*.pyc
__pycache__/
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to https://render.com
2. Sign up with GitHub account
3. Connect GitHub repository

### 2.2 Create Web Service (Backend)

1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Fill in details:
   - **Name**: `civic-reporting-api`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3.11`
   - **Build Command**:
     ```
     pip install -r requirements.txt && python manage.py collectstatic --noinput
     ```
   - **Start Command**:
     ```
     gunicorn civicproject.wsgi:application
     ```
   - **Plan**: `Free` (or Starter)

### 2.3 Create PostgreSQL Database

1. Click **New +** → **PostgreSQL**
2. Fill in details:
   - **Name**: `civic-reporting-db`
   - **Database**: `civic_reporting_prod`
   - **User**: `civic_user`
   - **Region**: Same as web service
   - **Plan**: `Free` (or Starter)
3. Click **Create Database**
4. Copy the **Internal Database URL** (shown after creation)

### 2.4 Connect Database to Web Service

1. Go back to your **civic-reporting-api** web service
2. Click **Environment**
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste the database URL from step 2.3

### 2.5 Set Environment Variables

In **Environment** tab, add these variables:

```
SECRET_KEY = (generate a new secure key - see below)
DEBUG = false
ALLOWED_HOSTS = civic-reporting-api.onrender.com,yourdomain.com
CORS_ALLOWED_ORIGINS = https://civic-reporting-app.onrender.com,https://yourdomain.com
SECURE_SSL_REDIRECT = true
SESSION_COOKIE_SECURE = true
CSRF_COOKIE_SECURE = true
SECURE_BROWSER_XSS_FILTER = true
X_FRAME_OPTIONS = DENY
```

#### Generate Secure SECRET_KEY

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.6 Create Superuser

Once deployment is successful (you'll see "Deploy successful"):

1. Go to your service dashboard
2. Click **Shell** (top right)
3. Run:
   ```bash
   python manage.py createsuperuser
   ```
4. Follow prompts to create admin account

### 2.7 Test Backend

```bash
# Check API is running
curl https://civic-reporting-api.onrender.com/api/reports/

# Test should return: {"count": 0, "next": null, "previous": null, "results": []}
```

---

## Step 3: Deploy Frontend to Render (Static Site)

### 3.1 Build Frontend Locally

```bash
cd frontend
npm install
npm run build
```

This creates `frontend/dist/` directory.

### 3.2 Create Static Site on Render

1. Click **New +** → **Static Site**
2. Connect GitHub repository
3. Fill in details:
   - **Name**: `civic-reporting-app`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```
     npm install && npm run build
     ```
   - **Publish Directory**:
     ```
     dist
     ```

### 3.3 Set Environment Variables

Before deployment, add environment variable:

1. Click **Environment** tab
2. Add variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://civic-reporting-api.onrender.com`

### 3.4 Ensure API Routes Work

Create `frontend/public/_redirects`:

```
/* /index.html 200
```

This redirects all routes to index.html (required for React Router).

### 3.5 Test Frontend

After deployment completes:

1. Visit your frontend URL: `https://civic-reporting-app.onrender.com`
2. Should load the app
3. Try submitting a report
4. Admin login should work

---

## Step 4: Alternative - Deploy Frontend to Netlify

If you prefer Netlify for frontend (often faster deploys):

### 4.1 Connect Netlify

1. Go to https://netlify.com
2. Click **Add new site** → **Import existing project**
3. Select GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 4.2 Set Environment Variables

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://civic-reporting-api.onrender.com`

### 4.3 Deploy Redirects

Create `frontend/netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Step 5: Connect Custom Domain (Optional)

### 5.1 For Backend (Render)

1. Go to **civic-reporting-api** service
2. Click **Settings** → **Custom Domains**
3. Add domain (e.g., `api.yourdomain.com`)
4. Follow DNS setup instructions

### 5.2 For Frontend (Render)

1. Go to **civic-reporting-app** static site
2. Click **Settings** → **Custom Domains**
3. Add domain (e.g., `yourdomain.com`)
4. Follow DNS setup instructions

### 5.3 Update Environment Variables

Once domain is active:

1. Update backend `ALLOWED_HOSTS` to include your domain
2. Update frontend `VITE_API_URL` to use your domain

---

## Step 6: Production `.env` Template

Create `backend/.env.production` (never commit this):

```env
# Security - CHANGE THESE
SECRET_KEY=<generate-with-command-above>
DEBUG=False

# Hosts
ALLOWED_HOSTS=civic-reporting-api.onrender.com,api.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://civic-reporting-api.onrender.com,https://yourdomain.com

# Database (Render provides automatically)
DATABASE_URL=postgresql://...

# Frontend CORS
CORS_ALLOWED_ORIGINS=https://civic-reporting-app.onrender.com,https://yourdomain.com

# SSL/Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY

# File Upload
DATA_UPLOAD_MAX_MEMORY_SIZE=5242880
FILE_UPLOAD_MAX_MEMORY_SIZE=5242880

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_ATTEMPTS=5
RATE_LIMIT_PERIOD=300

# Logging
LOG_LEVEL=INFO
```

---

## Troubleshooting

### Backend Deploy Fails

**Error: "ModuleNotFoundError"**

```bash
# Solution: Check requirements.txt is in backend/ root
ls backend/requirements.txt  # Should exist
```

**Error: "No such file or directory: 'civicproject'"**

```bash
# Solution: Ensure Root Directory is set to "backend"
# In Render dashboard: Settings → Root Directory → backend
```

**Error: "ProgrammingError at /api/reports/"**

```bash
# Solution: Migrations not running
# In Shell tab, run:
python manage.py migrate
```

### Frontend Can't Connect to API

**Error: "CORS error" in browser console**

1. Check `VITE_API_URL` is set correctly
2. Check backend `CORS_ALLOWED_ORIGINS` includes frontend URL
3. Test with curl:
   ```bash
   curl -H "Origin: https://your-frontend.onrender.com" \
        https://civic-reporting-api.onrender.com/api/reports/
   ```

**Error: "Cannot GET /api/reports/"**

1. Backend may not be deployed
2. Check web service status in Render dashboard
3. View logs: Click service → **Logs**

### Database Connection Issues

**Error: "could not translate host name"**

1. Database may still be initializing (takes ~2 min)
2. Wait 2-3 minutes and redeploy
3. Or click database → **Logs** to check status

**Error: "database "civic_reporting_prod" does not exist"**

Run in Shell:

```bash
python manage.py migrate
```

---

## Monitoring & Logs

### View Backend Logs

1. Go to **civic-reporting-api** service
2. Click **Logs** tab
3. Real-time logs display

### View Database Logs

1. Go to **civic-reporting-db** database
2. Click **Logs** tab

### View Frontend Logs (Render)

1. Go to **civic-reporting-app** static site
2. Click **Logs** tab

---

## Free Tier Limits

| Resource    | Free Tier       | Cost                  |
| ----------- | --------------- | --------------------- |
| Web Service | 750 hours/month | Sleeps after inactive |
| Static Site | Unlimited       | Free                  |
| PostgreSQL  | 1 GB storage    | Free                  |
| Bandwidth   | 100 GB/month    | ~$0.10/GB over        |

**Note**: Free tier services spin down after 15 min of inactivity.

To keep service active, upgrade to **Starter** ($7/month).

---

## Automated Deployments

Every push to `main` branch automatically deploys:

1. **Backend**: Runs build command → migrations → starts service
2. **Frontend**: Runs build command → publishes to CDN

View deployment status:

- Render Dashboard → Service → **Deployments** tab

---

## Post-Deployment Checklist

- [ ] Backend API responds at `/api/reports/`
- [ ] Admin login works at `/api/admin/login/`
- [ ] Frontend loads and displays correctly
- [ ] Map shows reports
- [ ] File upload works
- [ ] Report submission creates database entry
- [ ] Admin can filter and update report status
- [ ] Error messages display properly
- [ ] HTTPS working (lock icon in browser)
- [ ] Database backups configured (optional)
- [ ] Custom domain pointing correctly

---

## Next Steps

1. **Set up automatic backups**:
   - Render PostgreSQL → Settings → Backups

2. **Monitor performance**:
   - Use Render built-in metrics
   - Add error tracking (Sentry)

3. **Scale if needed**:
   - Upgrade to Starter ($7/month)
   - Upgrade to Standard as traffic grows

4. **Custom domain**:
   - Point DNS to Render
   - Configure SSL (automatic)

5. **Email notifications**:
   - Add Django email backend
   - Send notifications on new reports

---

## Support

- **Render Docs**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/6.1/howto/deployment/
- **Community Support**: https://render.com/support

---

## Quick Command Reference

```bash
# Deploy backend
cd backend
git push origin main  # Auto-deploys to Render

# Deploy frontend
cd frontend
git push origin main  # Auto-deploys to Render

# Create superuser after backend deploys
# Via Render Shell tab:
python manage.py createsuperuser

# Run migrations if needed
python manage.py migrate

# Check logs
# Via Render Dashboard → Logs tab

# Rebuild & redeploy (from Render dashboard)
# Click service → "Redeploy"
```
