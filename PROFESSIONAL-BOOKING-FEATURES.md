# Bema Geetz - Professional Booking System Features

Complete professional booking system with payments, invoicing, and notifications.

---

## 🆕 New Features Added

### 1. **M-Pesa Payment Integration** 💰
- **STK Push** to customer's phone
- Real-time payment confirmation
- Automatic receipt generation
- Secure callback handling

**API Endpoints:**
- `POST /api/payments/mpesa` - Initiate payment
- `GET /api/payments/mpesa?checkout_request_id=xxx` - Check status
- `POST /api/payments/mpesa-callback` - M-Pesa callback (server-to-server)

**How it works:**
1. Customer clicks "Pay Now" on booking
2. Enter M-Pesa phone number
3. STK push sent to customer's phone
4. Customer enters PIN
5. Payment confirmed automatically
6. Receipt generated and emailed

---

### 2. **Automatic Invoice Generation** 📄
- Professional PDF-ready invoices
- Unique invoice numbers (INV-YYYYMMDD-XXXXXX)
- Company details (KRA PIN, address)
- Itemized charges
- Payment instructions with M-Pesa paybill

**Tables:**
- `invoices` - Stores all invoice data
- Auto-generated on booking creation

**Download:**
- `/api/invoices/download/{invoice_number}` - View/print invoice

---

### 3. **Receipt Generation** 🧾
- Automatic receipt after payment
- Receipt number (RCP-YYYYMMDD-XXXXXX)
- Transaction reference
- Payment method details
- PDF-ready format

**Tables:**
- `receipts` - Stores all receipts
- Linked to payments and bookings

---

### 4. **Email Notifications** 📧
- **Booking Confirmation** - Sent immediately after booking
- **Payment Receipt** - Sent after successful payment
- **Invoice** - Sent with payment instructions
- **Admin Alerts** - New bookings, payments

**Configuration:**
Update in database `settings` table:
- `smtp_host` - SMTP server
- `smtp_port` - Usually 587
- `smtp_username` - Email address
- `smtp_password` - Email password
- `smtp_from_name` - "Bema Geetz"

---

### 5. **SMS Notifications** 📱
- **Booking Confirmation** - Via Africa's Talking
- **Payment Receipt** - M-Pesa confirmation
- **Reminders** - Before check-in

**Configuration:**
Update in database `settings` table:
- `sms_provider` - "africastalking"
- `sms_api_key` - Africa's Talking API key
- `sms_username` - Africa's Talking username

---

### 6. **Booking Status Workflow** 📊

**Status Types:**
- `pending` - Awaiting payment
- `confirmed` - Payment received
- `cancelled` - Booking cancelled

**Payment Status:**
- `unpaid` - No payment
- `partial` - Deposit paid
- `paid` - Full payment
- `refunded` - Refunded

**Automatic Updates:**
- Booking confirmed automatically on payment
- Status history tracked
- Admin dashboard shows all statuses

---

### 7. **Admin Payment Management** 💼

**New Admin Tab: "Payments"**
- View all payments
- Filter by status
- Total revenue calculation
- Transaction codes
- Customer details

**Features:**
- Real-time payment monitoring
- Failed payment tracking
- Manual status updates (if needed)

---

## 🗄️ Database Schema Updates

### New Tables:

```sql
-- Payments (M-Pesa transactions)
CREATE TABLE payments (
    id, booking_id, amount, currency, payment_method,
    payment_status, mpesa_receipt, mpesa_phone,
    mpesa_checkout_request_id, paid_at, created_at
);

-- Invoices (Professional invoices)
CREATE TABLE invoices (
    id, invoice_number, booking_id, customer_name,
    amount, tax_amount, total_amount, due_date,
    status, pdf_path, sent_at, paid_at
);

-- Receipts (After payment)
CREATE TABLE receipts (
    id, receipt_number, invoice_id, payment_id,
    amount, transaction_reference, pdf_path
);

-- Email notifications log
CREATE TABLE email_notifications (...);

-- SMS notifications log
CREATE TABLE sms_notifications (...);

-- Booking status history
CREATE TABLE booking_status_history (...);

-- Settings (configuration)
CREATE TABLE settings (...);
```

---

## 🎨 Frontend Updates

### MyBookings Page:
- **Payment Status Badges** - Paid/Unpaid/Partial
- **Pay Now Button** - Triggers M-Pesa modal
- **Download Invoice** - View/print invoice
- **Balance Display** - Shows remaining amount

### PaymentModal Component:
- Phone number input
- Amount selection (deposit or full)
- Real-time status polling
- M-Pesa instructions
- Success/error handling

### AdminDashboard:
- **New "Payments" Tab**
- Payment listing table
- Revenue totals
- Transaction details

---

## 🔌 API Endpoints Summary

### Payments:
```
POST   /api/payments/mpesa              - Initiate M-Pesa
GET    /api/payments/mpesa?checkout_id  - Check status
POST   /api/payments/mpesa-callback      - M-Pesa callback
```

### Invoices:
```
GET    /api/invoices/download/{id}      - Download invoice
```

### Bookings (Enhanced):
```
POST   /api/bookings/create              - Create + generate invoice
GET    /api/bookings/my                 - Get with payment status
```

### Admin:
```
GET    /api/admin/payments               - All payments
PATCH  /api/admin/payments               - Update status
```

---

## ⚙️ Configuration Guide

### Step 1: Update Database Schema
```bash
# Run in phpMyAdmin or via install.php
mysql-schema-pro.sql
```

### Step 2: Configure M-Pesa (Safaricom Daraja)

1. Register at https://developer.safaricom.co.ke
2. Create app (Sandbox for testing)
3. Get Consumer Key & Secret
4. Update settings in database:

```sql
UPDATE settings SET setting_value = 'your_consumer_key' WHERE setting_key = 'mpesa_consumer_key';
UPDATE settings SET setting_value = 'your_consumer_secret' WHERE setting_key = 'mpesa_consumer_secret';
UPDATE settings SET setting_value = 'your_shortcode' WHERE setting_key = 'mpesa_shortcode';
UPDATE settings SET setting_value = 'your_passkey' WHERE setting_key = 'mpesa_passkey';
UPDATE settings SET setting_value = 'sandbox' WHERE setting_key = 'mpesa_environment'; -- Change to 'production' when live
```

### Step 3: Configure Email (SMTP)

For Gmail:
```sql
UPDATE settings SET setting_value = 'smtp.gmail.com' WHERE setting_key = 'smtp_host';
UPDATE settings SET setting_value = '587' WHERE setting_key = 'smtp_port';
UPDATE settings SET setting_value = 'your-email@gmail.com' WHERE setting_key = 'smtp_username';
UPDATE settings SET setting_value = 'your-app-password' WHERE setting_key = 'smtp_password';
```

Note: Use Gmail App Password, not your regular password.

### Step 4: Configure SMS (Africa's Talking)

1. Register at https://africastalking.com
2. Get API key
3. Update settings:

```sql
UPDATE settings SET setting_value = 'your_api_key' WHERE setting_key = 'sms_api_key';
UPDATE settings SET setting_value = 'your_username' WHERE setting_key = 'sms_username';
```

### Step 5: Update Company Details

```sql
UPDATE settings SET setting_value = 'Bema Geetz Limited' WHERE setting_key = 'company_name';
UPDATE settings SET setting_value = 'bookings@bemageetz.com' WHERE setting_key = 'company_email';
UPDATE settings SET setting_value = 'P001234567X' WHERE setting_key = 'company_kra_pin';
UPDATE settings SET setting_value = 'Nairobi, Kenya' WHERE setting_key = 'company_address';
UPDATE settings SET setting_value = '+254 700 000 000' WHERE setting_key = 'company_phone';
```

---

## 🧪 Testing

### Test M-Pesa Payment:
1. Create a booking
2. Go to My Bookings
3. Click "Pay Now"
4. Enter phone: `254708374149` (Safaricom test number)
5. Amount: `1` (Test amount)
6. You should receive STK push (in sandbox)

### Test Email:
1. Configure SMTP settings
2. Create booking
3. Check email inbox

### Test Invoice:
1. Create booking
2. Invoice auto-generated
3. Click "Download Invoice"
4. Should show professional invoice

---

## 🚀 Deployment Checklist

- [ ] Import `mysql-schema-pro.sql`
- [ ] Configure M-Pesa credentials
- [ ] Configure SMTP credentials
- [ ] Configure SMS credentials
- [ ] Update company details
- [ ] Test payment flow
- [ ] Test email notifications
- [ ] Test invoice download
- [ ] Set M-Pesa to production (when ready)
- [ ] Set callback URL in Safaricom portal

---

## 📊 Business Benefits

✅ **Professional Image** - Invoices, receipts, branded emails
✅ **Faster Payments** - M-Pesa STK push (instant)
✅ **Automated Workflow** - No manual confirmation needed
✅ **Revenue Tracking** - Admin dashboard shows all payments
✅ **Customer Trust** - Receipts, notifications, transparency
✅ **Legal Compliance** - KRA PIN on invoices

---

## 🔒 Security Notes

- M-Pesa credentials stored encrypted in database
- JWT tokens for API authentication
- Callback validation
- SQL injection prevention (prepared statements)
- XSS protection (output encoding)

---

**Your booking system is now fully professional! 🎉**
