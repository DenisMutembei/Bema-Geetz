# Bema Geetz - Shujaa Host Deployment Guide

## 🎯 Overview
Deploy Bema Geetz to your Shujaa Host VPS with your own domain name.

---

## 📋 Prerequisites

- [ ] Domain name registered and pointed to your Shujaa Host server
- [ ] VPS/Server access (SSH credentials from Shujaa Host)
- [ ] Ubuntu 20.04/22.04 LTS on server
- [ ] Root or sudo access

---

## 🚀 Step 1: Server Setup

### Connect to Your Server
```bash
ssh root@your-server-ip
# or
ssh user@your-domain.com
```

### Update System
```bash
apt update && apt upgrade -y
```

### Install Required Packages
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git

# Verify installations
node --version  # Should show v18.x
npm --version
psql --version
nginx -v
```

---

## 🗄️ Step 2: Database Setup

### Create Database & User
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE bemageetz;

# Create user (replace with secure password)
CREATE USER bemageetz_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bemageetz TO bemageetz_user;

# Exit
\q
```

### Configure PostgreSQL for Remote (if needed)
```bash
# Edit pg_hba.conf
nano /etc/postgresql/14/main/pg_hba.conf

# Add this line (for local connections)
local   all             all                                     md5

# Restart PostgreSQL
systemctl restart postgresql
```

---

## 📦 Step 3: Deploy Backend

### Create App Directory
```bash
mkdir -p /var/www/bema-geetz
cd /var/www/bema-geetz
```

### Clone Your Repository
```bash
git clone https://github.com/DenisMutembei/Bema-Geetz.git .
```

### Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
nano .env
```

Add this to `.env`:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://bemageetz_user:your_secure_password_here@localhost:5432/bemageetz
JWT_SECRET=your_super_secret_random_string_min_32_chars
FRONTEND_URL=https://yourdomain.com
WHATSAPP_NUMBER=254708771345
```

### Create Uploads Directory
```bash
mkdir -p uploads
chmod 755 uploads
```

### Initialize Database
```bash
# Run schema
psql -U bemageetz_user -d bemageetz -f ../database/schema.sql

# Run fixes
psql -U bemageetz_user -d bemageetz -f ../database/fix-schema.sql
```

### Start Backend with PM2
```bash
# Start the app
pm2 start server.js --name "bema-api"

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command PM2 outputs
```

### Test Backend
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"Bema Geetz API running",...}
```

---

## 🌐 Step 4: Configure Nginx

### Create Nginx Config
```bash
nano /etc/nginx/sites-available/bema-geetz
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static uploads
    location /uploads/ {
        alias /var/www/bema-geetz/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend (we'll build this next)
    location / {
        root /var/www/bema-geetz/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

### Enable Site
```bash
# Create symlink
ln -s /etc/nginx/sites-available/bema-geetz /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## 🎨 Step 5: Build & Deploy Frontend

### Build Frontend
```bash
cd /var/www/bema-geetz/frontend

# Install dependencies
npm install

# Create production env file
nano .env.production
```

Add to `.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
VITE_WHATSAPP=254708771345
```

### Build
```bash
npm run build

# The dist folder is now ready
```

### Verify Frontend Files
```bash
ls -la /var/www/bema-geetz/frontend/dist
# Should see index.html and assets folder
```

---

## 🔒 Step 6: SSL Certificate (HTTPS)

### Install Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### Get SSL Certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Auto-renewal
```bash
# Test auto-renewal
certbot renew --dry-run
```

---

## 🔥 Step 7: Firewall Setup

### Configure UFW
```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 🧪 Step 8: Testing

### Test API Endpoints
```bash
# Health check
curl https://yourdomain.com/api/health

# Listings
curl https://yourdomain.com/api/listings
```

### Test Frontend
1. Open browser: `https://yourdomain.com`
2. Check console for errors
3. Test image uploads
4. Test booking flow

---

## 🔄 Step 9: Git Auto-Deploy (Optional)

### Setup Webhook for Auto-Deployment
```bash
# Create deploy script
nano /var/www/bema-geetz/deploy.sh
```

Add:
```bash
#!/bin/bash
cd /var/www/bema-geetz
git pull origin master

# Update backend
cd backend
npm install
pm2 restart bema-api

# Update frontend
cd ../frontend
npm install
npm run build

echo "Deployment complete at $(date)"
```

Make executable:
```bash
chmod +x /var/www/bema-geetz/deploy.sh
```

---

## 📊 Maintenance Commands

### View Logs
```bash
# Backend logs
pm2 logs bema-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Restart Services
```bash
# Restart backend
pm2 restart bema-api

# Restart Nginx
systemctl restart nginx

# Restart PostgreSQL
systemctl restart postgresql
```

### Database Backup
```bash
# Create backup
pg_dump -U bemageetz_user -d bemageetz > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U bemageetz_user -d bemageetz < backup_20240101.sql
```

### Update Code
```bash
cd /var/www/bema-geetz
git pull origin master

# Update backend
cd backend
npm install
pm2 restart bema-api

# Update frontend
cd ../frontend
npm install
npm run build
```

---

## 🆘 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL running
systemctl status postgresql

# Check connection
sudo -u postgres psql -c "\l"

# Check user permissions
sudo -u postgres psql -c "\du"
```

### "Nginx 502 Bad Gateway"
```bash
# Check backend running
pm2 status
pm2 logs bema-api

# Check port 5000
netstat -tlnp | grep 5000
```

### "Images not loading"
```bash
# Check uploads directory exists
ls -la /var/www/bema-geetz/backend/uploads/

# Check permissions
chmod 755 /var/www/bema-geetz/backend/uploads/
chown -R www-data:www-data /var/www/bema-geetz/backend/uploads/
```

### "CORS errors in browser"
- Update `FRONTEND_URL` in backend `.env` to match your domain
- Restart backend: `pm2 restart bema-api`

### "SSL certificate issues"
```bash
# Renew certificate manually
certbot renew --force-renewal

# Check certificate status
certbot certificates
```

---

## 📞 Shujaa Host Specific Notes

### If Using Shujaa Host Control Panel
1. **Domain**: Point your domain A-record to your server IP
2. **SSL**: May be available via control panel (use that instead of Certbot if provided)
3. **Database**: May have phpPgAdmin for database management
4. **File Manager**: Can use instead of SSH for file uploads

### Contact Shujaa Host Support For:
- Opening port 5000 (if needed for direct backend access)
- PostgreSQL installation (if not available)
- Root access (if not provided)
- Dedicated IP (for SSL)

---

## ✅ Post-Deployment Checklist

- [ ] Website loads on your domain with HTTPS
- [ ] API health check returns 200
- [ ] Listings display correctly
- [ ] Images upload and display
- [ ] Booking flow works end-to-end
- [ ] WhatsApp integration working
- [ ] Email notifications (if configured)
- [ ] SSL certificate valid
- [ ] Mobile responsive
- [ ] Login/Register working

---

## 🎉 You're Live!

Your Bema Geetz platform is now deployed on your domain!

**Next Steps:**
- Add Google Analytics
- Setup uptime monitoring
- Configure WhatsApp Business
- Start marketing your platform!

**Support:**
- Shujaa Host: support@shujaahost.co.ke
- This guide: Keep it handy for updates!

---

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Deploy updates | `cd /var/www/bema-geetz && ./deploy.sh` |
| View logs | `pm2 logs bema-api` |
| Restart backend | `pm2 restart bema-api` |
| Backup DB | `pg_dump -U bemageetz_user bemageetz > backup.sql` |
| Check status | `pm2 status` |
| Nginx test | `nginx -t` |

**Good luck with your launch! 🚀**
