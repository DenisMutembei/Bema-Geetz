# 🏆 BEMA GEETZ — Premium Car Hire & Accommodations

> *Redefining Excellence* — A full-stack marketplace platform for car hire and accommodation rentals in Nairobi & Nakuru, Kenya.

![Bema Geetz](https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=60)

---

## ✨ Features

- 🚗 **Car Hire & House Listings** — Create, edit, browse listings with full image/video galleries
- 📸 **Media Upload** — Upload photos AND videos directly from the dashboard
- 📅 **Booking System** — Auto-generates invoice IDs (BG-timestamp format)
- 💬 **WhatsApp Integration** — Bookings auto-send to WhatsApp with full details
- 🔗 **Pre-filled Booking Links** — `/booking?name=Millie` auto-fills customer name
- 🔐 **JWT Auth** — Register/Login with roles: admin, host, customer
- ⚙️ **Admin Dashboard** — Manage users, listings, bookings
- 🏠 **Host Dashboard** — Hosts manage their own listings
- 🎨 **Black & Gold Theme** — Matches Bema Geetz brand identity

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Uploads | Multer (images & videos) |
| Deploy (FE) | Vercel |
| Deploy (BE) | Render |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ installed and running
- npm or yarn

---

### Step 1 — Clone & Install

```bash
# Install backend dependencies
cd bema-geetz/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Set Up Environment Variables

**Backend** — copy and edit:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/bemageetz
JWT_SECRET=change_this_to_a_long_random_string_in_production
FRONTEND_URL=http://localhost:5173
WHATSAPP_NUMBER=254700000000
```

**Frontend** — copy and edit:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WHATSAPP=254700000000
```

> ⚠️ Replace `254700000000` with your actual WhatsApp number (no + prefix, include country code).

---

### Step 3 — Create the Database

```bash
# In PostgreSQL (psql or pgAdmin)
CREATE DATABASE bemageetz;
```

---

### Step 4 — Seed the Database

```bash
cd backend
node seed.js
```

This will:
- Create all tables (users, listings, bookings)
- Create admin user: `admin@bemageetz.com` / `admin123`
- Create sample host: `host@bemageetz.com` / `host123`
- Add 3 sample listings

---

### Step 5 — Run the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd bema-geetz/backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd bema-geetz/frontend
npm run dev
# App runs on http://localhost:5173
```

---

## 🌐 Deployment

### Frontend → Vercel

```bash
# Install Vercel CLI
npm i -g vercel

cd bema-geetz/frontend

# Set env variable on Vercel
# VITE_API_URL=https://your-backend.onrender.com/api
# VITE_WHATSAPP=254700000000

vercel --prod
```

### Backend → Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set root to `backend/`
4. Add a **PostgreSQL** database on Render
5. Set environment variables:
   - `DATABASE_URL` → from Render DB
   - `JWT_SECRET` → random long string
   - `FRONTEND_URL` → your Vercel URL
   - `WHATSAPP_NUMBER` → e.g. `254700000000`
6. Run seed: add `node seed.js` as a one-time job or run manually in Render shell

---

## 📁 Project Structure

```
bema-geetz/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation with auth
│   │   │   ├── WhatsAppButton.jsx  # Floating WhatsApp CTA
│   │   │   ├── ListingCard.jsx     # Listing preview card
│   │   │   ├── SearchBar.jsx       # Filter/search component
│   │   │   └── MediaUpload.jsx     # Image & video uploader
│   │   ├── pages/
│   │   │   ├── Home.jsx            # Landing page with hero
│   │   │   ├── Cars.jsx            # Car listings browse
│   │   │   ├── Houses.jsx          # House listings browse
│   │   │   ├── ListingDetail.jsx   # Detail + gallery + booking
│   │   │   ├── Booking.jsx         # Booking form → WhatsApp
│   │   │   ├── Login.jsx           # Sign in
│   │   │   ├── Register.jsx        # Sign up (customer/host)
│   │   │   ├── CreateListing.jsx   # Host creates listing
│   │   │   ├── HostDashboard.jsx   # Host manages listings
│   │   │   └── AdminDashboard.jsx  # Admin full control
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT auth state
│   │   └── services/
│   │       └── api.js              # Axios instance
│   └── ...config files
│
├── backend/
│   ├── routes/
│   │   ├── auth.js       # /api/auth/register, /login, /me
│   │   ├── listings.js   # /api/listings CRUD
│   │   ├── bookings.js   # /api/bookings
│   │   ├── admin.js      # /api/admin/* (protected)
│   │   └── upload.js     # /api/upload (images + videos)
│   ├── middleware/
│   │   └── auth.js       # JWT, admin, host middleware
│   ├── uploads/          # Stored media files
│   ├── db.js             # PostgreSQL connection
│   ├── server.js         # Express app
│   └── seed.js           # DB setup + demo data
│
└── database/
    └── schema.sql        # Raw SQL schema
```

---

## 🔗 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | JWT | Get current user |
| GET | `/api/listings` | Public | List all (+ filters) |
| GET | `/api/listings/:id` | Public | Single listing |
| POST | `/api/listings` | Host/Admin | Create listing |
| PUT | `/api/listings/:id` | Host/Admin | Update listing |
| DELETE | `/api/listings/:id` | Host/Admin | Delete listing |
| GET | `/api/listings/host/mine` | Host | My listings |
| POST | `/api/bookings` | Public | Create booking |
| POST | `/api/upload` | JWT | Upload media |
| GET | `/api/admin/stats` | Admin | Platform stats |
| GET | `/api/admin/users` | Admin | All users |
| GET | `/api/admin/listings` | Admin | All listings |
| GET | `/api/admin/bookings` | Admin | All bookings |

---

## 💡 Special Features

### Pre-filled Booking Link
Send customers a direct link with their name pre-filled:
```
https://yourdomain.com/booking?name=Millie
https://yourdomain.com/booking?name=Millie&listing=LISTING_UUID
```

### WhatsApp Booking Flow
When a booking is submitted:
1. Invoice ID auto-generated: `BG-1704067200000`
2. Booking stored in database
3. WhatsApp opens automatically with all booking details pre-filled
4. Admin confirms via WhatsApp chat

### Share Listing Booking Link
On every listing detail page, hosts/admins can copy a direct booking link pre-filled with that listing.

---

## 🎨 Brand Colors

| Color | Hex | Usage |
|---|---|---|
| Gold | `#D4A017` | Primary accent |
| Gold Light | `#F5C842` | Hover states |
| Dark | `#0A0A0A` | Background |
| Dark Card | `#141414` | Card backgrounds |
| Dark Border | `#2A2A2A` | Borders |

---

## 🔐 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@bemageetz.com | admin123 |
| Host | host@bemageetz.com | host123 |

> ⚠️ Change these immediately in production!

---

## 📞 WhatsApp Number Setup

Edit these in your `.env` files:
- Backend: `WHATSAPP_NUMBER=254712345678`
- Frontend: `VITE_WHATSAPP=254712345678`

Format: Country code + number, **no + prefix**.
Kenya example: `254712345678` (not `+254712345678`)

---

*Built with ❤️ for Bema Geetz — Redefining Excellence*
