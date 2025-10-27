# PDF AI Content Review System - Project Documentation

**Last Updated:** October 27, 2025

## Project Overview

AI-powered PDF content review system that analyzes documents for explicit material, violence, profanity, hate speech, and self-harm content. Provides 0-5 rating scale with detailed analysis using OpenAI moderation and Claude 3.5 Sonnet via OpenRouter.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel (Free Tier)
- **Live URL:** https://pdf-ai-reviewer-gv5i-git-main-gloves-projects-59db17ce.vercel.app

### Backend
- **Framework:** Fastify
- **Language:** TypeScript
- **ORM:** Prisma
- **Deployment:** Render (Free Tier - sleeps after 15min inactivity)
- **Live URL:** https://pdf-ai-reviewer.onrender.com

### Database
- **Type:** PostgreSQL
- **Provider:** Render PostgreSQL (Free Tier)
- **Connection:** External database service

### Storage
- **Provider:** Cloudflare R2 (S3-compatible)
- **Bucket:** `ai-content-pdfs`

### AI Services
- **OpenAI Moderation API:** Content classification (free)
- **Claude 3.5 Sonnet:** Rubric mapping via OpenRouter

### Repository
- **GitHub:** https://github.com/glovejobs/pdf-ai-reviewer
- **Owner:** glovejobs

## Project Structure

```
PDF AI reviewer/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # API client & utilities
│   ├── package.json
│   └── next.config.ts
├── backend/                  # Fastify backend
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration
│   │   └── types/           # TypeScript types
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── package.json
│   └── .env                 # Environment variables (local)
├── render.yaml              # Render deployment config
└── DEPLOYMENT_STEPS.md      # Original deployment guide
```

## Environment Variables

### Backend (.env)

```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=https://pdf-ai-reviewer-gv5i-git-main-gloves-projects-59db17ce.vercel.app

# Database (PostgreSQL on Render)
DATABASE_URL=postgresql://pdf_ai_content_review_user:wMdGBstp70VxePjSc83uvfKH3pyKV1iH@dpg-d3thbdbe5dus738v7940-a.oregon-postgres.render.com:5432/pdf_ai_content_review

# OpenAI (for content moderation)
OPENAI_API_KEY=<your-openai-api-key>

# OpenRouter (for Claude AI)
OPENROUTER_API_KEY=<your-openrouter-api-key>

# Cloudflare R2 Storage
R2_ACCOUNT_ID=<your-r2-account-id>
R2_ACCESS_KEY_ID=<your-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
R2_BUCKET_NAME=ai-content-pdfs
R2_BUCKET_URL=<your-r2-bucket-url>
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://pdf-ai-reviewer.onrender.com
```

**IMPORTANT NOTES:**
1. DATABASE_URL must be **ONE LINE** with `:5432` port included
2. FRONTEND_URL in backend must match Vercel deployment URL exactly (no trailing slash)
3. When pasting to Render, ensure variables don't get truncated or line-wrapped

## Deployment Details

### Vercel (Frontend)
- **Project:** pdf-ai-reviewer-gv5i
- **Root Directory:** `frontend`
- **Build Command:** Auto-detected (npm run build)
- **Framework:** Next.js (auto-detected)
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: Backend URL on Render

### Render (Backend)
- **Service:** pdf-ai-reviewer
- **Type:** Web Service
- **Runtime:** Node
- **Region:** Oregon
- **Plan:** Free (512MB RAM, sleeps after 15min inactivity)
- **Build Command:** `cd backend && npm install && npx prisma generate && npm run build`
- **Start Command:** `cd backend && npm start`
- **Health Check:** `/health` endpoint

### Cloudflare R2
- **Bucket Name:** ai-content-pdfs
- **Region:** Automatic (Cloudflare global network)
- **Purpose:** PDF file storage

## Known Issues & Fixes Applied

### Issue 1: TypeScript Build Errors (FIXED)
- **Problem:** Multiple TypeScript compilation errors on Render
- **Causes:**
  1. Missing `pdf-parse` type declarations
  2. Deprecated Anthropic SDK `cache_control` feature
  3. Incorrect Fastify logger signature
- **Fix Applied:**
  1. Created `/backend/src/types/pdf-parse.d.ts` with complete type definitions
  2. Removed `cache_control` from Anthropic API calls in `rubric.service.ts`
  3. Fixed logger calls: `fastify.log.error(error as Error, 'message')` (error first, then message)
- **Files Modified:**
  - `backend/src/types/pdf-parse.d.ts` (created)
  - `backend/src/services/rubric.service.ts`
  - All route files (documents.ts, reports.ts, templates.ts, term-lists.ts)

### Issue 2: CORS Errors (FIXED)
- **Problem:** Frontend couldn't connect to backend (CORS blocking)
- **Cause:** Backend CORS configured for wrong origin
- **Fix Applied:** Set `FRONTEND_URL` environment variable in Render to exact Vercel URL
- **Configuration:** `backend/src/index.ts` line 23: `origin: process.env.FRONTEND_URL`

### Issue 3: Database Connection Error (FIXED)
- **Problem:** Invalid port number in database URL
- **Cause:** DATABASE_URL got truncated when pasted to Render (missing `:5432` port)
- **Fix Applied:** Updated DATABASE_URL in Render with complete connection string including `:5432`

### Issue 4: Vercel Authentication Blocking Testers (PARTIALLY ADDRESSED)
- **Problem:** Testers see "Log in to Vercel" page
- **Cause:** Vercel Deployment Protection enabled
- **Solution:** User needs to disable in Vercel Settings → Deployment Protection → Vercel Authentication (set to OFF)

### Issue 5: Footer Text Removed (FIXED)
- **Problem:** User wanted to remove "Powered by OpenAI and Anthropic" footer
- **Fix Applied:** Removed entire footer section from `frontend/src/app/page.tsx`
- **Commit:** 406f5f6 "Remove footer with powered by text"

## Current Status

### Working ✅
- Frontend deployed on Vercel
- Backend deployed on Render
- Database connection established
- PDF file upload
- Health check endpoint
- GitHub repository and version control

### Needs Attention ⚠️
- **Analysis Failing:** Documents upload but analysis fails
- **Suspected Cause:** API keys (OPENAI_API_KEY, OPENROUTER_API_KEY) may be:
  1. Missing from Render environment variables
  2. Truncated/corrupted when pasted to Render
  3. Invalid or expired
- **Evidence:** One document succeeded on localhost (proving code works), but Render deployments fail
- **Next Steps:**
  1. Verify all 11 environment variables exist in Render
  2. Check for truncation (especially long API keys)
  3. Test with fresh upload after confirming variables
  4. Check Render logs for specific API error messages

### Not Yet Tested 🔜
- R2 storage integration (PDF file storage in Cloudflare)
- OpenAI moderation API calls
- Claude/OpenRouter API calls
- Complete end-to-end analysis workflow on production

## API Endpoints

### Documents
- `POST /api/documents` - Upload PDF
- `GET /api/documents` - List documents
- `GET /api/documents/:id/status` - Check processing status
- `GET /api/documents/:id/result` - Get analysis results
- `POST /api/documents/:id/ingest` - Manually trigger ingestion

### Reports
- `POST /api/reports/:id/export` - Export results (JSON, CSV, Markdown)
- `GET /api/reports/:id/preview` - Preview report

### Term Lists
- `GET /api/term-lists` - Get term lists
- `POST /api/term-lists` - Create term list
- `PUT /api/term-lists/:id` - Update term list
- `DELETE /api/term-lists/:id` - Delete term list

### Templates
- `GET /api/templates` - Get templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get specific template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Health
- `GET /health` - Backend health check (returns `{ status: 'ok', timestamp }`)

## Rating Scale

| Rating | Name | Description |
|--------|------|-------------|
| 0 | All Ages | Suitable for all audiences |
| 1 | Juvenile Advisory | Mild content, parental guidance suggested |
| 2 | Youth Advisory | Moderate content, not suitable for young children |
| 3 | Youth Restricted | Strong content, mature themes |
| 4 | Adults Only | Explicit adult content |
| 5 | Deviant Content | Extreme content requiring special handling |

## Analysis Categories

1. **Violence Score** (0-5): Physical harm, threats, combat
2. **Sexual Content Score** (0-5): Sexual themes, nudity, explicit material
3. **Profanity Score** (0-5): Curse words, offensive language
4. **Hate Speech Score** (0-5): Discrimination, slurs, prejudice
5. **Self-Harm Score** (0-5): Suicide, self-injury, eating disorders

## Common Deployment Commands

### Push Changes to GitHub
```bash
cd "/Users/godslovechinekwe/Desktop/PDF AI reviewer"
git add -A
git commit -m "Your commit message"
git push origin main
```

### Trigger Vercel Redeploy
1. Go to Vercel Dashboard → Deployments
2. Click ••• on latest deployment → Redeploy

### Trigger Render Redeploy
1. Go to Render Dashboard → Service
2. Click "Manual Deploy" → "Deploy latest commit"

### Check Backend Health
```bash
curl https://pdf-ai-reviewer.onrender.com/health
```

### View Backend Logs
Go to Render Dashboard → Service → Logs tab

## Troubleshooting Guide

### Upload Works but Analysis Fails
1. Check Render logs for error messages
2. Verify all environment variables in Render (especially API keys)
3. Test API keys are valid (not expired)
4. Confirm R2 bucket exists and credentials are correct

### CORS Errors
1. Verify `FRONTEND_URL` in Render matches Vercel URL exactly
2. Check backend logs for CORS-related errors
3. Redeploy backend after changing FRONTEND_URL

### Database Connection Errors
1. Check DATABASE_URL is complete (includes `:5432`)
2. Verify PostgreSQL service is running in Render
3. Test connection string locally

### Render Service Sleeping
- Free tier sleeps after 15min inactivity
- First request after sleep takes 30-50 seconds to wake up
- Consider upgrading to paid plan for always-on service

### TypeScript Build Errors
1. Check for missing type declarations
2. Verify all dependencies are in package.json
3. Run `npm run build` locally first
4. Check for deprecated API features

## Important Files Reference

### Configuration Files
- `backend/src/index.ts` - Main server entry, CORS config
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/config/constants.ts` - App constants
- `frontend/src/lib/api.ts` - API client configuration
- `render.yaml` - Render deployment configuration

### Key Service Files
- `backend/src/services/processing.service.ts` - Document processing pipeline
- `backend/src/services/openai.service.ts` - OpenAI moderation
- `backend/src/services/rubric.service.ts` - Claude AI rubric mapping
- `backend/src/services/r2.service.ts` - Cloudflare R2 storage

### Type Declarations
- `backend/src/types/pdf-parse.d.ts` - Custom pdf-parse types (created to fix build)

## Next Session Checklist

When starting a new session, verify:

1. ✅ **GitHub repo accessible:** https://github.com/glovejobs/pdf-ai-reviewer
2. ✅ **Vercel deployed:** https://pdf-ai-reviewer-gv5i-git-main-gloves-projects-59db17ce.vercel.app
3. ✅ **Render deployed:** https://pdf-ai-reviewer.onrender.com
4. ⚠️ **Check current issue:** Analysis failing on production (API keys suspected)
5. 🔜 **Pending tasks:**
   - Fix API keys in Render
   - Test complete analysis workflow
   - Disable Vercel authentication for public access
   - Document successful end-to-end test

## Contact & Access

- **Project Owner:** godslovechinekwe
- **GitHub Account:** glovejobs
- **Local Project Path:** `/Users/godslovechinekwe/Desktop/PDF AI reviewer`
- **Vercel Account:** Glove's projects (Hobby plan)
- **Render Account:** Godslove's Workspace

## Additional Notes

- Render free tier sleeps after 15 minutes of inactivity
- First request to sleeping service takes 30-50 seconds
- Database connection string must be complete and on one line
- Environment variables can get truncated when pasting - always verify
- TypeScript build must succeed locally before deploying to Render
- Frontend uses Next.js 15 App Router (not Pages Router)
- Backend uses Fastify (not Express)
- All API keys should start with correct prefixes (sk-proj-, sk-or-, etc.)
