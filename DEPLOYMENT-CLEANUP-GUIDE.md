# Deployment Cleanup Guide
## Files to EXCLUDE when uploading to hosting

---

## 🚫 **NEVER Upload These Files**

### Development Files
```
frontend/node_modules/          (Huge! 500MB+)
frontend/.git/                  (Git history)
frontend/.env                   (Secrets!)
frontend/.env.local
frontend/.env.development
frontend/npm-debug.log
frontend/yarn-error.log
frontend/package-lock.json     (Optional - can regenerate)
```

### Source Code (Only upload BUILD)
```
frontend/src/                  (Source - not needed on server)
frontend/public/               (Source - not needed)
frontend/index.html            (Dev version)
frontend/vite.config.js        (Build config)
frontend/tailwind.config.js    (Build config)
frontend/*.config.js            (All config files)
```

### Backend (Node.js - REMOVED)
```
backend/                       (OLD - already deleted)
backend/node_modules/
backend/.env
backend/*.log
```

### Database Files (Only import, don't upload)
```
database/                      (Don't upload raw files)
├── schema.sql                 (Import via phpMyAdmin only)
├── *.sql                      (All SQL files - import only)
```

### Documentation (Not needed on server)
```
*.md                           (All markdown guides)
README.md
PHP-DEPLOYMENT-GUIDE.md
PAYMENT-SETUP-GUIDE.md
LOCAL-TESTING-GUIDE.md
DEPLOYMENT-CLEANUP-GUIDE.md
BEGINNER-HOSTING-GUIDE.md
SHUJAA-HOST-DEPLOYMENT.md
```

### Git Files
```
.git/                          (Repository history)
.gitignore
```

### IDE/Editor Files
```
.vscode/
.idea/
*.sublime-*
.DS_Store                      (Mac)
Thumbs.db                      (Windows)
```

### Logs & Temp
```
*.log
php-api/logs/
uploads/temp/
*.tmp
*.cache
```

### Docker (Not for shared hosting)
```
Dockerfile
Dockerfile.dev
docker-compose.yml
docker-compose.dev.yml
.dockerignore
```

### Testing
```
tests/
php-api/install.php            (Delete after first use!)
*.test.js
*.spec.js
```

---

## ✅ **ONLY Upload These Files**

### Frontend (Built Files)
```
public_html/                   (or htdocs/)
├── index.html                 (Built version)
├── assets/                    (JS/CSS from build)
│   ├── index-*.js
│   ├── index-*.css
│   └── logo*.jpeg
├── logo.png
└── .htaccess                  (Apache routing)
```

### Backend (PHP API)
```
php-api/
├── config/
│   └── database.php
├── middleware/
│   └── auth.php
├── payments/
│   ├── index.php
│   └── webhook.php
├── utils/
│   ├── notifications.php
│   └── invoice-generator.php
├── admin/
│   ├── stats.php
│   ├── listings.php
│   ├── bookings.php
│   ├── users.php
│   └── payments.php
├── auth/
│   ├── login.php
│   └── register.php
├── listings/
│   ├── index.php
│   └── update.php
├── bookings/
│   └── create.php
├── airport/
│   ├── services.php
│   └── bookings.php
├── upload/
│   └── index.php
└── .htaccess
```

### Assets
```
uploads/                       (Create empty on server)
```

---

## 📦 **Deployment Package Structure**

Create a `bemageetz-deployment.zip` with ONLY:

```
bemageetz/
├── index.html                  (from public_html/)
├── assets/                     (from public_html/assets/)
│   ├── index-*.js
│   ├── index-*.css
│   └── logo*.jpeg
├── logo.png
├── .htaccess                   (public_html version)
├── php-api/                    (ALL PHP files)
│   ├── .htaccess
│   ├── config/
│   ├── middleware/
│   ├── payments/
│   ├── utils/
│   ├── admin/
│   ├── auth/
│   ├── listings/
│   ├── bookings/
│   ├── airport/
│   ├── upload/
│   └── invoices/               (Create empty)
└── uploads/                    (Create empty)
```

---

## 🧹 **Quick Cleanup Script (Windows)**

Create `cleanup-for-deployment.bat`:

```batch
@echo off
echo Cleaning Bema Geetz for deployment...
echo.

REM Delete dev files
echo Removing frontend source (not needed on server)...
rmdir /s /q frontend\node_modules 2>nul
rmdir /s /q frontend\src 2>nul
rmdir /s /q frontend\public 2>nul

REM Delete old backend
echo Removing old backend...
rmdir /s /q backend 2>nul

REM Delete docs
echo Removing documentation...
del *.md 2>nul
del DEPLOYMENT-CLEANUP-GUIDE.md 2>nul

REM Delete git
echo Removing git files...
rmdir /s /q .git 2>nul
del .gitignore 2>nul

REM Delete docker
echo Removing docker files...
del Dockerfile* 2>nul
del docker-compose*.yml 2>nul

REM Delete IDE files
echo Removing IDE files...
rmdir /s /q .vscode 2>nul
rmdir /s /q .idea 2>nul

REM Delete logs
echo Removing logs...
del *.log 2>nul
del php-api\install.php 2>nul

echo.
echo Cleanup complete!
echo.
echo Next steps:
echo 1. Build frontend: npm run build
echo 2. Copy files to public_html/
echo 3. Upload to hosting
echo 4. Import database via phpMyAdmin
echo.
pause
```

---

## 📊 **File Size Comparison**

| Before Cleanup | After Cleanup |
|----------------|---------------|
| ~600 MB (with node_modules) | ~5 MB (only necessary) |
| 1000+ files | ~50 files |
| Includes source code | Only production |

---

## 🚀 **Upload Process**

### Option 1: ZIP Upload (Easiest)

1. **Build frontend:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Copy to public_html:**
   ```
   Copy frontend/dist/* to public_html/
   Copy php-api/ to public_html/php-api/
   Create uploads/ folder
   ```

3. **Create ZIP:**
   ```
   Zip public_html/ contents
   ```

4. **Upload to hosting:**
   - Upload via cPanel File Manager
   - Extract ZIP

### Option 2: FTP Upload

1. Connect via FTP
2. Upload ONLY the cleaned files
3. Skip all excluded items

---

## ⚠️ **Critical Security Notes**

### NEVER Upload:
- ❌ `.env` files with passwords
- ❌ Database credentials in plain text
- ❌ API keys in frontend code
- ❌ `node_modules` (security risk)
- ❌ Git history (exposes code history)
- ❌ Install scripts after first use

### ALWAYS Upload:
- ✅ Built frontend only
- ✅ PHP backend
- ✅ Proper `.htaccess` for routing
- ✅ Empty `uploads/` folder (for images)

---

## 📝 **Post-Upload Checklist**

After uploading to hosting:

- [ ] Delete `php-api/install.php`
- [ ] Import `database/schema.sql` via phpMyAdmin
- [ ] Configure database credentials in `php-api/config/database.php`
- [ ] Add Flutterwave API keys to database
- [ ] Configure SMTP for email
- [ ] Test payment flow
- [ ] Test login/registration
- [ ] Test booking creation
- [ ] Verify image uploads work
- [ ] Check admin dashboard access

---

## 🎯 **Summary**

**Upload ONLY:**
1. Built frontend (`public_html/` contents)
2. PHP API (`php-api/`)
3. Empty `uploads/` folder

**NEVER Upload:**
- Source code
- Dev dependencies
- Documentation
- Git files
- Install scripts (after use)

**Result:** Clean, secure, professional deployment! 🎉
