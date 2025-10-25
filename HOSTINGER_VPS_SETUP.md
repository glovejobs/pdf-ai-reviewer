# 🚀 Hostinger VPS Deployment Guide

## 🎯 Optimal Architecture Using Your Hostinger VPS

You have a Hostinger VPS! This is actually **MUCH BETTER** than using Render. Here's why:

```
┌─────────────────────────────────────────────────────────┐
│                    USER UPLOADS PDF                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Frontend (Cloudflare Pages - FREE)                    │
│   - Next.js application                                  │
│   - Global CDN                                           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Hostinger VPS (Your Existing Server!)                 │
│   ┌─────────────────────────────────────────────────┐   │
│   │ Backend API (Fastify)         Port 3001        │   │
│   │ PostgreSQL Database           Port 5432        │   │
│   │ Redis (for queuing)          Port 6379        │   │
│   │ Nginx (reverse proxy)        Port 80/443      │   │
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│   Cloudflare R2 (PDF Storage)                            │
│   - $0.015/GB storage                                    │
│   - Zero egress fees                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Comparison

### Option 1: Hostinger VPS (RECOMMENDED) ✅

| Service | Cost | What You Get |
|---------|------|--------------|
| **Hostinger VPS** | $4-12/month | EVERYTHING (backend, database, Redis) |
| **Cloudflare R2** | $0.015/GB | PDF storage (~$1.50 for 100GB) |
| **Cloudflare Pages** | FREE | Frontend hosting + CDN |
| **OpenAI Moderation** | FREE | Content classification |
| **Claude API** | $0.30/PDF | AI analysis (with caching) |

**Total: ~$5-13/month + $0.30 per PDF** 🎉

### Option 2: Multiple Cloud Services

| Service | Cost | What You Get |
|---------|------|--------------|
| Supabase Pro | $25/month | Database only |
| Render Standard | $7/month | Backend only |
| Cloudflare R2 | $1.50/month | Storage |
| Cloudflare Pages | FREE | Frontend |

**Total: ~$33.50/month + $0.30 per PDF**

**SAVINGS WITH HOSTINGER VPS: ~$20/month!** 💰

---

## 🏗️ Hostinger VPS Setup

### Prerequisites Check

**SSH into your VPS:**
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

**Check what you have:**
```bash
# Check OS
cat /etc/os-release

# Check resources
free -h
df -h
```

---

## 📋 Step-by-Step VPS Setup

### Step 1: Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install Redis (for job queuing)
sudo apt install -y redis-server

# Install PM2 (process manager)
sudo npm install -g pm2

# Verify installations
node --version
npm --version
psql --version
nginx -v
redis-cli --version
```

---

### Step 2: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console:
CREATE DATABASE ai_content_review;
CREATE USER review_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE ai_content_review TO review_user;
\q

# Test connection
psql -U review_user -d ai_content_review -h localhost
# Enter password when prompted
# If it works, type \q to exit

# Your DATABASE_URL for .env:
# postgresql://review_user:your_secure_password_here@localhost:5432/ai_content_review
```

---

### Step 3: Setup Redis

```bash
# Enable and start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server

# Test Redis
redis-cli ping
# Should return: PONG
```

---

### Step 4: Deploy Backend to VPS

```bash
# Create app directory
sudo mkdir -p /var/www/ai-content-review
sudo chown -R $USER:$USER /var/www/ai-content-review
cd /var/www/ai-content-review

# Clone your repository (after you push to GitHub)
git clone https://github.com/YOUR-USERNAME/ai-content-review.git .

# Or upload files via SCP:
# From your local machine:
# scp -r /Users/godslovechinekwe/Desktop/"PDF AI reviewer"/backend/* user@vps-ip:/var/www/ai-content-review/

# Install backend dependencies
cd /var/www/ai-content-review/backend
npm install

# Create production .env file
nano .env
```

**Add to VPS `.env`:**
```env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database (localhost since it's on same VPS)
DATABASE_URL=postgresql://review_user:your_secure_password_here@localhost:5432/ai_content_review

# API Keys
OPENAI_API_KEY=sk-...your-key
ANTHROPIC_API_KEY=sk-ant-...your-key

# Redis (localhost)
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudflare R2 Storage
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=ai-content-pdfs
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Frontend URL (will be your Cloudflare Pages URL)
FRONTEND_URL=https://your-app.pages.dev
```

**Run migrations:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

**Build the backend:**
```bash
npm run build
```

---

### Step 5: Setup PM2 Process Manager

```bash
# Start backend with PM2
pm2 start dist/index.js --name ai-content-review-api

# Setup PM2 to start on boot
pm2 startup
pm2 save

# Check status
pm2 status
pm2 logs ai-content-review-api

# Useful PM2 commands:
# pm2 restart ai-content-review-api
# pm2 stop ai-content-review-api
# pm2 delete ai-content-review-api
```

---

### Step 6: Setup Nginx Reverse Proxy

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/ai-content-review
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your VPS IP

    # Increase upload size for PDFs
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout settings for long PDF processing
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

**Enable the site:**
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/ai-content-review /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

### Step 7: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will auto-renew. Test renewal:
sudo certbot renew --dry-run
```

---

### Step 8: Setup Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow ssh
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🚀 Deploy Frontend to Cloudflare Pages

### Option 1: Via GitHub (Recommended)

```bash
# Push your code to GitHub first
cd /Users/godslovechinekwe/Desktop/"PDF AI reviewer"
git add .
git commit -m "Deploy to production"
git push

# Then:
# 1. Go to: https://dash.cloudflare.com
# 2. Pages → Create a project
# 3. Connect to Git → Select your repository
# 4. Configure build:
#    - Framework preset: Next.js
#    - Build command: npm run build
#    - Build output directory: .next
#    - Root directory: frontend
# 5. Add environment variable:
#    NEXT_PUBLIC_API_URL = https://your-domain.com
#    (or http://your-vps-ip if no domain)
```

### Option 2: Direct Upload

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build frontend
cd frontend
npm run build

# Deploy
wrangler pages deploy .next
```

---

## 🔧 Maintenance Commands

### Monitoring

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs ai-content-review-api

# Monitor resources
pm2 monit

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check disk space
df -h

# Check memory
free -h
```

### Updates

```bash
# Pull latest code
cd /var/www/ai-content-review
git pull

# Update dependencies
cd backend
npm install

# Run migrations (if any)
npm run prisma:migrate

# Rebuild
npm run build

# Restart PM2
pm2 restart ai-content-review-api
```

---

## 📊 Performance Optimization

### Enable Gzip in Nginx

Add to your Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Setup Swap (if low RAM)

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🔐 Security Checklist

```bash
# ✅ Change default SSH port (optional)
sudo nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
sudo systemctl restart sshd

# ✅ Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# ✅ Setup SSH keys (disable password auth)
# ✅ Enable firewall (UFW)
# ✅ Regular updates
sudo apt update && sudo apt upgrade -y

# ✅ Setup fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

---

## 🎯 Final Architecture Summary

**What's on Hostinger VPS:**
- ✅ Backend API (Fastify)
- ✅ PostgreSQL Database
- ✅ Redis (job queue)
- ✅ Nginx (reverse proxy)
- ✅ PM2 (process manager)
- ✅ SSL Certificate

**What's External:**
- ✅ Frontend (Cloudflare Pages - FREE)
- ✅ PDF Storage (Cloudflare R2 - ~$1.50/month)
- ✅ OpenAI API (FREE for moderation)
- ✅ Claude API (~$0.30/PDF)

**Total Cost: ~$5-13/month + $0.30 per PDF**

---

## 🚀 Quick Start Guide

### For Development (NOW)
```bash
# Local machine - use Supabase database
DATABASE_URL=postgresql://postgres:...@db.xxx.supabase.co:5432/postgres
```

### For Production (Later - on VPS)
```bash
# VPS - use localhost database
DATABASE_URL=postgresql://review_user:password@localhost:5432/ai_content_review
```

---

Need help setting up your Hostinger VPS? Let me know your VPS specifications (RAM, CPU, OS) and I'll give you optimized setup commands!
