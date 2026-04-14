# Bema Geetz - PHP/MySQL Deployment Guide for Shared Hosting

This guide is for deploying Bema Geetz on shared hosting (like Shujaa Host) that supports PHP and MySQL (not Node.js/PostgreSQL).

## 📋 What Changed?

- **Backend**: Node.js/Express → **PHP 7.4+**
- **Database**: PostgreSQL → **MySQL/MariaDB**
- **Server**: Self-hosted → **Apache (Shared Hosting)**
- **API**: Same endpoints, now powered by PHP

---

## 🚀 Quick Deployment Steps

### Step 1: Create MySQL Database

1. **Log in to cPanel**
2. Go to **"Databases" → "MySQL Database Wizard"**
3. Create database:
   - Database name: `bemageetz_db`
   - Create user: `bemageetz_user`
   - Set strong password (save it!)
4. Add user to database with **ALL PRIVILEGES**

### Step 2: Import Database Schema

1. In cPanel, go to **"phpMyAdmin"**
2. Select your database (`yourusername_bemageetz_db`)
3. Click **"Import"** tab
4. Choose file: `database/mysql-schema.sql`
5. Click **"Go"** to import

✅ **Default Admin Account:**
- Email: `admin@bemageetz.com`
- Password: `admin123`
- **Change this after first login!**

### Step 3: Update Database Credentials

Open `php-api/config/database.php` and update:

```php
$db_host = 'localhost';  // Usually localhost on shared hosting
$db_name = 'yourusername_bemageetz_db';  // Your actual database name
$db_user = 'yourusername_bemageetz_user'; // Your database username
$db_pass = 'your_actual_password';        // Your database password
```

### Step 4: Build Frontend

In VS Code terminal:

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with production files.

### Step 5: Upload to Hosting

**Folder Structure to Upload:**
```
public_html/                    ← Upload all content inside dist/ here
├── php-api/                    ← Upload entire php-api folder
│   ├── config/
│   ├── middleware/
│   ├── auth/
│   ├── listings/
│   ├── bookings/
│   ├── airport/
│   ├── upload/
│   └── admin/
├── uploads/                    ← Create empty folder (777 permissions)
├── index.html                  ← From dist/
├── assets/                     ← From dist/
├── logo.png                    ← From dist/
└── .htaccess                   ← Use the provided one
```

**Upload Process:**
1. ZIP the `dist/` folder contents
2. In File Manager, go to `public_html/`
3. Delete old files (if any)
4. Upload the ZIP file
5. Extract it
6. Upload `php-api/` folder separately
7. Create `uploads/` folder with 755 or 777 permissions

### Step 6: Set Permissions

In File Manager:
- `uploads/` folder → Permissions **755** (or 777 if 755 doesn't work)
- `php-api/` folder → Permissions **755**
- All `.php` files → Permissions **644**

### Step 7: Update .htaccess

Make sure `public_html/.htaccess` is uploaded. This routes API calls to PHP.

---

## 📁 File Structure on Hosting

```
/home/yourusername/public_html/          ← Root of your domain
├── index.html                           ← React app entry
├── assets/                              ← JS/CSS files
│   ├── index-xxxx.js
│   └── index-xxxx.css
├── logo.png                             ← Logo
├── php-api/                             ← Backend API
│   ├── config/database.php              ← DB credentials
│   ├── middleware/auth.php              ← JWT handling
│   ├── auth/login.php                   ← Login endpoint
│   ├── auth/register.php                ← Register endpoint
│   ├── listings/index.php               ← Listings API
│   ├── bookings/index.php               ← Bookings API
│   ├── airport/services.php             ← Airport services
│   ├── airport/bookings.php             ← Airport bookings
│   ├── upload/index.php                 ← File upload
│   └── admin/                           ← Admin endpoints
│       ├── stats.php
│       ├── listings.php
│       ├── bookings.php
│       └── users.php
├── uploads/                             ← Uploaded images
│   └── xxxxxx.jpg
└── .htaccess                            ← Apache routing rules
```

---

## 🔌 API Endpoints

Your frontend calls these endpoints (same as before):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/listings` | GET | Get all listings |
| `/api/listings` | POST | Create listing |
| `/api/listings/update` | PUT | Update listing |
| `/api/bookings` | GET | Get my bookings |
| `/api/bookings` | POST | Create booking |
| `/api/airport/services` | GET | Get airport services |
| `/api/airport/services` | POST | Create service (admin) |
| `/api/airport/bookings` | GET | Get my airport bookings |
| `/api/airport/bookings` | POST | Book airport transfer |
| `/api/upload` | POST | Upload images |
| `/api/admin/stats` | GET | Admin dashboard stats |
| `/api/admin/listings` | GET/DELETE | Manage listings |
| `/api/admin/bookings` | GET/PATCH | Manage bookings |
| `/api/admin/users` | GET/DELETE | Manage users |

---

## ⚙️ Environment Variables (No .env needed!)

Unlike Node.js, PHP doesn't use `.env` files in the same way. Credentials are in:

**File: `php-api/config/database.php`**
```php
$db_host = 'localhost';
$db_name = 'yourusername_bemageetz_db';
$db_user = 'yourusername_bemageetz_user';
$db_pass = 'your_password_here';
$jwt_secret = 'your_jwt_secret_key_change_this';
```

**IMPORTANT:** Change the JWT secret to something random!

---

## 🧪 Testing Your Deployment

### Test 1: Database Connection
Create a test file `public_html/test-db.php`:
```php
<?php
require_once 'php-api/config/database.php';
echo "Database connected successfully!";
?>
```
Visit: `https://yourdomain.com/test-db.php`

**Success:** "Database connected successfully!"
**Error:** Check credentials in config/database.php

### Test 2: API Endpoint
Visit: `https://yourdomain.com/api/airport/services`

**Success:** JSON array of airport services
**Error:** Check .htaccess is uploaded

### Test 3: Frontend
Visit: `https://yourdomain.com/`

Should see Bema Geetz homepage.

---

## 🔒 Security Checklist

- [ ] Change default admin password (`admin123`)
- [ ] Change JWT secret key in config
- [ ] Set uploads folder to 755 (not 777 if possible)
- [ ] Enable SSL certificate (Let's Encrypt)
- [ ] Remove test-db.php after testing
- [ ] Ensure .htaccess protects sensitive files

---

## 🐛 Troubleshooting

### "500 Internal Server Error"
- Check .htaccess is uploaded
- Check PHP version (needs 7.4+)
- Check file permissions

### "Database connection failed"
- Verify database credentials
- Check database name includes username prefix
- Ensure MySQL user has privileges

### "404 Not Found" on API calls
- .htaccess not working (check mod_rewrite enabled)
- php-api folder not uploaded
- Wrong URL structure

### Images not uploading
- Check uploads/ folder permissions (755 or 777)
- Check PHP upload limits in .htaccess
- Ensure folder exists

### JWT errors
- Ensure JWT secret matches (don't change after users login)
- Check Authorization header is being sent

---

## 📧 Support

If you get stuck:
1. Check cPanel error logs
2. Enable PHP error reporting (temporarily)
3. Contact Shujaa Host support

---

## 🎉 You're Done!

Your Bema Geetz app is now running on PHP/MySQL shared hosting!

**Next Steps:**
1. Add real listings
2. Test booking flow
3. Configure WhatsApp number
4. Go live! 🚀
