# Bema Geetz - Beginner Hosting Guide (cPanel/Shared Hosting)

## 🎯 Overview
You're using shared hosting (cPanel-style). Here's how to deploy WITHOUT command line.

**Architecture:**
- **Backend (API)**: Deploy to Render.com (free, handles Node.js)
- **Frontend**: Upload to your shared hosting via File Manager
- **Database**: Use your hosting's MySQL or Render's PostgreSQL

---

## 📋 Step-by-Step Deployment

## STEP 1: Deploy Backend API (Render.com - 15 mins)

### 1.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "PostgreSQL"
   - Name: `bema-geetz-db`
   - Region: Choose closest to your users
   - Plan: **Free**
   - Click "Create Database"
4. Wait 2 minutes, then click your database
5. **Copy the "Internal Database URL"** (save it!)

### 1.2 Deploy Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `bema-geetz-api`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. Click "Advanced" → Add Environment Variables:
   ```
   DATABASE_URL=postgresql://...(paste from step 1.1)
   JWT_SECRET=your-super-secret-random-string-here
   FRONTEND_URL=https://yourdomain.com  (your actual domain)
   WHATSAPP_NUMBER=254708771345
   NODE_ENV=production
   PORT=10000
   ```
5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. **Copy your API URL**: `https://bema-geetz-api.onrender.com` (save it!)

---

## STEP 2: Prepare Frontend Files (5 mins)

### 2.1 Create Environment File
On your computer, create a file named `.env.production` inside the `frontend` folder:

```env
VITE_API_URL=https://bema-geetz-api.onrender.com/api
VITE_WHATSAPP=254708771345
```

Replace `bema-geetz-api.onrender.com` with your actual Render URL.

### 2.2 Build Frontend
1. Open terminal in VS Code
2. Run these commands:
```bash
cd frontend
npm install
npm run build
```

3. Wait for build to complete
4. You'll see a new `dist` folder created

---

## STEP 3: Upload to Your Hosting (10 mins)

### 3.1 Access File Manager
1. Log into your hosting control panel
2. Click **"File Manager"**
3. Navigate to `public_html` (or `www` or `htdocs`)
4. **DELETE** any existing files (or move to backup)

### 3.2 Upload Build Files
**Option A - File Manager Upload:**
1. In File Manager, click **"Upload"** button
2. Select ALL files from your `frontend/dist` folder
3. Upload them to `public_html`

**Option B - ZIP Upload (Faster):**
1. On your computer, ZIP the entire `frontend/dist` folder
2. In File Manager, click **"Upload"** → Select your ZIP file
3. After upload, right-click ZIP → **"Extract"**
4. Move extracted files to `public_html` if needed
5. Delete the ZIP file

### 3.3 Verify Upload
- You should see `index.html` in `public_html`
- You should see an `assets` folder

---

## STEP 4: Configure Domain (5 mins)

### 4.1 Point Domain to Hosting
1. In your hosting panel, click **"Domains"**
2. Make sure your domain points to the hosting account
3. If using external domain registrar, update nameservers to your hosting's nameservers

### 4.2 Wait for DNS (5-30 minutes)
- DNS propagation takes time
- Test by visiting: `https://yourdomain.com`
- You should see your website (but API calls won't work yet)

---

## STEP 5: Create Database Tables (10 mins)

### Option A: Using phpMyAdmin (If using MySQL)
1. In hosting panel, click **"phpMyAdmin"**
2. Create a database (or use existing)
3. Click "Import" tab
4. Select `database/schema.sql` from your computer
5. Click "Go"

### Option B: Using Render PostgreSQL (Recommended)
1. Go back to Render.com → your database
2. Click "Connect" button
3. Use PSQL command or connect via pgAdmin
4. Run the SQL files from `database/` folder

---

## STEP 6: Test Everything (5 mins)

### 6.1 Test Frontend
- Visit `https://yourdomain.com`
- You should see the homepage
- Check browser console (F12) for errors

### 6.2 Test API
- Visit: `https://bema-geetz-api.onrender.com/api/health`
- Should return: `{"status":"Bema Geetz API running",...}`

### 6.3 Test Full Flow
1. Create a test listing on your website
2. Upload an image
3. Check if it displays
4. Check Render logs if issues

---

## 🎨 Step 7: SSL Certificate (Free - 5 mins)

### Using Your Hosting
1. In control panel, click **"SSL Certificates"**
2. Look for "Let's Encrypt" or "AutoSSL"
3. Select your domain
4. Click "Issue" or "Install"
5. Wait 2-5 minutes
6. Test: `https://yourdomain.com` should show padlock 🔒

### Or Use Cloudflare (Recommended)
1. Sign up at [cloudflare.com](https://cloudflare.com)
2. Add your domain
3. Change nameservers to Cloudflare's
4. Enable "Always Use HTTPS"
5. Free SSL + CDN + Security!

---

## 🔧 Maintenance Tasks

### Update Your Website (After code changes)
1. Make changes in VS Code
2. Push to GitHub
3. Render will auto-deploy backend (if connected to GitHub)
4. For frontend:
   - Run `npm run build` in frontend folder
   - Re-upload `dist` folder via File Manager

### Backup Your Data
1. **Database**: Use phpMyAdmin → Export
2. **Uploads**: File Manager → Download `uploads` folder
3. **Store backups** on your computer

### Check Logs
- **Render**: Dashboard → Logs tab
- **Hosting**: cPanel → "Error Logs" or "Site Summary & Logs"

---

## 🆘 Troubleshooting

### "Website shows blank page"
- Check File Manager - is `index.html` in `public_html`?
- Check browser console (F12) for red errors
- Make sure you uploaded `dist` contents, not the folder itself

### "API not working / CORS error"
- Check Render Web Service is "Live" (green)
- Update `FRONTEND_URL` in Render env vars to match your domain
- Restart Render service

### "Images not uploading"
- Check Render has disk configured (add in dashboard)
- Check `uploads` folder exists on Render
- Check file size limits (max 50MB)

### "Database connection failed"
- Verify DATABASE_URL in Render env vars
- Check database is running on Render
- Test connection from Render shell

---

## 📞 Quick Reference

### Important URLs
| Service | URL |
|---------|-----|
| Your Website | `https://yourdomain.com` |
| API | `https://bema-geetz-api.onrender.com/api` |
| Render Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Hosting Panel | Your hosting provider |

### File Locations
| Location | Path |
|----------|------|
| Frontend files | `public_html/` |
| Backend files | Render.com (cloud) |
| Database | Render PostgreSQL or hosting MySQL |
| Uploads | Render disk or hosting file manager |

---

## ✅ Pre-Launch Checklist

- [ ] Backend deployed on Render and running
- [ ] Frontend uploaded to hosting `public_html`
- [ ] Domain pointing to hosting
- [ ] SSL certificate installed
- [ ] Database connected and tables created
- [ ] Environment variables set correctly
- [ ] Test listing created successfully
- [ ] Images uploading and displaying
- [ ] Booking flow tested
- [ ] Mobile view tested

---

## 🎉 You're Live!

Once everything checks out, your Bema Geetz platform is ready for customers!

**Next Steps:**
- Setup Google Analytics
- Create social media pages
- Start marketing!

**Need Help?**
- Render Docs: [render.com/docs](https://render.com/docs)
- Contact your hosting support
- Check GitHub issues

**Good luck! 🚀**
