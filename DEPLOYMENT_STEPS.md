# Deployment Guide: Vercel + Render Free Tier

## Prerequisites
- GitHub account (already done ✅)
- Vercel account (free)
- Render account (free)
- Your Render PostgreSQL database is already set up ✅

---

## Step 1: Deploy Backend to Render (5 minutes)

### 1.1 Sign up for Render
1. Go to https://render.com/
2. Click "Get Started" or "Sign Up"
3. Sign up with GitHub (easiest option)
4. Authorize Render to access your GitHub repositories

### 1.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your repository: `glovejobs/pdf-ai-reviewer`
3. Click "Connect"

### 1.3 Configure Service
Fill in these settings:
- **Name**: `pdf-ai-reviewer-api`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free

### 1.4 Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add these:

```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://pdf-ai-reviewer.vercel.app
DATABASE_URL=<your-render-postgresql-url>
OPENAI_API_KEY=<your-openai-api-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
R2_ACCOUNT_ID=<your-cloudflare-r2-account-id>
R2_ACCESS_KEY_ID=<your-cloudflare-r2-access-key>
R2_SECRET_ACCESS_KEY=<your-cloudflare-r2-secret-key>
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=<your-cloudflare-r2-endpoint>
```

**Note**: Get your actual values from:
- `DATABASE_URL`: From your existing Render PostgreSQL database
- `OPENAI_API_KEY`: From https://platform.openai.com/api-keys
- `OPENROUTER_API_KEY`: From https://openrouter.ai/keys
- R2 credentials: From Cloudflare dashboard → R2 → Manage R2 API Tokens

Or copy them from your local `backend/.env` file.

### 1.5 Deploy
1. Click "Create Web Service"
2. Wait 3-5 minutes for deployment
3. Your backend URL will be: `https://pdf-ai-reviewer-api.onrender.com`
4. Test it by visiting: `https://pdf-ai-reviewer-api.onrender.com/health`

---

## Step 2: Deploy Frontend to Vercel (3 minutes)

### 2.1 Sign up for Vercel
1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub repositories

### 2.2 Import Project
1. Click "Add New..." → "Project"
2. Find and select `glovejobs/pdf-ai-reviewer`
3. Click "Import"

### 2.3 Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 2.4 Add Environment Variable
Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=https://pdf-ai-reviewer-api.onrender.com
```

### 2.5 Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for deployment
3. Your frontend URL will be: `https://pdf-ai-reviewer.vercel.app`

---

## Step 3: Verify Deployment

### 3.1 Test Backend
Visit: `https://pdf-ai-reviewer-api.onrender.com/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T..."
}
```

### 3.2 Test Frontend
1. Visit: `https://pdf-ai-reviewer.vercel.app`
2. Try uploading a PDF
3. Check if AI analysis works

---

## Step 4: Create Cloudflare R2 Bucket

### 4.1 Create Bucket
1. Log into Cloudflare dashboard
2. Go to R2 Object Storage
3. Click "Create bucket"
4. Name: `ai-content-pdfs`
5. Location: Automatic
6. Click "Create bucket"

---

## Troubleshooting

### Backend Issues
- **503 Error**: Backend is waking up from sleep (wait 30-60 seconds)
- **Database Connection Error**: Check DATABASE_URL is correct
- **Build Failed**: Check build logs in Render dashboard

### Frontend Issues
- **Network Error**: Backend might be sleeping, wait and retry
- **CORS Error**: Check FRONTEND_URL in Render environment variables
- **Upload Failed**: Check R2 credentials and bucket exists

---

## Free Tier Limits

### Render Free Tier
- ✅ 750 hours/month (enough for 24/7)
- ✅ Sleeps after 15 min inactivity
- ✅ 512MB RAM
- ✅ Shared CPU

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## Your Live URLs

After deployment, your app will be live at:

- **Frontend**: https://pdf-ai-reviewer.vercel.app
- **Backend**: https://pdf-ai-reviewer-api.onrender.com
- **Database**: Already hosted on Render PostgreSQL

**Total Cost**: $0/month 🎉

---

## Next Steps

1. Set up custom domain (optional)
2. Monitor usage in dashboards
3. Set up error tracking (Sentry)
4. Configure analytics

Enjoy your free deployed app! 🚀
