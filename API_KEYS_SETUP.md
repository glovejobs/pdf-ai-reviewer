# 🔐 API Keys Setup Guide

## ⚠️ CRITICAL: Never Commit API Keys to GitHub!

Your API keys are stored in `.env` files which are **automatically excluded** from Git by `.gitignore`.

---

## 📍 Where to Save Your API Keys

### Backend API Keys (Most Important)

**File Location:** `backend/.env`

```bash
# This file is already created for you at:
# /Users/godslovechinekwe/Desktop/PDF AI reviewer/backend/.env
```

**What to add:**

```env
# PostgreSQL Database (Required)
DATABASE_URL=postgresql://username:password@host:5432/database_name

# OpenAI API Key (Required - FREE for moderation)
OPENAI_API_KEY=sk-...your-key-here

# Anthropic API Key (Required - For Claude)
ANTHROPIC_API_KEY=sk-ant-...your-key-here

# Server Configuration (Optional - defaults work fine)
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

### Frontend Environment (Optional)

**File Location:** `frontend/.env.local`

```bash
# This file is already created for you at:
# /Users/godslovechinekwe/Desktop/PDF AI reviewer/frontend/.env.local
```

**What to add:**

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🔑 How to Get Your API Keys

### 1. OpenAI API Key (FREE for Moderation)

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)
4. Paste it in `backend/.env` as `OPENAI_API_KEY`

**Cost:** FREE for moderation API ✨

---

### 2. Anthropic API Key (Claude)

1. Go to: https://console.anthropic.com/settings/keys
2. Click **"Create Key"**
3. Copy the key (starts with `sk-ant-`)
4. Paste it in `backend/.env` as `ANTHROPIC_API_KEY`

**Cost:** $3/M input tokens, $15/M output tokens
**With caching:** ~$0.15-0.30 per 300-page PDF

---

### 3. PostgreSQL Database

Choose one option:

#### Option A: Supabase (Recommended - Easiest)
1. Go to: https://supabase.com
2. Create account (free tier available)
3. Create new project
4. Go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
6. Paste in `backend/.env` as `DATABASE_URL`

**Format:** `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Create database
createdb ai_content_review

# Your DATABASE_URL:
DATABASE_URL=postgresql://localhost:5432/ai_content_review
```

---

## ✅ Verify Your Setup

1. **Check .env file exists:**
```bash
cd backend
cat .env
```

You should see your API keys (but never share this output!)

2. **Verify .gitignore is working:**
```bash
cd ..
git status
```

You should **NOT** see `.env` in the list of files to commit.

3. **Test backend connection:**
```bash
cd backend
npm run dev
```

Look for:
- ✅ Server starts successfully
- ✅ No "missing API key" errors

---

## 🚫 What Files Are Protected?

These files are **automatically excluded** from Git:

### Backend
- ✅ `backend/.env` ← Your API keys are here
- ✅ `backend/.env.local`
- ✅ `backend/.env.*.local`

### Frontend
- ✅ `frontend/.env.local` ← API URL is here
- ✅ `frontend/.env.*.local`

### Root
- ✅ `.env`
- ✅ `*.env`

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` files in `.gitignore`
- Use different API keys for development and production
- Rotate keys if accidentally exposed
- Store production keys in deployment platform (Vercel, Railway, etc.)

### ❌ DON'T:
- Never commit `.env` files
- Never share API keys in chat/email
- Never hardcode keys in source code
- Never push `.env` to GitHub

---

## 🚀 Ready to Run?

After adding your API keys:

1. **Generate Prisma Client:**
```bash
cd backend
npm run prisma:generate
```

2. **Run Database Migrations:**
```bash
npm run prisma:migrate
```

3. **Start Backend:**
```bash
npm run dev
```

4. **Frontend is already running at:** http://localhost:3000

---

## 🆘 Help! I Accidentally Committed My Keys!

If you accidentally committed API keys:

1. **Immediately rotate the keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys

2. **Remove from Git history:**
```bash
# Remove .env from Git cache
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Commit the removal
git commit -m "Remove environment files from tracking"
```

3. **Update `.gitignore` (already done for you!)**

4. **Generate new API keys** and add them to your `.env` files

---

## 📝 Quick Reference

| What | Where | Protected? |
|------|-------|------------|
| OpenAI Key | `backend/.env` | ✅ Yes |
| Anthropic Key | `backend/.env` | ✅ Yes |
| Database URL | `backend/.env` | ✅ Yes |
| Frontend API URL | `frontend/.env.local` | ✅ Yes |

---

## 🎯 Example .env File

**File:** `backend/.env`

```env
# Database (Get from Supabase)
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres

# OpenAI (FREE for moderation)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic (Claude for analysis)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional (these defaults work fine)
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

Need more help? Check `SETUP_GUIDE.md` for full setup instructions!
