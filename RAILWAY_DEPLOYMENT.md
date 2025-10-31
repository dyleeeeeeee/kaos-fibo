# Railway Deployment Guide 🚂

Complete guide to deploy the Fibonacci Compression System backend on Railway.

---

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a Git repository
3. **MongoDB Atlas**: Your MongoDB connection string from `.env`

---

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Make sure your backend has these files (✅ Already created):
- ✅ `Procfile` - Tells Railway how to run your app
- ✅ `requirements.txt` - Python dependencies
- ✅ `runtime.txt` - Python version
- ✅ `railway.json` - Railway configuration
- ✅ `.railwayignore` - Files to exclude

### Step 2: Push to GitHub (if not already)

```bash
# Initialize git (if not done)
cd backend
git init
git add .
git commit -m "Prepare for Railway deployment"

# Connect to GitHub
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 3: Deploy on Railway

#### Option A: Deploy from GitHub (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app/dashboard
   - Click **"New Project"**

2. **Deploy from GitHub**
   - Select **"Deploy from GitHub repo"**
   - Authorize Railway to access your GitHub
   - Select your `kaos-fib` repository
   - Select the `backend` folder (or root if backend is at root)

3. **Configure Environment Variables**
   - Click on your deployed service
   - Go to **"Variables"** tab
   - Add these environment variables:

   ```
   MONGO_URI=mongodb+srv://fibonacci:4Nmt9SyCCeeQCTxM@cluster0.nmjkyyf.mongodb.net/?appName=Cluster0
   DB_NAME=fibonacci_compression
   COLLECTION_NAME=compression_logs
   PORT=5000
   FLASK_DEBUG=False
   ```

   **Important**: Replace `MONGO_URI` with your actual MongoDB Atlas connection string!

4. **Railway Auto-Deploys**
   - Railway will automatically detect Python
   - It will install dependencies from `requirements.txt`
   - It will start the app using the `Procfile` command

5. **Get Your Railway URL**
   - Once deployed, click on **"Settings"** tab
   - Find **"Domains"** section
   - You'll see a URL like: `https://your-app-name.up.railway.app`
   - Click **"Generate Domain"** if not generated automatically

#### Option B: Deploy from CLI

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize and Deploy**
   ```bash
   cd backend
   railway init
   railway up
   ```

4. **Add Environment Variables**
   ```bash
   railway variables set MONGO_URI="your-mongodb-connection-string"
   railway variables set DB_NAME="fibonacci_compression"
   railway variables set COLLECTION_NAME="compression_logs"
   railway variables set FLASK_DEBUG="False"
   ```

5. **Open Deployment**
   ```bash
   railway open
   ```

### Step 4: Verify Deployment

1. **Check Deployment Logs**
   - In Railway dashboard, go to **"Deployments"** tab
   - Click on the latest deployment
   - Check logs for:
     ```
     ✓ DNS resolver configured (8.8.8.8, 1.1.1.1)
     ✓ Connected to MongoDB: fibonacci_compression
     ==================================================
     Fibonacci Compression API
     ==================================================
     Port: 5000
     Debug: False
     MongoDB: Connected
     ==================================================
     ```

2. **Test API Endpoints**
   - Open `https://your-app.up.railway.app/health`
   - Should return:
     ```json
     {
       "status": "healthy",
       "mongodb": "connected",
       "timestamp": "2025-10-31T..."
     }
     ```

3. **Test Compression**
   ```bash
   curl -X POST https://your-app.up.railway.app/compress \
     -H "Content-Type: application/json" \
     -d '{"data": [1,2,3,4,5]}'
   ```

---

## 🔧 Update Frontend Configuration

Once your Railway deployment is live, update the frontend:

### Automatic Update Script

Run this in your project root:

```bash
# Replace YOUR_RAILWAY_URL with your actual Railway URL
$RAILWAY_URL = "https://your-app.up.railway.app"

(Get-Content frontend/script.js) -replace "http://localhost:5000", "$RAILWAY_URL" | Set-Content frontend/script.js

Write-Host "✅ Frontend updated with Railway URL: $RAILWAY_URL"
```

### Manual Update

1. Open `frontend/script.js`
2. Find line 9:
   ```javascript
   API_BASE_URL: 'http://localhost:5000',
   ```

3. Replace with your Railway URL:
   ```javascript
   API_BASE_URL: 'https://your-app.up.railway.app',
   ```

4. Save the file

---

## 📊 Railway Dashboard Features

### Monitoring
- **Metrics**: CPU, memory, network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments

### Settings
- **Domains**: Custom domain support
- **Environment**: Manage environment variables
- **Service**: Restart, redeploy, delete

### Pricing
- **Free Tier**: $5 credit per month (enough for small projects)
- **Pro Plan**: $20/month for production apps

---

## 🐛 Troubleshooting

### Issue: Deployment Failed

**Check Logs**:
- Go to Railway dashboard → Deployments → Latest deployment → Logs
- Look for error messages

**Common Issues**:

1. **Missing Dependencies**
   ```
   Error: ModuleNotFoundError: No module named 'flask'
   ```
   **Fix**: Ensure `requirements.txt` is in the root of your backend folder

2. **MongoDB Connection Error**
   ```
   Error: ServerSelectionTimeoutError
   ```
   **Fix**: 
   - Check `MONGO_URI` environment variable is correct
   - Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access

3. **Port Binding Error**
   ```
   Error: Address already in use
   ```
   **Fix**: Railway automatically sets `PORT` env variable. Your app already handles this correctly.

### Issue: CORS Errors

If frontend shows CORS errors:

1. **Check CORS Configuration** in `backend/app.py`:
   ```python
   from flask_cors import CORS
   CORS(app)  # This should allow all origins
   ```

2. **Or Specify Frontend Origin**:
   ```python
   CORS(app, origins=['https://your-frontend-domain.com'])
   ```

### Issue: DNS Resolution Timeout

Your app already has DNS fix in place:
```python
# Configure DNS resolver to use Google DNS
import dns.resolver
resolver = dns.resolver.Resolver()
resolver.nameservers = ['8.8.8.8', '1.1.1.1']
dns.resolver.default_resolver = resolver
```

This should work on Railway. If issues persist:
- Use direct MongoDB connection string (not `mongodb+srv://`)
- Check Railway logs for specific DNS errors

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update compression algorithm"
git push origin main

# Railway automatically deploys the new version
```

### Rollback

If a deployment breaks:
1. Go to Railway dashboard → Deployments
2. Find a working previous deployment
3. Click **"Redeploy"**

---

## 🌐 Custom Domain (Optional)

1. **In Railway Dashboard**:
   - Go to Settings → Domains
   - Click **"Custom Domain"**
   - Enter your domain (e.g., `api.yoursite.com`)

2. **In Your Domain Registrar**:
   - Add CNAME record:
     - Name: `api` (or whatever subdomain)
     - Value: Your Railway domain (e.g., `your-app.up.railway.app`)

3. **Wait for DNS Propagation** (5-30 minutes)

---

## 📈 Production Best Practices

### 1. Environment Variables
Never commit `.env` file. Always use Railway's environment variables panel.

### 2. Database Indexes
For better performance, create indexes in MongoDB:
```javascript
db.compression_logs.createIndex({ "timestamp": -1 })
db.compression_logs.createIndex({ "compression_ratio": 1 })
```

### 3. Monitoring
Set up Railway alerts:
- Go to Settings → Notifications
- Enable notifications for deployment failures

### 4. Backup
Regularly backup MongoDB Atlas:
- MongoDB Atlas → Clusters → Backup
- Enable automated backups

### 5. Rate Limiting
Add rate limiting for production (optional):
```bash
pip install Flask-Limiter
```

---

## 📋 Deployment Checklist

Before going live:

- [ ] MongoDB Atlas has IP whitelist set to `0.0.0.0/0`
- [ ] All environment variables set in Railway
- [ ] `FLASK_DEBUG=False` for production
- [ ] Deployment successful with no errors in logs
- [ ] Health endpoint returns 200 OK
- [ ] Test compression endpoint works
- [ ] Frontend updated with Railway URL
- [ ] CORS working (frontend can call backend)
- [ ] MongoDB connected (check logs)
- [ ] Performance tested (response time < 1s)

---

## 🎉 Success!

Once deployed, your API will be available at:
- **Health Check**: `https://your-app.up.railway.app/health`
- **Compress**: `https://your-app.up.railway.app/compress`
- **Logs**: `https://your-app.up.railway.app/logs`

Update your frontend with this URL and you're live! 🚀

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Project Issues**: Check `SYSTEM_AUDIT_REPORT.md` for troubleshooting

---

**Deployment Time**: ~5-10 minutes  
**Cost**: Free tier (< $5/month usage)  
**Uptime**: 99.9%+ on Railway

Good luck with your deployment! 🚂
