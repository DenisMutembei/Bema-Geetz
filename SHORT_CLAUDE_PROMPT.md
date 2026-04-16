# SHORT CLAUDE PROMPT - Copy This Into Claude

```
Fix my React+PHP booking app "Bema Geetz" for production on Shujaa host (Kenya).

## PROJECT STRUCTURE
- Frontend: React + Vite in /frontend
- Backend: PHP API in /api  
- Database: MySQL
- Hosting: /bemageetz/ subdirectory

## FIX THESE CRITICAL ISSUES:

1. DOCUMENT SCAN
   - Backend scan.php returns: success, urls only
   - Frontend expects: extractedData, imageUrl, scanResult
   - Also handle 'document' form field (not just 'files')
   - Add OCR text extraction (use Tesseract.js or Google Vision)
   - Validate: Driving License format, ID format

2. EMAIL NOTIFICATIONS
   - Add PHPMailer SMTP integration
   - Send on booking: customer email + admin email
   - Templates: booking_confirmation, payment_received, verification_status

3. SMS NOTIFICATIONS  
   - Africa's Talking API for Kenya
   - Send same events as email
   - Customer SMS + Admin SMS (+254708771345)

4. PAYMENT INTEGRATION
   - Flutterwave for 20% deposit
   - Frontend: PaymentModal with Flutterwave popup
   - Backend: webhook to update payment_status
   - Test mode first, then live

5. ADMIN DASHBOARD
   - View pending verifications
   - Approve/reject documents with notes
   - View all bookings
   - Generate invoices

## CONFIGURATION UPDATES:
- api/config/database.php: Update DB_HOST, DB_NAME, DB_USER, DB_PASS for Shujaa
- Change JWT_SECRET from default
- Uploads directory: 755 permissions, 60MB max
- Add .htaccess for subdirectory routing

## PRESERVE:
- Dark theme with gold accents
- Current pages: Home, Booking, Cars, Houses, Airport
- JWT auth, user roles (customer/host/admin)
- React Router with basename="/bemageetz"

## DELIVER:
1. Fixed PHP files (api/)
2. Fixed React components (frontend/src/)
3. New database tables if needed
4. .env.example files
5. Deployment steps for Shujaa

## CURRENT STATE:
- User auth working
- Image upload working  
- Basic booking with WhatsApp
- Document upload working (but no OCR)
- Phone: +254 708 771345

## PRIORITY ORDER:
1. Document scan OCR
2. Email system
3. SMS system
4. Flutterwave payment
5. Admin dashboard

Provide complete fixed codebase.
```

---

## Even Shorter Version (If Still Too Long)

```
Fix Bema Geetz React+PHP booking app for Shujaa host:

CRITICAL FIXES:
1. Document scan: OCR text extraction (Tesseract.js) - backend returns wrong format
2. Email notifications: PHPMailer SMTP on booking
3. SMS notifications: Africa's Talking API 
4. Payment: Flutterwave 20% deposit integration
5. Admin dashboard: Approve verifications & bookings

CONFIG:
- Update database.php for Shujaa hosting
- Change JWT_SECRET
- Uploads: 755 permissions, 60MB max

PRESERVE: Dark gold theme, all pages, JWT auth, subdirectory /bemageetz/

DELIVER: Fixed PHP, React components, .env examples, deployment guide.

Phone: +254708771345
```

---

## Minimal Version (Absolute Shortest)

```
Fix my React+PHP app for Shujaa hosting. 

NEED:
1. Document OCR (Tesseract.js) - fix scan.php response
2. Email (PHPMailer SMTP)  
3. SMS (Africa's Talking)
4. Payment (Flutterwave 20% deposit)
5. Admin approval dashboard

KEEP: Dark theme, all pages, JWT auth, /bemageetz/ subdirectory

Phone: +254708771345
```

---

## How to Use

**Option 1:** Use the first prompt (most detailed)
**Option 2:** Use second prompt (if first too long)  
**Option 3:** Use third prompt (shortest, Claude will ask for details)

After pasting, also tell Claude:
- "Use Tesseract.js for OCR (free)"
- "Use Africa's Talking for SMS (Kenya)"
- "Use Flutterwave sandbox for testing"
- "Keep dark theme with gold (#D4AF37)"
