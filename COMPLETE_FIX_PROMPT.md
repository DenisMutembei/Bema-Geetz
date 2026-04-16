# COMPLETE FIX PROMPT FOR CLAUDE

## Paste This Entire Prompt Into Claude

```
I have a car rental and accommodation booking web application called "Bema Geetz" built with React (Vite) frontend and PHP backend. I need you to fix all issues and make it fully functional for production deployment on Shujaa host (Kenya-based hosting).

## CURRENT PROJECT STRUCTURE

Frontend: React with Vite, located in /frontend directory
Backend: PHP API, located in /api directory  
Database: MySQL with complete schema in /database/schema.sql
Hosting: Subdirectory deployment (/bemageetz/)

## CRITICAL ISSUES TO FIX

### 1. Document Upload & Scan System (PRIORITY: CRITICAL)
- DocumentScanner component expects: extractedData, imageUrl, scanResult properties
- Backend scan.php currently returns: success, urls only
- MUST match frontend expectations in DocumentScanner.jsx
- Handle both 'document' (single) and 'files' (multiple) form field names

### 2. File Upload Configuration for Shujaa Host
- Uploads directory must be writable (755 permissions)
- Max file size: 10MB per file
- Allowed types: jpeg, png, gif, webp, mp4, webm, mov
- Cache-busting URLs with timestamps
- Proper error handling for upload failures

### 3. Authentication & Verification System
- JWT token-based auth (currently working)
- Driving License (DL) verification needs:
  - Front and back image capture
  - OCR text extraction (name, license number, expiry)
  - Quality analysis (blur detection, brightness)
  - Verification status tracking
- National ID verification needs:
  - Same as DL but for Kenyan ID
  - ID number validation
- Admin approval workflow for documents

### 4. Notification System (Email & SMS)

When booking is created, send:
- Email to customer with booking confirmation
- Email to admin (admin@bemageetz.com) with booking details
- SMS to customer phone number
- SMS to admin phone (+254 708 771345)

Required integrations:
- SMTP for email (use Shujaa host SMTP or external like SendGrid)
- SMS API (Africa's Talking or Twilio for Kenya)

### 5. Payment Integration (Flutterwave)

Payment flow:
- Customer books → Pay deposit (20% of total)
- Payment via Flutterwave (MPesa, Card, Bank)
- On success: update booking payment_status to 'partial'
- Send payment confirmation email/SMS
- Generate invoice with KRA-compliant details

Required:
- Flutterwave public key, secret key, encryption key
- Webhook endpoint for payment callbacks
- Test mode for development, live mode for production

### 6. Shujaa Host Deployment Configuration

Changes needed:
- Database config: Update DB_HOST, DB_NAME, DB_USER, DB_PASS
- JWT_SECRET: Change from default to secure random string
- API base URL: /bemageetz/api for subdirectory
- Frontend base URL: /bemageetz/
- PHP version: 7.4+ or 8.0+
- Enable mysqli, pdo_mysql, gd, fileinfo extensions

### 7. Phone Number & Email Configuration

Current numbers to update throughout codebase:
- Admin phone: +254 708 771345 (change if needed)
- Admin email: bookings@bemageetz.com (change if needed)
- WhatsApp: wa.me/254708771345
- Company name: Bema Geetz Limited

Locations to update:
- api/bookings/create.php (WhatsApp message)
- frontend/src/pages/Booking.jsx (Need Help section)
- frontend/src/components/Navbar.jsx (if added)
- Database settings table
- Any email templates

### 8. Image Display Issues

Problems:
- Images stored as JSON string in database, need decoding to array
- Cache-busting query params (?t=timestamp) should be stripped for display
- Fallback images for broken/missing uploads
- Lazy loading optimization

Fix in:
- api/listings/index.php (GET all listings)
- api/listings/host.php (GET host listings)
- frontend/src/components/ListingCard.jsx (image URL handling)

### 9. API Endpoint Consistency

All API calls must:
- Include .php extension (hosting requirement)
- Return consistent JSON structure: {success: true/false, data: ..., error: ...}
- Handle CORS properly
- Use proper HTTP status codes

### 10. Security Requirements

Before production:
- Change JWT_SECRET from 'your_super_secret_jwt_key_change_this'
- Change database password from empty string
- Disable PHP error display (display_errors = 0)
- Enable HTTPS (force redirect from HTTP)
- Sanitize all user inputs (SQL injection prevention)
- Validate file uploads (type, size, extension)
- Rate limiting on auth endpoints

## MUST PRESERVE EXISTING FUNCTIONALITY

- Keep current UI design (dark theme with gold accents)
- Keep all existing pages (Home, Booking, Cars, Houses, Airport, etc.)
- Keep React Router setup with basename="/bemageetz"
- Keep current user roles (customer, host, admin)
- Keep listing types (car, house)
- Keep verification types (driving_license, national_id)
- Keep all existing database tables and relationships

## DELIVERABLES NEEDED

1. Fixed backend PHP files (api/ directory)
2. Fixed frontend React components (frontend/src/)
3. Updated database schema (if new tables needed)
4. Configuration files (.env examples)
5. Deployment guide for Shujaa host
6. Testing checklist to verify everything works

## SPECIFIC FILES TO MODIFY

Backend (PHP):
- api/config/database.php (hosting credentials)
- api/document-scan/scan.php (fix response structure)
- api/bookings/create.php (add email/SMS, Flutterwave)
- api/upload/index.php (Shujaa compatibility)
- api/verification/status.php (admin approval)
- api/payments/ (NEW: Flutterwave integration)
- api/notifications/ (NEW: email and SMS)

Frontend (React):
- frontend/.env (API URL configuration)
- frontend/src/pages/Booking.jsx (payment integration)
- frontend/src/components/DocumentScanner.jsx (OCR integration)
- frontend/src/pages/Verification.jsx (status checking)
- frontend/src/services/api.js (error handling)
- frontend/src/components/PaymentModal.jsx (NEW: Flutterwave)

## SHUJAA HOST SPECIFIC REQUIREMENTS

- Use .htaccess for URL rewriting if needed
- Upload files in binary mode (not ASCII)
- Set uploads/ directory to 755 permissions
- Use PHP 8.0+ for better performance
- MySQL database name: yourcpanel_bemageetz
- Database host: localhost (usually)

## PAYMENT FLOW REQUIREMENTS

1. Customer selects listing → goes to booking page
2. Fills booking form → clicks "Pay Deposit & Book"
3. Flutterwave popup opens → customer pays
4. On success:
   - Booking created with status 'pending', payment_status 'partial'
   - Email sent to customer
   - SMS sent to customer
   - Email sent to admin
   - SMS sent to admin
   - WhatsApp opens with booking confirmation
5. Admin dashboard shows pending bookings
6. Admin approves → status changes to 'confirmed'
7. Customer receives confirmation email/SMS

## VERIFICATION FLOW REQUIREMENTS

1. User goes to /verification
2. Selects document type (DL or ID)
3. Captures front image → uploads → OCR extracts data
4. Captures back image → uploads → OCR extracts data
5. User reviews extracted data → submits
6. Status: 'pending'
7. Admin reviews in admin dashboard
8. Admin approves/rejects with notes
9. User receives email/SMS notification
10. Verified status allows booking restricted listings

## FINAL TESTING CHECKLIST

After all fixes, verify:
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens valid for 30 days
- [ ] Create listing with images
- [ ] Listings display on home page
- [ ] Booking with deposit payment
- [ ] Email sent to customer
- [ ] Email sent to admin
- [ ] SMS sent to customer
- [ ] SMS sent to admin
- [ ] WhatsApp opens with booking details
- [ ] Document scan captures both sides
- [ ] OCR extracts text from documents
- [ ] Admin can approve/reject documents
- [ ] Verified users can book restricted listings
- [ ] All API endpoints return correct JSON
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] Payment webhook receives callbacks

Provide me with the complete fixed codebase, configuration files, and deployment instructions.
```

---

## Main Problems Summary

| # | Problem | Severity | Status |
|---|---------|----------|--------|
| 1 | Document scan response structure mismatch | CRITICAL | Fixed |
| 2 | Form field name mismatch (document vs files) | CRITICAL | Fixed |
| 3 | Database credentials need updating for hosting | HIGH | Pending |
| 4 | JWT_SECRET is default/weak | HIGH | Pending |
| 5 | No email notification system | MEDIUM | Not Implemented |
| 6 | No SMS notification system | MEDIUM | Not Implemented |
| 7 | No Flutterwave payment integration | MEDIUM | Not Implemented |
| 8 | No OCR for document verification | MEDIUM | Not Implemented |
| 9 | No admin approval workflow | MEDIUM | Not Implemented |
| 10 | Phone number hardcoded in multiple places | LOW | Fixed |

## Quick Fixes You Can Do Now

### 1. Update Phone Number/Email
Edit these files and search-replace:
- `+254 708 771345` → your new number
- `bookings@bemageetz.com` → your new email

Files:
- `api/bookings/create.php` (line 64)
- `frontend/src/pages/Booking.jsx` (Need Help section)
- Database `settings` table

### 2. Update Database Credentials
Edit `api/config/database.php`:
```php
$db_host = 'your_hosting_db_host';
$db_name = 'your_hosting_db_name';
$db_user = 'your_hosting_db_user';
$db_pass = 'your_hosting_db_password';
$jwt_secret = 'generate_32_char_random_string_here';
```

### 3. Rebuild Frontend
```bash
cd frontend
npm run build
# Copy dist/assets/* to hosting assets/
# Update index.html with new JS/CSS filenames
```

## For Shujaa Host Deployment

### File Upload Requirements
- Max upload size: 10MB (set in php.ini)
- Post max size: 10MB
- Memory limit: 128MB
- Uploads directory: `/public_html/bemageetz/uploads/` (chmod 755)

### PHP Extensions Required
- mysqli
- pdo_mysql
- gd (for image processing)
- fileinfo (for mime type detection)
- mbstring
- json
- openssl (for JWT)

### .htaccess for Subdirectory
Create `public_html/bemageetz/.htaccess`:
```apache
RewriteEngine On
RewriteBase /bemageetz/

# If file/directory exists, serve it
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Otherwise, route to index.html (SPA)
RewriteRule ^ index.html [L]
```

### Database Import
1. Export from local: phpMyAdmin → Export → Custom → Save as file
2. Import to hosting: cPanel → phpMyAdmin → Import → Select file

## Claude Prompt Usage

1. Copy the ENTIRE prompt above (between the triple backticks)
2. Paste into Claude
3. Also upload your project files or give Claude access to your repository
4. Claude will provide complete fixed codebase
5. Test locally before deploying to Shujaa

## Important Notes

- **Don't** give Claude your actual database passwords or API keys
- **Do** tell Claude to use placeholders like `YOUR_DB_PASSWORD`
- **Do** ask Claude to provide .env.example files
- **Do** ask for step-by-step deployment instructions
- **Do** test payment integration in Flutterwave sandbox first
