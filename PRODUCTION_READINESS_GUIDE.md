# Bema Geetz Production Readiness Guide

## Overview

This guide covers all remaining tasks to make Bema Geetz fully production-ready on Shujaa host.

## ✅ COMPLETED (Already Fixed)

### Core Functionality
- [x] User registration & login with JWT
- [x] Listing creation with image uploads
- [x] Booking creation with WhatsApp integration
- [x] Phone number +254 708 771345 on booking page
- [x] Image upload with cache-busting
- [x] Document scan upload (basic)
- [x] JSON decoding for images in listings
- [x] API endpoints with .php extensions
- [x] Frontend deployment to subdirectory
- [x] Database schema complete

## ⏳ REMAINING (To Implement)

### 1. Document Verification System (OCR)

**Current State:** Basic file upload only
**Required:** OCR text extraction + validation

#### Implementation Needed:

**A. OCR Integration Options:**

**Option 1: Tesseract.js (Free, client-side)**
```javascript
// In DocumentScanner.jsx
import Tesseract from 'tesseract.js';

const extractText = async (imageUrl) => {
  const result = await Tesseract.recognize(imageUrl, 'eng');
  return result.data.text;
};
```

**Option 2: Google Vision API (Paid, more accurate)**
```php
// In api/document-scan/scan.php
$visionApiKey = 'YOUR_API_KEY';
// Send image to Google Vision API
// Extract text, validate against document type
```

**B. Document Validation Logic:**

For Driving License:
- Extract: Name, License Number, Issue Date, Expiry Date
- Validate: Format (e.g., AA12345678 for Kenyan DL)
- Check: Expiry date not passed

For National ID:
- Extract: Name, ID Number (8 digits)
- Validate: Kenyan ID format (e.g., 12345678)

**C. Admin Approval Workflow:**

New database columns needed:
```sql
ALTER TABLE verifications ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE verifications ADD COLUMN reviewed_by VARCHAR(32);
ALTER TABLE verifications ADD COLUMN rejection_reason TEXT;
```

New API endpoints needed:
- GET /api/admin/verifications.php - List pending verifications
- POST /api/admin/verify-approve.php - Approve verification
- POST /api/admin/verify-reject.php - Reject with reason

### 2. Email Notification System

**Current State:** Not implemented
**Required:** SMTP integration for booking confirmations

#### Implementation:

**A. Email Templates Needed:**

1. **Booking Confirmation (Customer)**
   - Subject: "Your Bema Geetz Booking Confirmation - [Invoice ID]"
   - Content: Booking details, payment instructions, contact info

2. **New Booking Alert (Admin)**
   - Subject: "New Booking Received - [Invoice ID]"
   - Content: Customer details, listing, amount, action buttons

3. **Payment Confirmation**
   - Subject: "Payment Received - [Invoice ID]"
   - Content: Receipt, next steps

4. **Verification Approved/Rejected**
   - Subject: "Document Verification [Status]"
   - Content: Status, notes if rejected

**B. SMTP Configuration:**

```php
// api/config/smtp.php
$smtp_host = getenv('SMTP_HOST') ?: 'smtp.gmail.com';
$smtp_port = getenv('SMTP_PORT') ?: 587;
$smtp_user = getenv('SMTP_USER') ?: '';
$smtp_pass = getenv('SMTP_PASS') ?: '';
$smtp_from = 'bookings@bemageetz.com';
```

**C. Send Email Function:**

```php
function sendEmail($to, $subject, $template, $data) {
    // Use PHPMailer or mail()
    // Load template, replace variables
    // Send via SMTP
}
```

### 3. SMS Notification System

**Current State:** Not implemented
**Required:** SMS API integration

#### Implementation:

**A. SMS Provider Options:**

**Africa's Talking (Kenya-based):**
```php
// api/services/africastalking.php
$username = 'YOUR_USERNAME';
$apiKey = 'YOUR_API_KEY';
$AT = new AfricasTalkingSDK($username, $apiKey);
$sms = $AT->sms();
$result = $sms->send([
    'to' => '+254708771345',
    'message' => 'New booking received!',
    'from' => 'BemaGeetz'
]);
```

**Twilio (International):**
```php
$sid = 'YOUR_SID';
$token = 'YOUR_TOKEN';
$twilio = new Client($sid, $token);
$twilio->messages->create('+254708771345', [
    'from' => '+1234567890',
    'body' => 'New booking!'
]);
```

**B. SMS Triggers:**

- Booking created → SMS to customer & admin
- Payment received → SMS to customer
- Booking confirmed → SMS to customer
- Verification approved/rejected → SMS to user

### 4. Flutterwave Payment Integration

**Current State:** Not implemented
**Required:** Deposit payment (20% of booking)

#### Implementation:

**A. Database Updates:**

```sql
-- Add Flutterwave columns to payments table
ALTER TABLE payments ADD COLUMN flutterwave_ref VARCHAR(100);
ALTER TABLE payments ADD COLUMN flutterwave_status VARCHAR(50);
ALTER TABLE payments ADD COLUMN paid_at TIMESTAMP NULL;
```

**B. Frontend Integration:**

```javascript
// PaymentModal.jsx
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

const config = {
  public_key: 'YOUR_FLUTTERWAVE_PUBLIC_KEY',
  tx_ref: Date.now(),
  amount: booking.totalAmount * 0.2, // 20% deposit
  currency: 'KES',
  payment_options: 'card,mobilemoney,ussd',
  customer: {
    email: customerEmail,
    phonenumber: customerPhone,
    name: customerName,
  },
  customizations: {
    title: 'Bema Geetz Booking',
    description: 'Payment for ' + listingTitle,
    logo: 'https://yourdomain.com/logo.png',
  },
};

const handlePayment = () => {
  handleFlutterPayment({
    callback: (response) => {
      if (response.status === 'successful') {
        verifyPayment(response.transaction_id);
      }
      closePaymentModal();
    },
    onClose: () => {},
  });
};
```

**C. Backend Webhook:**

```php
// api/payments/flutterwave-webhook.php
$secretHash = getenv('FLUTTERWAVE_SECRET_HASH');
$signature = $_SERVER['HTTP_VERIF_HASH'];

if ($signature !== $secretHash) {
    http_response_code(401);
    exit();
}

$payload = json_decode(file_get_contents('php://input'), true);
// Update payment status, send notifications
```

**D. Payment Flow:**

1. Customer clicks "Pay Deposit & Book"
2. Flutterwave popup opens
3. Customer pays 20% deposit
4. Flutterwave redirects to success page
5. Webhook updates database
6. Email/SMS notifications sent
7. Booking status: pending, payment_status: partial

### 5. Admin Dashboard

**Current State:** Basic listing management
**Required:** Complete admin controls

#### Features Needed:

**A. Booking Management:**
- View all bookings (pending, confirmed, cancelled)
- Approve/reject bookings
- View payment status
- Generate invoices/receipts
- Send manual notifications

**B. Verification Management:**
- View pending document verifications
- View uploaded documents (images)
- Extracted OCR data
- Approve/reject with notes
- Bulk approval option

**C. User Management:**
- View all users
- Change user roles (customer → host)
- Disable/enable accounts
- View user verification status

**D. Listing Management:**
- Approve host listings before going live
- Feature listings (premium placement)
- Edit/delete listings
- View listing analytics

**E. Settings:**
- Update company info (name, email, phone)
- Payment gateway settings
- Email/SMS settings
- Commission rates

### 6. Security Hardening

**A. Input Sanitization:**
```php
// All user inputs must be sanitized
$name = htmlspecialchars(trim($_POST['name']));
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
```

**B. SQL Injection Prevention:**
```php
// Always use prepared statements
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
```

**C. XSS Prevention:**
```javascript
// Escape output in React
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
```

**D. CSRF Protection:**
```php
// Generate CSRF token
$csrfToken = bin2hex(random_bytes(32));
$_SESSION['csrf_token'] = $csrfToken;

// Verify on POST
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
    die('Invalid CSRF token');
}
```

**E. Rate Limiting:**
```php
// Limit login attempts
$ip = $_SERVER['REMOTE_ADDR'];
$attempts = getLoginAttempts($ip);
if ($attempts > 5) {
    http_response_code(429);
    die('Too many attempts');
}
```

### 7. Performance Optimization

**A. Image Optimization:**
- Compress uploaded images (use GD or Imagick)
- Generate thumbnails (200x200, 400x300)
- Use WebP format where supported
- Lazy loading for listing images

**B. Database Optimization:**
- Add indexes on frequently queried columns
- Use pagination (LIMIT 20 OFFSET 0)
- Cache frequent queries (Redis or file cache)

**C. Frontend Optimization:**
- Code splitting (React.lazy)
- Optimize bundle size
- Use CDN for static assets
- Service worker for offline support

### 8. Shujaa Host Specific Configuration

**A. PHP Configuration (php.ini):**
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
memory_limit = 256M
max_input_vars = 3000
display_errors = Off
log_errors = On
error_log = /home/username/logs/php_error.log
```

**B. MySQL Configuration:**
- Use MySQLi or PDO (not deprecated mysql_*)
- Enable persistent connections for performance
- Set proper collation: utf8mb4_unicode_ci

**C. File Permissions:**
```bash
# After uploading to Shujaa
chmod 755 uploads/
chmod 644 *.php
chmod 600 api/config/database.php  # Protect credentials
```

**D. Cron Jobs:**
```bash
# Cleanup old temp files (daily)
0 0 * * * /usr/bin/find /home/username/public_html/bemageetz/uploads/ -name "tmp_*" -type f -mtime +1 -delete

# Send pending emails (every 5 minutes)
*/5 * * * * /usr/bin/php /home/username/public_html/bemageetz/api/cron/send-pending-emails.php
```

## Configuration Files to Create

### 1. Environment Variables (.env)
```bash
# Database
DB_HOST=localhost
DB_NAME=yourcpanel_bemageetz
DB_USER=yourcpanel_user
DB_PASS=your_secure_password

# JWT
JWT_SECRET=your_32_character_random_string_here

# Flutterwave
FLW_PUBLIC_KEY=FLWPUBK_TEST-...
FLW_SECRET_KEY=FLWSECK_TEST-...
FLW_ENCRYPTION_KEY=...
FLW_SECRET_HASH=webhook_secret

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=bookings@bemageetz.com
SMTP_PASS=your_app_password

# Africa's Talking SMS
AT_USERNAME=your_username
AT_API_KEY=your_api_key

# Company Info
COMPANY_NAME=Bema Geetz Limited
COMPANY_PHONE=+254708771345
COMPANY_EMAIL=bookings@bemageetz.com
```

### 2. PHP Config Loader
```php
// api/config/env.php
$envFile = __DIR__ . '/../../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        putenv(trim($key) . '=' . trim($value));
    }
}
```

## Testing Checklist Before Going Live

### Functionality Tests
- [ ] Register new user
- [ ] Login with correct/incorrect credentials
- [ ] Create listing with 5 images
- [ ] View listing on home page
- [ ] Book listing with deposit payment
- [ ] Receive confirmation email
- [ ] Receive SMS notification
- [ ] WhatsApp opens with details
- [ ] Upload DL front and back
- [ ] OCR extracts text correctly
- [ ] Admin approves verification
- [ ] Verified user can book restricted listing
- [ ] Admin approves booking
- [ ] Payment webhook updates status
- [ ] Generate and download invoice

### Security Tests
- [ ] SQL injection attempt blocked
- [ ] XSS attempt blocked
- [ ] File upload rejects non-image files
- [ ] File upload rejects oversized files
- [ ] JWT token expires correctly
- [ ] CSRF token validated
- [ ] Rate limiting works on login
- [ ] Admin area restricted to admins

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] Image upload completes in < 10 seconds
- [ ] Database queries < 100ms
- [ ] Mobile responsive on all pages
- [ ] Works on Chrome, Firefox, Safari, Edge

### Hosting Tests
- [ ] All files uploaded successfully
- [ ] Database imported without errors
- [ ] Permissions set correctly
- [ ] SSL certificate installed
- [ ] HTTPS redirects working
- [ ] Cron jobs configured
- [ ] Error logs writable

## Estimated Development Time

| Feature | Time Estimate | Priority |
|---------|---------------|----------|
| OCR Integration | 8-16 hours | High |
| Email System | 4-8 hours | High |
| SMS System | 4-6 hours | High |
| Flutterwave Payment | 8-12 hours | High |
| Admin Dashboard | 16-24 hours | Medium |
| Security Hardening | 8-12 hours | High |
| Performance Optimization | 4-8 hours | Low |
| Testing & Bug Fixes | 8-16 hours | High |
| **TOTAL** | **52-102 hours** | |

## Next Steps

1. **Copy the COMPLETE_FIX_PROMPT.md prompt**
2. **Paste into Claude**
3. **Request implementation of all features**
4. **Test locally**
5. **Deploy to Shujaa**
6. **Test on production**
7. **Go live**

## Support Resources

- **Flutterwave Docs:** https://developer.flutterwave.com/
- **Africa's Talking:** https://africastalking.com/
- **Shujaa Host Support:** support@shujaahost.com
- **Tesseract OCR:** https://github.com/tesseract-ocr/tesseract
- **PHPMailer:** https://github.com/PHPMailer/PHPMailer
