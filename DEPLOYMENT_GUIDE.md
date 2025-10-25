# 🚀 Deployment Guide - Using Your Existing Accounts

## Recommended Architecture

Based on your existing accounts, here's the optimal setup:

```
┌─────────────────────────────────────────────────────────┐
│                    USER UPLOADS PDF                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Frontend (Vercel Free Tier or Cloudflare Pages)       │
│   - Next.js application                                  │
│   - Static files served via CDN                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Backend (Render)                                       │
│   - Fastify API server                                   │
│   - PDF processing & AI analysis                         │
│   - OpenAI + Anthropic API calls                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────┬───────────────────┬───────────────────────┐
│  Database   │   File Storage    │   CDN/Cache           │
│  (Supabase) │   (Cloudflare R2) │   (Cloudflare)        │
│             │   or Supabase     │                       │
└─────────────┴───────────────────┴───────────────────────┘
```

---

## 🎯 Recommended Setup

### Option 1: Simple All-In-One (Recommended for MVP)

**Best for:** Quick setup, easier management

| Service | Use | Why |
|---------|-----|-----|
| **Supabase** | PostgreSQL Database + File Storage | All-in-one, free tier (500MB DB + 1GB storage) |
| **Render** | Backend API | You have account, free tier, easy deploy |
| **Vercel** | Frontend | Free, automatic deployments from GitHub |

**Pros:**
- ✅ Simplest setup (only 3 services)
- ✅ All free tiers to start
- ✅ Easy to manage
- ✅ 1GB file storage included

**Cons:**
- ⚠️ Storage limited to 1GB on free tier (can upgrade)

---

### Option 2: Optimized for Scale (When You Grow)

**Best for:** Production, high volume, cost optimization

| Service | Use | Why |
|---------|-----|-----|
| **Supabase** | PostgreSQL Database | Reliable, fast, generous free tier |
| **Cloudflare R2** | PDF File Storage | No egress fees, unlimited bandwidth, $0.015/GB |
| **Render** | Backend API | You have account, good performance |
| **Cloudflare Pages** | Frontend | Free, fast, integrated with R2 |

**Pros:**
- ✅ Best performance
- ✅ Cheapest at scale (R2 has no egress fees)
- ✅ Unlimited bandwidth
- ✅ All services you already have accounts for

**Cons:**
- ⚠️ Slightly more complex setup
- ⚠️ Need to configure S3-compatible storage

---

## 📋 Step-by-Step Setup

### Phase 1: Database Setup (Supabase)

#### 1. Create Supabase Project

```bash
# Go to: https://supabase.com/dashboard
# 1. Click "New Project"
# 2. Choose your organization
# 3. Enter project details:
#    - Name: "ai-content-review"
#    - Database Password: (save this!)
#    - Region: (choose closest to you)
#    - Pricing Plan: Free
```

#### 2. Get Database Connection String

```bash
# In Supabase Dashboard:
# Settings → Database → Connection String → URI

# Copy the URI, it looks like:
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Replace [YOUR-PASSWORD] with your database password
```

#### 3. Configure Backend

Paste this in `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

#### 4. Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

**Done! ✅** Your database is ready.

---

### Phase 2: File Storage Setup

#### Option A: Use Supabase Storage (Simpler)

**Free Tier:** 1GB storage

```bash
# In Supabase Dashboard:
# Storage → Create Bucket
# Bucket name: "pdf-uploads"
# Public: No (keep private)
```

**Update `backend/.env`:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
STORAGE_BUCKET=pdf-uploads
```

**Update `backend/package.json` dependencies:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0"
  }
}
```

#### Option B: Use Cloudflare R2 (Better for Scale)

**Pricing:** $0.015/GB stored, NO egress fees

```bash
# In Cloudflare Dashboard:
# R2 → Create Bucket
# Bucket name: "ai-content-pdfs"
# Location: Automatic (or choose closest)
```

**Get R2 Credentials:**
```bash
# R2 → Manage R2 API Tokens
# Create API Token
# Copy: Access Key ID & Secret Access Key
```

**Update `backend/.env`:**
```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

---

### Phase 3: Backend Deployment (Render)

#### 1. Push Code to GitHub

```bash
cd /Users/godslovechinekwe/Desktop/"PDF AI reviewer"

# Create GitHub repository first, then:
git add .
git commit -m "Initial commit: AI Content Review System"
git remote add origin https://github.com/YOUR-USERNAME/ai-content-review.git
git push -u origin main
```

#### 2. Deploy to Render

```bash
# Go to: https://render.com/dashboard
# 1. Click "New +" → "Web Service"
# 2. Connect your GitHub repository
# 3. Configure:

Name: ai-content-review-api
Environment: Node
Region: (choose closest)
Branch: main
Root Directory: backend
Build Command: npm install && npm run prisma:generate
Start Command: npm start

# 4. Add Environment Variables:
```

**Environment Variables in Render:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=https://your-frontend-url.vercel.app

# If using Cloudflare R2:
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=ai-content-pdfs
```

**Done! ✅** Backend deployed.

---

### Phase 4: Frontend Deployment (Vercel or Cloudflare Pages)

#### Option A: Vercel (Recommended)

```bash
# Go to: https://vercel.com
# 1. Import GitHub repository
# 2. Configure:

Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next

# 3. Environment Variables:
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

#### Option B: Cloudflare Pages

```bash
# Go to: https://dash.cloudflare.com
# Pages → Create Project → Connect to Git

# Configure:
Framework: Next.js
Build Command: npm run build
Build Output: .next

# Environment Variables:
NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
```

**Done! ✅** Frontend deployed.

---

## 💰 Cost Breakdown

### Free Tier (MVP)

| Service | Free Tier | Enough For |
|---------|-----------|------------|
| **Supabase** | 500MB DB + 1GB storage | ~1,000 documents |
| **Render** | 750 hours/month | 24/7 uptime ✅ |
| **Vercel** | 100GB bandwidth | ~100K visitors |
| **OpenAI Moderation** | Unlimited FREE | ✅ |
| **Anthropic Claude** | Pay as you go | $0.30 per 300-page PDF |

**Total:** $0 infrastructure + ~$0.30 per PDF analyzed

### Paid Tier (Production)

| Service | Cost | For |
|---------|------|-----|
| **Supabase Pro** | $25/month | 8GB DB + 100GB storage |
| **Render Standard** | $7/month | Better performance |
| **Cloudflare R2** | $0.015/GB | 10GB = $0.15/month |
| **Claude API** | ~$0.30/document | With caching |

**Total:** ~$32/month + $0.30 per PDF

---

## 🚀 Quick Start Commands

### Local Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (already running)
# Visit: http://localhost:3000
```

### Production URLs
```bash
Frontend: https://your-app.vercel.app
Backend: https://your-app.onrender.com
Database: Supabase Dashboard
Storage: Cloudflare R2 or Supabase Storage
```

---

## 🔧 Recommended Configuration

For your accounts, I recommend:

### Development (Now)
```
Database: Supabase (free tier)
Storage: Supabase Storage (1GB free)
Backend: Local (npm run dev)
Frontend: Local (npm run dev)
```

### Staging (Testing)
```
Database: Supabase (free tier)
Storage: Supabase Storage or Cloudflare R2
Backend: Render (free tier)
Frontend: Vercel (free tier)
```

### Production (Live)
```
Database: Supabase Pro ($25/mo)
Storage: Cloudflare R2 ($0.015/GB)
Backend: Render Standard ($7/mo)
Frontend: Cloudflare Pages (free) or Vercel (free)
CDN: Cloudflare (for caching)
```

---

## 📝 Next Steps

1. ✅ Get Supabase database URL
2. ✅ Paste in `backend/.env`
3. ✅ Run `npm run prisma:migrate`
4. ✅ Start backend
5. ✅ Test with a PDF upload!

Need help with any specific setup? Let me know!
