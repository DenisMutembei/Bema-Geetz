# Bema Geetz - Local Testing Guide (PHP Version)

Test the PHP/MySQL version locally before uploading to hosting.

## Prerequisites

1. **XAMPP** (recommended) or **WAMP** installed
   - Download: https://www.apachefriends.org/
   - Install with Apache + MySQL + PHP

2. **PHP 7.4+** must be in your system PATH

3. **Node.js** (for building frontend)

---

## Step 1: Start XAMPP

1. Open XAMPP Control Panel
2. Start **Apache**
3. Start **MySQL**
4. Both should show green/running status

---

## Step 2: Create Local Database

1. Open browser: http://localhost/phpmyadmin
2. Click **"New"** (left sidebar)
3. Database name: `bemageetz_db`
4. Click **"Create"**
5. Click on `bemageetz_db` (select it)
6. Click **"Import"** tab
7. Choose file: `database/mysql-schema.sql`
8. Click **"Go"**

✅ Database is ready!

---

## Step 3: Configure Project

Database is already configured for local XAMPP:
- Host: `localhost`
- User: `root`
- Password: (empty)
- Database: `bemageetz_db`

(These are the defaults in `php-api/config/database.php`)

---

## Step 4: Build Frontend

Open terminal in project folder:

```bash
cd frontend
npm run build
```

This creates `frontend/dist/` folder.

---

## Step 5: Copy Files to XAMPP

### Option A: Quick (symlink method)
1. Delete `C:\xampp\htdocs\bemageetz` if it exists
2. Open Command Prompt as Administrator:
```cmd
cd C:\xampp\htdocs
mklink /D bemageetz C:\Users\Admin\Desktop\bema-geetz\public_html
```

3. Also link php-api:
```cmd
cd C:\xampp\htdocs\bemageetz
mklink /D php-api C:\Users\Admin\Desktop\bema-geetz\php-api
mklink /D uploads C:\Users\Admin\Desktop\bema-geetz\uploads
```

### Option B: Copy files manually
1. Copy contents of `public_html/` to `C:\xampp\htdocs\bemageetz\`
2. Copy `php-api/` folder to `C:\xampp\htdocs\bemageetz\`
3. Create `uploads/` folder at `C:\xampp\htdocs\bemageetz\uploads`

---

## Step 6: Install Database Tables

Visit in browser:
```
http://localhost/bemageetz/php-api/install.php
```

You should see: **"Installation completed successfully!"**

**Delete install.php after this!**

---

## Step 7: Test the App

1. **Frontend**: http://localhost/bemageetz/
   - Should show Bema Geetz homepage

2. **API Test**: http://localhost/bemageetz/api/airport/services
   - Should show JSON with airport services

3. **Login Test**:
   - Go to http://localhost/bemageetz/login
   - Login with: admin@bemageetz.com / admin123

---

## Alternative: PHP Built-in Server (No XAMPP)

If you have PHP installed but not XAMPP:

1. Create database in any MySQL (hosting, remote, etc.)
2. Update credentials in `php-api/config/database.php`
3. Build frontend: `npm run build`
4. Copy `dist/` contents to `public_html/`
5. Run:
```bash
start-local-php.bat
```
Or manually:
```bash
cd public_html
php -S localhost:8000
```
6. Visit http://localhost:8000

---

## Troubleshooting

### "Connection failed: Access denied for user 'root'"
- XAMPP MySQL is not running
- Or root password is set (check XAMPP config)

### "Database bemageetz_db not found"
- Database not created yet - run Step 2

### "404 Not Found" on API
- .htaccess not working (mod_rewrite might be off)
- php-api folder not in right place

### "No input file specified"
- PHP routing issue
- Try using XAMPP instead of built-in server

### Frontend shows but API doesn't work
- Check browser console for CORS errors
- Check that Apache is running
- Check that php-api folder exists

---

## Quick Checklist

- [ ] XAMPP Apache running
- [ ] XAMPP MySQL running
- [ ] Database `bemageetz_db` created in phpMyAdmin
- [ ] Schema imported from `database/mysql-schema.sql`
- [ ] Frontend built (`npm run build`)
- [ ] Files in `C:\xampp\htdocs\bemageetz\`
- [ ] Install script run (`php-api/install.php`)
- [ ] Delete install.php after
- [ ] Test http://localhost/bemageetz/
- [ ] Test API http://localhost/bemageetz/api/airport/services

---

## Success?

Once everything works locally:
1. Build frontend fresh: `npm run build`
2. Follow `PHP-DEPLOYMENT-GUIDE.md` for hosting
3. Upload to your Shujaa Host!

🎉 Good luck!
