# Deploy POS Application to Render Using Docker

This guide provides step-by-step instructions to deploy your POS application to Render using Docker containers.

## Prerequisites

- GitHub account
- Render account (sign up at https://render.com - free tier available)
- Your code pushed to a GitHub repository

---

## Deployment Architecture

Your application will be deployed as:
1. **PostgreSQL Database** - Managed PostgreSQL database on Render
2. **Backend API** - Flask app running in Docker container
3. **Frontend** - React app built with Vite, served via Nginx in Docker container

---

## Step 1: Prepare Your Repository

### 1.1 Commit All Configuration Files

Ensure these files are committed to your GitHub repository:
- `Dockerfile.frontend` (updated)
- `backend/Dockerfile`
- `nginx.conf` (new)
- `vite.config.ts` (updated)
- `src/services/api.ts` (updated)

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database on Render

### 2.1 Create Database

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `pos-database` (or your preferred name)
   - **Database**: `pos_db`
   - **User**: `pos_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or paid for production)
4. Click **"Create Database"**

### 2.2 Save Database Connection String

- After creation, go to database details
- Copy the **"Internal Database URL"** (starts with `postgresql://`)
- Save this for backend configuration

---

## Step 3: Deploy Backend API

### 3.1 Create Backend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure service:

   **Basic Settings:**
   - **Name**: `pos-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile` (relative to backend folder)

   **Plan:**
   - Free (or paid for production)

### 3.2 Add Environment Variables

In the **Environment** section, add:

```
DATABASE_URL = [paste your internal database URL from Step 2.2]
FLASK_ENV = production
```

### 3.3 Advanced Settings (Optional)

- **Health Check Path**: `/api/tables`
- This helps Render know when your service is ready

### 3.4 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL (e.g., `https://pos-backend-xxxx.onrender.com`)

---

## Step 4: Deploy Frontend

### 4.1 Create Frontend Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect the same GitHub repository
3. Configure service:

   **Basic Settings:**
   - **Name**: `pos-frontend`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `.` (root)
   - **Environment**: `Docker`
   - **Dockerfile Path**: `./Dockerfile.frontend`

   **Plan:**
   - Free (or paid for production)

### 4.2 Add Environment Variables

In the **Environment** section, add:

```
VITE_API_URL = [your backend URL from Step 3.4]
```

Example:
```
VITE_API_URL = https://pos-backend-xxxx.onrender.com
```

### 4.3 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get your frontend URL (e.g., `https://pos-frontend-xxxx.onrender.com`)

---

## Step 5: Verify Deployment

### 5.1 Test Backend

Visit your backend URL + `/api/tables`:
```
https://pos-backend-xxxx.onrender.com/api/tables
```

You should see a JSON response (empty array `[]` or table data).

### 5.2 Test Frontend

1. Visit your frontend URL
2. Try logging in
3. Test creating tables, orders, etc.

---

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain to Frontend

1. Go to your frontend service settings
2. Click **"Custom Domains"**
3. Add your domain (e.g., `pos.yourdomain.com`)
4. Follow DNS configuration instructions
5. Render provides free SSL certificates automatically

### 6.2 Update Backend CORS (if needed)

If using custom domain, update backend [`app.py`](c:\Users\syam6\Documents\GitHub\POS\backend\app.py):

```python
# Configure CORS
CORS(app, origins=[
    "https://pos.yourdomain.com",
    "http://localhost:3000"  # Keep for local development
])
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: Backend can't connect to database

**Solutions**:
1. Verify `DATABASE_URL` is set correctly
2. Use **Internal Database URL** (not External)
3. Check database is in same region as backend
4. Review backend logs in Render dashboard

### Frontend Can't Reach Backend

**Problem**: API calls failing with CORS or network errors

**Solutions**:
1. Verify `VITE_API_URL` is set correctly
2. Ensure backend URL includes `https://` protocol
3. Check backend CORS configuration allows frontend domain
4. Review browser console for specific errors

### Build Failures

**Problem**: Deployment fails during build

**Solutions**:
1. Check build logs in Render dashboard
2. Verify all dependencies in `package.json` and `requirements.txt`
3. Ensure Dockerfile syntax is correct
4. Try building locally with Docker first

### Free Tier Limitations

**Important Notes**:
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds to wake up
- Database has storage limits (1GB on free tier)
- Consider upgrading for production use

---

## Monitoring and Maintenance

### View Logs

1. Go to service in Render dashboard
2. Click **"Logs"** tab
3. Monitor real-time application logs

### Manual Redeploy

1. Go to service settings
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Auto-Deploy on Git Push

- By default, Render auto-deploys when you push to connected branch
- Disable in service settings if needed

### Database Backups

1. Go to database in Render dashboard
2. Click **"Backups"** tab
3. Configure automatic backups (paid plans)

---

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `FLASK_ENV` | Flask environment | `production` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://pos-backend.onrender.com` |

---

## Cost Estimates

### Free Tier (Good for Testing)
- Database: 1GB storage, shared CPU
- Backend: 512MB RAM, shared CPU
- Frontend: 512MB RAM, shared CPU
- **Total**: $0/month

### Starter Tier (Good for Small Production)
- Database: 1GB storage, 1 CPU, 1GB RAM - $7/month
- Backend: 512MB RAM - $7/month
- Frontend: 512MB RAM - $7/month
- **Total**: ~$21/month

### Professional Tier (Recommended for Production)
- Database: 10GB storage, 1 CPU, 2GB RAM - $25/month
- Backend: 2GB RAM, autoscaling - $25/month
- Frontend: 2GB RAM - $25/month
- **Total**: ~$75/month

---

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test all features
3. ⬜ Configure custom domain
4. ⬜ Set up monitoring alerts
5. ⬜ Configure database backups
6. ⬜ Implement CI/CD for automated testing
7. ⬜ Add environment-specific configurations

---

## Alternative: Deploy Using render.yaml (Blueprint)

For easier deployment, you can use the included `render.yaml` file:

1. Go to Render Dashboard
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository
4. Render will automatically:
   - Create database
   - Deploy backend
   - Deploy frontend
   - Configure environment variables

**Note**: Blueprint deployment requires all services to be in the same repository.

---

## Support Resources

- [Render Documentation](https://render.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Deploying Flask Apps](https://render.com/docs/deploy-flask)
- [Deploying React Apps](https://render.com/docs/deploy-create-react-app)

---

## Security Checklist

Before going to production:

- [ ] Change default database credentials
- [ ] Add authentication to your application
- [ ] Configure CORS properly (restrict origins)
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up database backups
- [ ] Monitor application logs
- [ ] Implement rate limiting
- [ ] Add error tracking (e.g., Sentry)
- [ ] Review and secure environment variables

---

**Your POS application is now deployed on Render! 🚀**
