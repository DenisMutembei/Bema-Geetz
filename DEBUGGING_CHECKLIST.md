# Bema Geetz Debugging Checklist Before Hosting

## 1. Database Check

### Test Database Connection
Open http://localhost/phpmyadmin and check:
- [ ] Database `bemageetz_db` exists
- [ ] All tables are created (users, listings, bookings, verifications, airport_services, airport_bookings, payments, invoices, receipts, email_notifications, sms_notifications, booking_status_history, settings)
- [ ] Tables have correct structure matching schema.sql

### Run Schema if Missing
If database doesn't exist:
1. Open phpMyAdmin: http://localhost/phpmyadmin
2. Create database `bemageetz_db`
3. Import `C:\Users\Admin\Desktop\bema-geetz\database\schema.sql`

---

## 2. API Endpoint Tests

### Test in Browser or Postman

#### Auth Endpoints
- [ ] POST http://localhost/bemageetz/api/auth/register.php
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123",
    "role": "customer"
  }
  ```
  Expected: `{"success": true, "token": "...", "user": {...}}`

- [ ] POST http://localhost/bemageetz/api/auth/login.php
  ```json
  {
    "email": "test@example.com",
    "password": "test123"
  }
  ```
  Expected: `{"success": true, "token": "...", "user": {...}}`

#### Listings Endpoints
- [ ] GET http://localhost/bemageetz/api/listings/index.php
  Expected: `{"success": true, "data": [...]}`

- [ ] POST http://localhost/bemageetz/api/listings/index.php (with auth token in header)
  ```json
  {
    "title": "Test Listing",
    "type": "car",
    "price": 5000,
    "location": "Nairobi",
    "description": "Test description",
    "images": []
  }
  ```
  Expected: `{"success": true, "data": {"id": "..."}}`

#### Upload Endpoint
- [ ] POST http://localhost/bemageetz/api/upload/index.php (with auth token)
  Content-Type: multipart/form-data
  Body: files (image file)
  Expected: `{"success": true, "urls": [...]}`

#### Booking Endpoint
- [ ] POST http://localhost/bemageetz/api/bookings/create.php (with auth token)
  ```json
  {
    "listingId": "existing-listing-id",
    "customerName": "Test Customer",
    "phone": "+254700000000",
    "email": "customer@example.com"
  }
  ```
  Expected: `{"success": true, "booking": {...}, "whatsappUrl": "..."}`

---

## 3. Frontend Build Check

### Verify Build
```bash
cd C:\Users\Admin\Desktop\bema-geetz\frontend
npm run build
```
- [ ] Build completes without errors
- [ ] dist folder created with index.html, assets folder

### Deploy to XAMPP
- [ ] Copy dist/assets/* to c:\xampp\htdocs\bemageetz\assets\
- [ ] Update c:\xampp\htdocs\bemageetz\index.html with new JS/CSS filenames

---

## 4. File Permissions

### Uploads Directory
- [ ] Directory exists: c:\xampp\htdocs\bemageetz\uploads
- [ ] Directory is writable (right-click > Properties > Security > Write permission)

---

## 5. Browser Console Check

Open http://localhost/bemageetz/ and check browser console (F12):
- [ ] No red errors
- [ ] No 404 errors for assets
- [ ] API calls succeed (200 status)

---

## 6. Complete User Flow Test

1. [ ] Register at http://localhost/bemageetz/register
2. [ ] Login at http://localhost/bemageetz/login
3. [ ] Create listing at http://localhost/bemageetz/create-listing with image upload
4. [ ] View listing on home page http://localhost/bemageetz/
5. [ ] Book listing at http://localhost/bemageetz/booking
6. [ ] Click WhatsApp button - opens WhatsApp with booking details

---

## 7. Configuration Files Check

### Database Config
File: c:\xampp\htdocs\bemageetz\api\config\database.php
- [ ] DB_HOST, DB_NAME, DB_USER, DB_PASS are correct
- [ ] JWT_SECRET is set (change from default for production)

### Frontend Environment
File: C:\Users\Admin\Desktop\bema-geetz\frontend\.env
- [ ] VITE_API_URL=/bemageetz/api (correct for subdirectory hosting)

---

## 8. Security Checks

### Production Readiness
- [ ] Change JWT_SECRET from default
- [ ] Change database password from empty string
- [ ] Disable error display in production (set display_errors = 0 in php.ini)
- [ ] Enable HTTPS on hosting
- [ ] Update database credentials to production values

---

## 9. Known Issues Fixed

- [x] Images JSON decoding fixed (images stored as string, decoded to array)
- [x] Booking form field names match backend (listingId, customerName, checkIn, checkOut)
- [x] Middleware uses correct database config path
- [x] ListingCard handles /bemageetz/uploads/ paths
- [x] Cache-busting on uploaded images
- [x] WhatsApp popup blocker issue (manual click instead of auto-open)
- [x] Phone number +254 708 771345 on booking page
- [x] Document-scan endpoint created

---

## 10. Hosting Preparation

### Files to Upload
- Frontend: Upload dist folder contents to public_html/bemageetz/
- Backend: Upload api folder contents to public_html/bemageetz/api/
- Database: Export bemageetz_db and import to hosting database

### Configuration Changes for Hosting
1. Update c:\xampp\htdocs\bemageetz\api\config\database.php:
   - DB_HOST: hosting database host
   - DB_NAME: hosting database name
   - DB_USER: hosting database username
   - DB_PASS: hosting database password
   - JWT_SECRET: change to secure random string

2. Update frontend .env:
   - VITE_API_URL: /api (if using root domain) or /subdirectory/api

---

## Quick Test Commands

### Test Database Connection
Open in browser: http://localhost/bemageetz/api/listings/index.php
Should return JSON with listings or empty array

### Test Upload
Use Postman or browser dev tools to POST image to http://localhost/bemageetz/api/upload/index.php

### Test Auth
Register: POST to http://localhost/bemageetz/api/auth/register.php
Login: POST to http://localhost/bemageetz/api/auth/login.php
