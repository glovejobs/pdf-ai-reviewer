# Quick Setup Guide

## Current Status

✅ **Frontend**: Running at http://localhost:3000
⚠️ **Backend**: Needs database and API keys

## What You Need

### 1. PostgreSQL Database
You need a PostgreSQL database. Choose one option:

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb ai_content_review
```

**Option B: Cloud Database (Recommended for beginners)**
- [Supabase](https://supabase.com) - Free tier available
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Railway](https://railway.app) - Easy setup

### 2. API Keys (Required for backend to work)

You need TWO API keys:

**OpenAI API Key**
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

**Anthropic API Key**
1. Go to https://console.anthropic.com/settings/keys
2. Create new API key
3. Copy the key

### 3. Configure Backend

Edit `backend/.env`:

```env
# Required: Update these values
DATABASE_URL=postgresql://user:password@localhost:5432/ai_content_review
OPENAI_API_KEY=sk-...your-key-here
ANTHROPIC_API_KEY=sk-ant-...your-key-here

# Optional: Keep defaults
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Set Up Database Schema

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run at http://localhost:3001

## Testing the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:3001/health
3. **Upload a PDF** and watch the magic happen!

## Common Issues

### "Cannot connect to database"
- Check your DATABASE_URL in backend/.env
- Make sure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

### "OpenAI API error"
- Verify your OPENAI_API_KEY is correct
- Check you have credits: https://platform.openai.com/usage

### "Anthropic API error"
- Verify your ANTHROPIC_API_KEY is correct
- Check your account status

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Kill process on port 3001
lsof -ti:3001 | xargs kill
```

## Quick Start (If you have everything)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (already running)
# Just visit http://localhost:3000
```

## What Works Right Now

✅ Frontend UI (upload, progress, results)
✅ All UI components
✅ API client setup
⚠️ Backend API (needs database + API keys)
⚠️ PDF processing (needs OpenAI + Anthropic)

## Next Steps

1. Get a PostgreSQL database (easiest: Supabase free tier)
2. Get API keys (OpenAI + Anthropic)
3. Update backend/.env with your credentials
4. Run database migrations
5. Start backend server
6. Upload your first PDF!

---

Need help? Check the main README.md for detailed documentation.
