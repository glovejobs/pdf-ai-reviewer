# 🔐 Cloudflare R2 Storage Setup Guide

## Step-by-Step: Get Your Cloudflare R2 Credentials

### Step 1: Access Cloudflare Dashboard

```bash
1. Go to: https://dash.cloudflare.com
2. Login with your Cloudflare account
3. Click on "R2" in the left sidebar
```

If you don't see R2, you may need to:
- Click on your account name (top left)
- Look for "R2 Object Storage" in the sidebar

---

### Step 2: Create an R2 Bucket

```bash
1. In R2 Dashboard, click "Create bucket"
2. Bucket name: ai-content-pdfs (or whatever you prefer)
3. Location: Automatic (or choose closest to you)
4. Click "Create bucket"
```

**Save this information:**
- Bucket name: `ai-content-pdfs`
- Bucket endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

---

### Step 3: Get R2 API Token

#### Method A: Create R2 API Token (Recommended)

```bash
1. In R2 Dashboard, click "Manage R2 API Tokens"
   (or go directly to: https://dash.cloudflare.com/?to=/:account/r2/api-tokens)

2. Click "Create API Token"

3. Configure token:
   - Token name: "AI Content Review API"
   - Permissions:
     ✅ Object Read & Write
   - TTL: Forever (or set expiry if you prefer)
   - Specific buckets: Select "ai-content-pdfs" (or apply to all)

4. Click "Create API Token"

5. COPY THESE VALUES IMMEDIATELY (shown only once!):
   ✅ Access Key ID
   ✅ Secret Access Key
   ✅ Endpoint URL
```

#### Method B: Use Existing Access Keys

If you already have access keys:
```bash
1. In Cloudflare Dashboard
2. R2 → Manage R2 API Tokens
3. Click on existing token to view
4. Copy: Access Key ID & Secret Access Key
```

---

### Step 4: Get Your Account ID

```bash
1. In Cloudflare Dashboard (any page)
2. Look at the URL or right sidebar
3. Account ID is visible (format: 32-character hex string)

OR

1. Go to: https://dash.cloudflare.com
2. Click on "R2"
3. Your Account ID is in the URL:
   https://dash.cloudflare.com/<ACCOUNT_ID>/r2
```

---

### Step 5: Add to Your `.env` File

Open `backend/.env` (the file you already have open) and add these lines:

```env
# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=your_32_character_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Alternative format (some SDKs use this):
CLOUDFLARE_ACCOUNT_ID=your_32_character_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
```

**Example (with fake values):**
```env
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
R2_ACCESS_KEY_ID=f3d2e1c0b9a8f7e6d5c4b3a2
R2_SECRET_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=https://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.r2.cloudflarestorage.com
```

---

## 🔒 Security Notes

### ✅ These credentials ARE protected:
- `.env` file is in `.gitignore`
- Will NEVER be committed to GitHub
- Stored only on your local machine

### ⚠️ IMPORTANT Security Rules:
1. **Never share** these keys in chat/email
2. **Never commit** them to Git
3. **Rotate keys** if accidentally exposed
4. **Use different keys** for dev vs production

---

## 🧪 Test Your R2 Connection

After adding credentials to `.env`, test the connection:

```bash
cd backend
node -e "
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

client.send(new ListBucketsCommand({}))
  .then(() => console.log('✅ R2 Connection Success!'))
  .catch(err => console.error('❌ R2 Connection Failed:', err.message));
"
```

---

## 📝 Complete `.env` File Example

Your `backend/.env` should now look like this:

```env
# Server Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres

# AI API Keys
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
# OR if using OpenRouter:
OPENROUTER_API_KEY=sk-or-xxxxx

# Cloudflare R2 Storage
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
R2_ACCESS_KEY_ID=f3d2e1c0b9a8f7e6d5c4b3a2
R2_SECRET_ACCESS_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=https://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6.r2.cloudflarestorage.com
```

---

## 🔧 Alternative: Use Cloudflare API Token

If you prefer using Cloudflare API Token instead:

```bash
1. Cloudflare Dashboard → My Profile (top right)
2. API Tokens → Create Token
3. Use template: "Edit Cloudflare Workers"
   OR Create Custom Token with:
   - Account - R2 - Edit
4. Copy the token

Add to .env:
CLOUDFLARE_API_TOKEN=your_token_here
```

---

## 📊 R2 Pricing (for reference)

| Operation | Cost |
|-----------|------|
| Storage | $0.015/GB/month |
| Class A Operations (write) | $4.50 per million |
| Class B Operations (read) | $0.36 per million |
| Egress (downloads) | **FREE** (this is the big advantage!) |

**Example:**
- 100GB storage: $1.50/month
- 10,000 PDF uploads: ~$0.045
- 100,000 PDF downloads: **FREE** (vs $9 on AWS S3)

---

## 🚀 Next Steps

After adding R2 credentials:

1. ✅ Save your `.env` file
2. ✅ Install AWS SDK (already in package.json)
3. ✅ The storage service will use R2 automatically
4. ✅ Test backend: `npm run dev`

---

## ❓ Troubleshooting

### "Access Denied" Error
- Check your Access Key ID and Secret Access Key
- Verify bucket permissions in R2 dashboard
- Ensure bucket name matches exactly

### "Endpoint not found"
- Verify your Account ID is correct
- Check endpoint URL format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### "Invalid credentials"
- Make sure no extra spaces in .env file
- Keys should not have quotes around them
- Regenerate token if needed

---

## 🔄 How to Rotate/Change Keys

If you need to change your R2 credentials:

```bash
1. Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Click on your token
3. Click "Regenerate" or "Delete" and create new
4. Update .env file with new credentials
5. Restart backend server
```

---

Need help? The credentials go in:
- **File:** `backend/.env`
- **Protected:** Yes (in .gitignore)
- **Never commit:** The .env file to GitHub!
