# ⚡ Quick Railway Deployment

**Goal**: Deploy your backend to Railway in 5 minutes.

---

## ✅ Pre-Deployment Checklist

Before starting:
- [ ] MongoDB Atlas connection string ready (from `.env` file)
- [ ] GitHub account created
- [ ] Railway account created (https://railway.app - sign up with GitHub)
- [ ] Code committed to GitHub

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub (2 min)

If not already on GitHub:

```powershell
cd C:\Users\User\Documents\Projects\edu\kaos-fib

# Initialize git
git init
git add .
git commit -m "Initial commit - Fibonacci Compression System"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/kaos-fib.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway (2 min)

1. **Go to**: https://railway.app/dashboard
2. **Click**: "New Project"
3. **Select**: "Deploy from GitHub repo"
4. **Choose**: `kaos-fib` repository
5. **Root Directory**: Leave empty (Railway will auto-detect `backend/`)

### Step 3: Add Environment Variables (1 min)

In Railway dashboard:
1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"New Variable"** for each:

```
MONGO_URI = mongodb+srv://fibonacci:4Nmt9SyCCeeQCTxM@cluster0.nmjkyyf.mongodb.net/?appName=Cluster0
DB_NAME = fibonacci_compression
COLLECTION_NAME = compression_logs
FLASK_DEBUG = False
```

**⚠️ Important**: Use YOUR MongoDB connection string from `backend/.env`

### Step 4: Generate Domain (30 sec)

1. Go to **"Settings"** tab
2. Find **"Domains"** section
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://kaos-fib-production.up.railway.app`)

### Step 5: Verify Deployment (30 sec)

**Test Health Endpoint**:
- Open: `https://your-app.up.railway.app/health`
- Should see:
  ```json
  {
    "status": "healthy",
    "mongodb": "connected",
    "timestamp": "..."
  }
  ```

**Check Logs**:
- Railway dashboard → Deployments → Latest → Logs
- Look for:
  ```
  ✓ Connected to MongoDB: fibonacci_compression
  Fibonacci Compression API
  Port: XXXX
  MongoDB: Connected
  ```

### Step 6: Update Frontend (30 sec)

Run PowerShell script (in project root):

```powershell
.\update-frontend-url.ps1 -RailwayUrl "https://your-app.up.railway.app"
```

**Or manually** edit `frontend/script.js` line 9:
```javascript
API_BASE_URL: 'https://your-app.up.railway.app',
```

---

## ✅ Verification

Test your deployed system:

1. **Open Frontend**: `frontend/index.html` in browser
2. **Enter Data**: `1,2,3,4,5`
3. **Click COMPRESS**
4. **Verify**: 
   - ✅ Compression completes
   - ✅ Metrics display
   - ✅ History updates
   - ✅ No CORS errors in console

---

## 🐛 Troubleshooting

### Deployment Failed?

**Check Railway Logs**:
1. Dashboard → Deployments → Latest deployment → View logs
2. Look for error messages

**Common Issues**:

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError` | Missing dependencies | Check `requirements.txt` exists |
| `MongoDB timeout` | Wrong connection string | Verify `MONGO_URI` variable |
| `Address in use` | Port conflict | Railway handles PORT automatically |
| `Build failed` | Wrong Python version | Check `runtime.txt` = `python-3.11.0` |

### CORS Errors?

1. Check Railway logs show "Connected to MongoDB"
2. Verify frontend URL is updated
3. Try hard refresh: Ctrl+Shift+R

### MongoDB Not Connected?

**In MongoDB Atlas**:
1. Go to Network Access
2. Add IP: `0.0.0.0/0` (allow all)
3. Wait 2-3 minutes for propagation

---

## 📊 Post-Deployment

### Monitor Your App

**Railway Dashboard**:
- **Metrics**: View CPU, memory, network usage
- **Logs**: Real-time application logs
- **Deployments**: History and rollback options

### Enable Auto-Deploy

Railway automatically redeploys when you push to GitHub:

```powershell
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically deploys (30-60 seconds)
```

### Custom Domain (Optional)

1. Railway: Settings → Domains → "Custom Domain"
2. Enter: `api.yoursite.com`
3. Your DNS: Add CNAME → `your-app.up.railway.app`
4. Wait 5-30 min for DNS propagation

---

## 🎉 Success!

Your backend is now live at: `https://your-app.up.railway.app`

**API Endpoints**:
- Health: `https://your-app.up.railway.app/health`
- Compress: `https://your-app.up.railway.app/compress`
- Logs: `https://your-app.up.railway.app/logs`

**Frontend**: Works locally with Railway backend

---

## 💰 Cost

**Railway Free Tier**:
- $5 credit per month
- Enough for small projects
- No credit card required initially

**Usage Monitoring**:
- Dashboard → Usage
- See current month's consumption

---

## 📚 Resources

- **Full Guide**: `RAILWAY_DEPLOYMENT.md`
- **Railway Docs**: https://docs.railway.app
- **Support**: https://discord.gg/railway

---

**Total Time**: ~5 minutes  
**Difficulty**: Easy  
**Cost**: Free (with $5/month credit)

🚂 Happy Deploying!
