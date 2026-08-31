# Civic Reporting App - Deployment Guide

## Overview
Complete deployment instructions for Django backend + React frontend application.

**Stack**:
- **Backend**: Django 6.1 + Django REST Framework + PostgreSQL
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Application Server**: Gunicorn
- **Reverse Proxy**: Nginx (recommended) or built-in cloud provider
- **Static Files**: WhiteNoise (serves from backend)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools & Accounts
- [ ] Git & GitHub account
- [ ] Hosting platform (Heroku, AWS, DigitalOcean, etc.)
- [ ] PostgreSQL database (managed or self-hosted)
- [ ] Domain name (optional but recommended)
- [ ] SSL certificate (free via Let's Encrypt)

### Local Verification
```bash
# Verify backend works
cd backend
python manage.py migrate
python manage.py runserver

# Verify frontend works
cd ../frontend
npm install
npm run dev
```

---

## Environment Setup

### 1. Create Production `.env` File

**Backend** (`backend/.env`):
```env
# Security
SECRET_KEY=<generate-long-random-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/civic_reporting_prod

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Upload
MAX_UPLOAD_SIZE=5242880

# Security Headers
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Frontend** (`frontend/.env.production`):
```env
VITE_API_URL=https://api.yourdomain.com
```

### 2. Generate Secret Key
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Update .gitignore
Ensure these are ignored:
```
backend/.env
frontend/.env
frontend/.env.production
backend/db.sqlite3
backend/media/
frontend/dist/
frontend/node_modules/
```

---

## Backend Deployment

### Option A: Heroku (Easiest for Beginners)

#### 1. Install Heroku CLI
```bash
# Windows (using choco)
choco install heroku-cli

# Or download from https://devcenter.heroku.com/articles/heroku-cli
```

#### 2. Create Heroku App
```bash
heroku login
heroku create civic-reporting-api
```

#### 3. Add PostgreSQL Add-on
```bash
heroku addons:create heroku-postgresql:mini --app civic-reporting-api
# Get DATABASE_URL from:
heroku config:get DATABASE_URL --app civic-reporting-api
```

#### 4. Set Environment Variables
```bash
heroku config:set SECRET_KEY="<generated-key>" --app civic-reporting-api
heroku config:set DEBUG=False --app civic-reporting-api
heroku config:set ALLOWED_HOSTS="civic-reporting-api.herokuapp.com" --app civic-reporting-api
heroku config:set CORS_ALLOWED_ORIGINS="https://yourdomain.com" --app civic-reporting-api
heroku config:set SECURE_SSL_REDIRECT=True --app civic-reporting-api
```

#### 5. Create Procfile
Create `backend/Procfile`:
```
web: gunicorn civicproject.wsgi --log-file -
release: python manage.py migrate
```

#### 6. Deploy
```bash
cd backend
git push heroku main
```

#### 7. Create Superuser
```bash
heroku run python manage.py createsuperuser --app civic-reporting-api
```

---

### Option B: AWS EC2 (More Control)

#### 1. Launch EC2 Instance
- Ubuntu 22.04 LTS, t3.micro (free tier eligible)
- Security group: Allow ports 80, 443, 22

#### 2. Connect & Setup
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib nginx

# Clone repo
git clone https://github.com/yourusername/Civic-Reporting-App-fe.git
cd Civic-Reporting-App-fe/backend
```

#### 3. Setup Python Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 4. Configure PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE civic_reporting_prod;
CREATE USER civic_user WITH PASSWORD 'strong-password';
ALTER ROLE civic_user SET client_encoding TO 'utf8';
ALTER ROLE civic_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE civic_user SET default_transaction_deferrable TO on;
ALTER ROLE civic_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE civic_reporting_prod TO civic_user;
\q
```

#### 5. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

#### 6. Run Migrations
```bash
python manage.py migrate
```

#### 7. Configure Gunicorn
Create `backend/gunicorn_config.py`:
```python
import multiprocessing

bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
```

#### 8. Create Systemd Service
Create `/etc/systemd/system/civic-reporting.service`:
```ini
[Unit]
Description=Civic Reporting App
After=network.target

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/home/ubuntu/Civic-Reporting-App-fe/backend
Environment="PATH=/home/ubuntu/Civic-Reporting-App-fe/backend/venv/bin"
EnvironmentFile=/home/ubuntu/Civic-Reporting-App-fe/backend/.env
ExecStart=/home/ubuntu/Civic-Reporting-App-fe/backend/venv/bin/gunicorn \
    --config gunicorn_config.py \
    civicproject.wsgi:application

[Install]
WantedBy=multi-user.target
```

#### 9. Enable & Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable civic-reporting
sudo systemctl start civic-reporting
sudo systemctl status civic-reporting
```

#### 10. Configure Nginx
Create `/etc/nginx/sites-available/civic-reporting`:
```nginx
upstream civic_app {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    client_max_body_size 10M;

    location / {
        proxy_pass http://civic_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /home/ubuntu/Civic-Reporting-App-fe/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/Civic-Reporting-App-fe/backend/media/;
    }
}
```

#### 11. Enable & Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/civic-reporting /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 12. Setup SSL with Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### Option C: DigitalOcean App Platform (Recommended for Beginners)

#### 1. Push to GitHub
```bash
git push origin main
```

#### 2. Connect GitHub to DigitalOcean
- Go to DigitalOcean dashboard → Apps
- Click "Create App"
- Select GitHub repository
- Choose `backend` directory as source

#### 3. Set Environment Variables
In DigitalOcean dashboard:
```
SECRET_KEY = <generated-key>
DEBUG = False
ALLOWED_HOSTS = your-app.ondigitalocean.app
DATABASE_URL = postgresql://...
CORS_ALLOWED_ORIGINS = https://your-frontend.com
```

#### 4. Create Database
- Add PostgreSQL database component
- DigitalOcean automatically sets DATABASE_URL

#### 5. Deploy
- Click "Create App"
- DigitalOcean automatically handles migrations and scaling

---

## Frontend Deployment

### Option A: Netlify (Recommended)

#### 1. Build Locally
```bash
cd frontend
npm run build
```

#### 2. Create Netlify Account
- Sign up at https://netlify.com
- Connect GitHub account

#### 3. Deploy
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

Or via Netlify UI:
- Connect GitHub repository
- Set build command: `npm run build`
- Set publish directory: `dist`
- Set environment variable: `VITE_API_URL=https://your-api.com`

#### 4. Configure Redirects
Create `frontend/public/_redirects`:
```
/* /index.html 200
```

---

### Option B: Vercel

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Deploy
```bash
cd frontend
vercel --prod
```

#### 3. Configure Environment
Set `VITE_API_URL` in Vercel dashboard

---

### Option C: Deploy with Backend (Same Server)

If running backend on same server (EC2, DigitalOcean, etc.):

#### 1. Build Frontend
```bash
cd frontend
npm run build
```

#### 2. Copy to Backend Static
```bash
cp -r dist/* ../backend/staticfiles/
```

#### 3. Serve via Django
Django + WhiteNoise automatically serves from `staticfiles/`

---

## Database Setup

### Production PostgreSQL

#### Remote Database (Managed)
- **Heroku Postgres**: Included, automatic backups
- **AWS RDS**: Pay-as-you-go, highly scalable
- **DigitalOcean Managed**: Simple, affordable ($15/month)

#### Self-Hosted PostgreSQL
```bash
# Backup command
pg_dump -U civic_user -h localhost civic_reporting_prod > backup.sql

# Restore command
psql -U civic_user -h localhost civic_reporting_prod < backup.sql
```

### Run Migrations
```bash
python manage.py migrate --settings=civicproject.settings
```

---

## Security Checklist

### Backend
- [ ] `DEBUG = False` in production
- [ ] Strong `SECRET_KEY` (50+ characters)
- [ ] `ALLOWED_HOSTS` configured for your domain
- [ ] `CORS_ALLOWED_ORIGINS` restricted to frontend domain
- [ ] `SECURE_SSL_REDIRECT = True`
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] HTTPS certificate installed
- [ ] Rate limiting configured (5 attempts/5 min for login)
- [ ] File upload size limited (5MB max)
- [ ] Database password strong
- [ ] PostgreSQL user permissions minimal

### Frontend
- [ ] No hardcoded API keys or secrets
- [ ] API URL points to production backend
- [ ] Error messages don't expose sensitive info
- [ ] HTTPS enabled on frontend domain
- [ ] Content Security Policy headers set
- [ ] No console.log with sensitive data

### Database
- [ ] Regular backups scheduled
- [ ] Database encryption enabled
- [ ] Automatic updates enabled
- [ ] Strong master password
- [ ] No public IP exposure

---

## Monitoring & Maintenance

### Logs
```bash
# Heroku
heroku logs --tail --app civic-reporting-api

# AWS EC2
sudo journalctl -u civic-reporting -f

# Check application errors
tail -f /var/log/syslog
```

### Database Backups
```bash
# Weekly backup
0 2 * * 0 pg_dump -U civic_user civic_reporting_prod > /backups/db_$(date +\%Y\%m\%d).sql

# Add to crontab
crontab -e
```

### Performance Monitoring
- **Heroku**: Built-in monitoring dashboard
- **AWS**: CloudWatch
- **DigitalOcean**: App Platform monitoring
- **Self-hosted**: Install `django-extensions`, `django-debug-toolbar`

### Security Updates
```bash
# Check for Django security updates
pip list --outdated

# Update dependencies
pip install --upgrade -r requirements.txt
```

---

## Troubleshooting

### Backend Issues

**"ERROR: could not translate host name "host" to address"**
- Database connection failed
- Check `DATABASE_URL` environment variable
- Verify PostgreSQL is running and accessible

**"DisallowedHost exception"**
- Domain not in `ALLOWED_HOSTS`
- Update .env: `ALLOWED_HOSTS=yourdomain.com`

**"CORS error in browser"**
- Frontend domain not in `CORS_ALLOWED_ORIGINS`
- Update .env: `CORS_ALLOWED_ORIGINS=https://yourdomain.com`

**"Static files not loading"**
- Run: `python manage.py collectstatic`
- Check Nginx static file path
- Verify WhiteNoise middleware is enabled

### Frontend Issues

**"Cannot reach backend API"**
- Verify `VITE_API_URL` is correct
- Check backend is running
- Verify CORS is configured
- Check browser console for errors

**"Map not loading**
- Leaflet tiles may be blocked
- Check internet connection
- Verify Leaflet script tag in index.html

### Database Issues

**"too many connections"**
- Increase PostgreSQL `max_connections` setting
- Implement connection pooling (pgBouncer)

**"disk space full"**
- Clean old database logs
- Archive old report data
- Upgrade storage

---

## Post-Deployment Checklist

- [ ] Backend API responds at `/api/reports/`
- [ ] Admin login works at `/api/admin/login/`
- [ ] Frontend loads and connects to backend
- [ ] Map displays reports correctly
- [ ] File upload works (test with < 5MB image)
- [ ] Report submission creates database entry
- [ ] Admin dashboard filters and updates status
- [ ] All forms validate input correctly
- [ ] Error messages display properly
- [ ] HTTPS certificate is valid
- [ ] Database backups are working
- [ ] Monitoring/logging is configured

---

## Next Steps

1. **Custom Domain**: Point domain DNS to your app
2. **Email Notifications**: Add email alerts for new reports
3. **Analytics**: Implement analytics (Google Analytics, Sentry)
4. **Rate Limiting**: Adjust limits based on traffic
5. **Caching**: Add Redis for session/cache management
6. **CDN**: Use CloudFront/Cloudflare for static files
7. **Monitoring**: Set up uptime monitoring (Uptime Robot)

---

## Support & Resources

- Django Deployment: https://docs.djangoproject.com/en/6.1/howto/deployment/
- DRF Deployment: https://www.django-rest-framework.org/
- Heroku Python: https://devcenter.heroku.com/articles/getting-started-with-python
- Let's Encrypt: https://letsencrypt.org/
- Nginx Configuration: https://nginx.org/en/docs/
