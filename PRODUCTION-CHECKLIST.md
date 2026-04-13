# Bema Geetz - Production Deployment Checklist

## ✅ Pre-Deployment Tasks

### 1. Environment Variables Setup

#### Backend Environment Variables (`.env` file - NEVER commit this)
```
PORT=10000
DATABASE_URL=postgresql://user:password@host:5432/bemageetz
JWT_SECRET=your-super-secret-long-random-string-min-32-chars
FRONTEND_URL=https://your-frontend-domain.com
WHATSAPP_NUMBER=254708771345
NODE_ENV=production
```

#### Frontend Environment Variables (`.env.production`)
```
VITE_API_URL=https://your-api-domain.com/api
VITE_WHATSAPP=254708771345
```

### 2. Database Migration
- [ ] Run `database/schema.sql` on production PostgreSQL
- [ ] Run `database/fix-schema.sql` for any updates
- [ ] Verify connection from production server

### 3. File Uploads / Persistent Storage
- [ ] Verify uploads directory exists and is writable
- [ ] For Render: Disk is configured in `render.yaml` (1GB included)
- [ ] For VPS: Ensure volume is mounted at `backend/uploads/`
- [ ] For AWS/GCP: Consider migrating to S3/GCS for scalability

### 4. Security Checklist
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] CORS is configured for production domain
- [ ] Rate limiting is enabled (already done)
- [ ] Helmet.js headers are active (already done)
- [ ] No hardcoded passwords in code

---

## 🚀 Deployment Options

### Option A: Render.com (Recommended - Easiest)

#### Step 1: Create Database
1. Go to [render.com](https://render.com) → New → PostgreSQL
2. Name: `bema-geetz-db`
3. Region: Choose closest to your users
4. Plan: Free (or Starter for production)
5. Copy the "Internal Database URL" for later

#### Step 2: Deploy Backend
1. New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `bema-geetz-api`
   - **Environment**: Node
   - **Region**: Same as database
   - **Branch**: master
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add Environment Variables:
   - `DATABASE_URL`: (from step 1)
   - `JWT_SECRET`: (generate random string)
   - `FRONTEND_URL`: (your frontend URL after step 3)
   - `WHATSAPP_NUMBER`: 254708771345
5. Click "Create Web Service"

#### Step 3: Deploy Frontend
1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com)
2. Import your GitHub repo
3. Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `frontend`
4. Add Environment Variable:
   - `VITE_API_URL`: (your Render backend URL + /api)
5. Deploy!

#### Step 4: Update CORS
Update `backend/server.js` CORS config with your actual frontend domain:
```javascript
if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
```

---

### Option B: Docker on VPS (DigitalOcean, AWS, etc.)

#### Step 1: Provision Server
- Ubuntu 22.04 LTS
- 2GB RAM minimum (4GB recommended)
- Docker & Docker Compose installed

#### Step 2: Clone & Configure
```bash
git clone https://github.com/DenisMutembei/Bema-Geetz.git
cd Bema-Geetz

# Create .env file
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://your-domain.com
WHATSAPP_NUMBER=254708771345
EOF
```

#### Step 3: Configure docker-compose.yml
Update the DATABASE_URL with your external DB or use the included PostgreSQL.

#### Step 4: Deploy
```bash
docker-compose up -d
```

#### Step 5: Setup SSL (Let's Encrypt)
```bash
docker-compose stop nginx
# Install certbot and get certificates
docker-compose start nginx
```

---

## 🔍 Post-Deployment Verification

### Health Checks
- [ ] API health endpoint: `GET /api/health` returns 200
- [ ] Database connection working
- [ ] Image uploads working (test upload)
- [ ] Booking creation working (test booking)

### Frontend Verification
- [ ] Homepage loads with listings
- [ ] Images display correctly
- [ ] Login/Register works
- [ ] Booking flow works end-to-end
- [ ] Mobile responsive design works

### Security Verification
- [ ] HTTPS is working (SSL certificate)
- [ ] API rate limiting active (test with rapid requests)
- [ ] CORS blocking unauthorized origins
- [ ] JWT tokens expiring correctly

---

## 📊 Monitoring & Maintenance

### Logs
- Backend logs: `docker-compose logs -f backend` (Docker) or Render dashboard
- Frontend errors: Browser console + Vercel/Netlify analytics

### Database Backups
- Render: Automatic daily backups (configure in dashboard)
- VPS: Set up cron job with `pg_dump`

### File Backups (Uploads)
- Render: Disk snapshots
- VPS: Regular backups of `backend/uploads/` directory
- Consider: Migrate to S3 for durability

### Updates
- Keep dependencies updated: `npm audit fix`
- Monitor security advisories for Node.js, PostgreSQL
- Test updates in staging first

---

## 🆘 Troubleshooting

### "Failed to connect to database"
- Check DATABASE_URL format
- Verify network access (firewall rules)
- Check SSL settings for production

### "Images not displaying"
- Check uploads directory permissions
- Verify disk/storage is mounted
- Check image URLs in database (should be `/uploads/filename`)

### "CORS errors"
- Update FRONTEND_URL environment variable
- Check CORS config in `server.js`
- Ensure protocol matches (http vs https)

### "JWT errors"
- Verify JWT_SECRET is set and consistent
- Check token expiration times
- Clear browser localStorage and re-login

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Docker Docs**: https://docs.docker.com
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## 🎉 Post-Launch

- [ ] Add Google Analytics / Plausible
- [ ] Setup uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error tracking (Sentry)
- [ ] Add social media links
- [ ] Test WhatsApp integration
- [ ] Review and respond to first bookings

**Good luck with your launch! 🚀**
