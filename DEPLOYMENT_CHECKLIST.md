# Render Deployment Checklist

## Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] `.env.example` file created with variable references
- [ ] Docker configurations updated (`Dockerfile.frontend`, `backend/Dockerfile`)
- [ ] Nginx configuration created (`nginx.conf`)
- [ ] API service updated to use environment variables

## Render Setup

### 1. Database Setup
- [ ] PostgreSQL database created on Render
- [ ] Database internal URL copied
- [ ] Database name: `pos_db`
- [ ] Database user: `pos_user`

### 2. Backend Deployment
- [ ] Web Service created for backend
- [ ] Root directory set to: `backend`
- [ ] Dockerfile path set to: `./Dockerfile`
- [ ] Environment variables configured:
  - [ ] `DATABASE_URL` (internal database URL)
  - [ ] `FLASK_ENV=production`
- [ ] Health check path set to: `/api/tables`
- [ ] Backend URL copied for frontend config

### 3. Frontend Deployment
- [ ] Web Service created for frontend
- [ ] Root directory set to: `.` (root)
- [ ] Dockerfile path set to: `./Dockerfile.frontend`
- [ ] Environment variables configured:
  - [ ] `VITE_API_URL` (backend URL from step 2)
- [ ] Frontend URL noted

## Post-Deployment Testing

- [ ] Backend health check: `https://[backend-url]/api/tables`
- [ ] Frontend loads successfully
- [ ] Login functionality works
- [ ] Table management works (create, edit, delete)
- [ ] Order creation works
- [ ] Menu items display correctly
- [ ] Settings page accessible
- [ ] API calls from frontend reach backend successfully

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified (automatic on Render)
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error tracking integrated (e.g., Sentry)
- [ ] CORS configured for custom domain

## Production Readiness

- [ ] Environment variables secured
- [ ] Database credentials changed from defaults
- [ ] Application authentication implemented
- [ ] CORS origins restricted to your domains only
- [ ] Rate limiting configured
- [ ] Logging configured
- [ ] Performance monitoring enabled

## URLs to Save

```
Database Internal URL: _______________________________________
Backend URL: _______________________________________
Frontend URL: _______________________________________
Custom Domain (if any): _______________________________________
```

## Common Issues & Solutions

**Backend won't start:**
- Check DATABASE_URL is the internal URL
- Verify database is in same region
- Review logs in Render dashboard

**Frontend can't reach backend:**
- Verify VITE_API_URL is set correctly
- Check backend URL includes https://
- Review CORS configuration

**Slow initial load:**
- Expected on free tier (service spins down)
- Consider upgrading to paid tier for production

## Deployment Date

First deployed: _______________
Last updated: _______________
