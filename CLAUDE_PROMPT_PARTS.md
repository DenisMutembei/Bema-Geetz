# CLAUDE PROMPT - IN 3 PARTS (Paste One at a Time)

## PART 1 - PROJECT OVERVIEW

Paste this first:

```
I'm building "Bema Geetz" - a car rental and accommodation booking app with React frontend and PHP backend. I need to make it production-ready for Shujaa host (Kenya).

STRUCTURE:
- Frontend: React + Vite in /frontend
- Backend: PHP API in /api
- Database: MySQL, complete schema exists
- Hosting: Subdirectory /bemageetz/

CURRENTLY WORKING:
- User registration/login with JWT
- Image uploads (multiple files)
- Listing creation (cars & houses)
- Basic booking with WhatsApp
- Phone: +254 708 771345 shown on booking

Tell me what other info you need, then I'll give you the specific fixes required.
```

Claude will respond asking for more details. Then paste:

---

## PART 2 - SPECIFIC FIXES NEEDED

```
Here are the specific fixes needed:

1. DOCUMENT SCAN OCR:
   - Backend: api/document-scan/scan.php only returns {success, urls}
   - Frontend expects: {imageUrl, scanResult, extractedData}
   - Need: OCR text extraction from Driving License & National ID
   - Extract: Name, License/ID number, dates
   - Use Tesseract.js (free) or suggest alternative

2. EMAIL NOTIFICATIONS:
   - Need: PHPMailer SMTP integration
   - Triggers: booking created, payment received, verification approved
   - Send to: customer email + admin email (bookings@bemageetz.com)

3. SMS NOTIFICATIONS:
   - Need: Africa's Talking API (Kenya)
   - Same triggers as email
   - Send to: customer phone + admin phone (+254708771345)

4. PAYMENT INTEGRATION:
   - Flutterwave for 20% deposit
   - Frontend popup, backend webhook
   - Update booking payment_status to 'partial'

5. ADMIN DASHBOARD:
   - View pending document verifications
   - Approve/reject with notes
   - View all bookings with payment status

What files do you need to see? I can provide the current scan.php, booking creation, and database schema.
```

---

## PART 3 - CONFIGURATION & DELIVERABLES

After Claude asks for files/config, paste:

```
CONFIGURATION NEEDS:
- Database: Update api/config/database.php for Shujaa (DB_HOST, DB_NAME, DB_USER, DB_PASS)
- JWT_SECRET: Change from default
- File uploads: 60MB max, uploads/ directory 755 permissions
- Frontend .env: VITE_API_URL=/bemageetz/api
- Add .htaccess for subdirectory routing

MUST PRESERVE:
- Dark theme with gold (#D4AF37) accents
- All existing pages (Home, Booking, Cars, Houses, Airport, etc.)
- React Router basename="/bemageetz"
- Current user roles and listing types

DELIVERABLES:
1. Fixed PHP backend files
2. Fixed React frontend components
3. Any new database tables needed
4. .env.example configuration files
5. Step-by-step deployment guide for Shujaa

Provide the complete fixed codebase.
```

---

## USAGE INSTRUCTIONS

1. **Open Claude**
2. **Paste Part 1** - wait for response
3. **Paste Part 2** - Claude will ask for specific files
4. **Upload or paste your files** (scan.php, bookings/create.php, schema.sql)
5. **Paste Part 3** - tell Claude the deliverables
6. **Claude will provide complete fixed codebase**

---

## ALTERNATIVE: ZIP AND UPLOAD

If prompts still don't work:

1. **Zip your entire project** (excluding node_modules)
2. **Upload to Claude** with this message:

```
Fix this React+PHP booking app for Shujaa host production.

Main issues:
1. Document scan needs OCR (Tesseract.js)
2. Add email notifications (PHPMailer)
3. Add SMS notifications (Africa's Talking)
4. Add Flutterwave payment (20% deposit)
5. Add admin approval dashboard

Keep dark theme, all pages, JWT auth.
Phone: +254708771345
```

Claude can analyze the zip and provide fixes.
