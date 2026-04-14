# Bema Geetz - Payment System Setup Guide

Complete payment integration using **Flutterwave** (supports Cards, M-Pesa, Bank Transfer, USSD).

---

## 🎯 **Payment Options Available**

| Method | Description | Provider |
|--------|-------------|----------|
| 💳 **Visa/Mastercard** | Credit/Debit card payments | Flutterwave |
| 📱 **M-Pesa** | Mobile money | Flutterwave |
| 🏦 **Bank Transfer** | Direct bank transfer | Flutterwave |
| 📞 **USSD** | Mobile USSD code | Flutterwave |

---

## 🚀 **Quick Setup (Flutterwave)**

### Step 1: Create Flutterwave Account

1. Visit: https://flutterwave.com
2. Sign up for a business account
3. Complete KYC verification (required for live payments)
4. Get your API keys from Dashboard → Settings → API

### Step 2: Update Database Settings

Run this SQL in phpMyAdmin:

```sql
-- Flutterwave Settings
UPDATE settings SET setting_value = 'YOUR_PUBLIC_KEY' 
WHERE setting_key = 'flutterwave_public_key';

UPDATE settings SET setting_value = 'YOUR_SECRET_KEY' 
WHERE setting_key = 'flutterwave_secret_key';

UPDATE settings SET setting_value = 'YOUR_ENCRYPTION_KEY' 
WHERE setting_key = 'flutterwave_encryption_key';

-- For testing: 'sandbox', for production: 'production'
UPDATE settings SET setting_value = 'sandbox' 
WHERE setting_key = 'flutterwave_environment';

-- Update your company details
UPDATE settings SET setting_value = 'Your Company Name' 
WHERE setting_key = 'company_name';

UPDATE settings SET setting_value = 'your@email.com' 
WHERE setting_key = 'company_email';

UPDATE settings SET setting_value = 'P001234567X' 
WHERE setting_key = 'company_kra_pin';
```

### Step 3: Configure Webhook URL

In Flutterwave Dashboard:
1. Go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Secret hash: Use your `flutterwave_secret_key`
4. Events: Select `charge.completed`

### Step 4: Test Payment

1. Create a booking
2. Click "Pay Now"
3. Select any payment method in Flutterwave checkout
4. For testing, use Flutterwave test cards or test M-Pesa

---

## 🧪 **Testing Credentials**

### Test Cards (from Flutterwave docs):

| Card Type | Number | CVV | Expiry |
|-----------|--------|-----|--------|
| Visa | 4187427415564246 | 828 | 09/32 |
| Mastercard | 5438898014560229 | 564 | 09/32 |

### Test M-Pesa:
- Enter any phone number format: 0712345678 or 254712345678
- Use Flutterwave sandbox mode

---

## 📁 **File Structure**

```
php-api/
├── payments/
│   ├── index.php          # Initialize payment (POST)
│   ├── webhook.php        # Payment confirmation
│   └── mpesa.php          # Direct M-Pesa (optional backup)
├── utils/
│   ├── notifications.php  # Email & SMS
│   └── invoice-generator.php
└── admin/
    └── payments.php       # Admin payment view

frontend/src/components/
└── PaymentModal.jsx       # Payment UI
```

---

## 🔌 **API Endpoints**

### Initialize Payment
```
POST /api/payments
Body: {
  "booking_id": "...",
  "amount": 15000
}
Response: {
  "success": true,
  "payment_link": "https://checkout.flutterwave.com/...",
  "tx_ref": "BG-20240115-ABC123"
}
```

### Check Payment Status
```
GET /api/payments?tx_ref=BG-20240115-ABC123
```

### Webhook (Server-to-Server)
```
POST /api/payments/webhook
- Called by Flutterwave when payment completes
- Updates booking status automatically
- Sends email/SMS receipts
```

---

## 📧 **Email Receipts Setup**

### Option 1: Gmail SMTP (Easiest)

```sql
UPDATE settings SET setting_value = 'smtp.gmail.com' 
WHERE setting_key = 'smtp_host';

UPDATE settings SET setting_value = '587' 
WHERE setting_key = 'smtp_port';

UPDATE settings SET setting_value = 'your-email@gmail.com' 
WHERE setting_key = 'smtp_username';

UPDATE settings SET setting_value = 'your-app-password' 
WHERE setting_key = 'smtp_password';
```

**Get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that as `smtp_password`

### Option 2: Your Hosting Email

Use your hosting provider's SMTP settings.

---

## 📱 **SMS Notifications Setup (Optional)**

### Africa's Talking:

1. Register: https://africastalking.com
2. Get API key
3. Update settings:

```sql
UPDATE settings SET setting_value = 'africastalking' 
WHERE setting_key = 'sms_provider';

UPDATE settings SET setting_value = 'YOUR_API_KEY' 
WHERE setting_key = 'sms_api_key';

UPDATE settings SET setting_value = 'YOUR_USERNAME' 
WHERE setting_key = 'sms_username';
```

---

## ✅ **Deployment Checklist**

- [ ] Import `mysql-schema-pro.sql` to database
- [ ] Create Flutterwave account
- [ ] Add API keys to settings table
- [ ] Configure webhook URL in Flutterwave dashboard
- [ ] Update company details (KRA PIN, address, etc.)
- [ ] Configure SMTP for email receipts
- [ ] (Optional) Configure SMS for notifications
- [ ] Test payment in sandbox mode
- [ ] Switch to production mode
- [ ] Verify webhook is receiving callbacks
- [ ] Test complete booking → payment → receipt flow

---

## 🔄 **How It Works**

```
1. Customer clicks "Pay Now" on booking
        ↓
2. Frontend calls /api/payments (amount + booking_id)
        ↓
3. Backend creates payment record (status: pending)
        ↓
4. Backend calls Flutterwave to get checkout link
        ↓
5. Customer redirected to Flutterwave checkout
        ↓
6. Customer selects: Card / M-Pesa / Bank / USSD
        ↓
7. Customer completes payment on Flutterwave
        ↓
8. Flutterwave sends webhook to /api/payments/webhook
        ↓
9. Backend updates payment → completed
        ↓
10. Backend updates booking → confirmed
        ↓
11. Backend generates receipt
        ↓
12. Backend sends email + SMS receipt to customer
        ↓
13. Frontend shows "Payment Successful!"
```

---

## 🛡️ **Security Features**

- ✅ Webhook signature verification
- ✅ JWT authentication for API endpoints
- ✅ Transaction reference validation
- ✅ SQL injection prevention (prepared statements)
- ✅ HTTPS required for webhooks
- ✅ Payment amount validation

---

## 📊 **Admin Dashboard**

**New "Payments" Tab:**
- View all payments
- Filter by status (completed, pending, failed)
- See total revenue
- View transaction details
- Download receipts

---

## 💰 **Fees (Flutterwave)**

| Method | Fee |
|--------|-----|
| Local Cards | 1.4% |
| International Cards | 3.8% |
| M-Pesa | 1% |
| Bank Transfer | 1% |

*Subject to Flutterwave's current pricing. Check their website for latest rates.*

---

## 🆘 **Troubleshooting**

### Webhook not receiving?
- Check URL is accessible from internet
- Verify SSL certificate (HTTPS required)
- Check webhook secret hash matches
- Check server logs for errors

### Payment stuck on "pending"?
- Webhook not configured correctly
- Check firewall blocking Flutterwave IPs
- Manually verify transaction in Flutterwave dashboard

### Email receipts not sending?
- Verify SMTP settings
- Check spam folders
- Use Gmail App Password (not regular password)
- Check PHP mail() function enabled

---

## 📚 **Resources**

- **Flutterwave Docs**: https://developer.flutterwave.com
- **Test Cards**: https://developer.flutterwave.com/docs/test-cards
- **Webhook Guide**: https://developer.flutterwave.com/docs/webhooks

---

**Your payment system is ready! 🎉**

Customers can now pay with: **Cards, M-Pesa, Bank Transfer, or USSD** - all through one integration!
