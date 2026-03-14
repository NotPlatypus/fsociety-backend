# FSociety Computer Services — Backend

Node.js/Express booking backend for FSociety Computer Services, New York, NY.

## Stack
- **Runtime**: Node.js + Express.js
- **Database**: Neon (PostgreSQL) via Prisma ORM
- **Email**: Resend
- **Auth**: express-session + bcryptjs
- **Security**: Helmet.js + express-rate-limit + express-validator
- **Hosting**: Render.com (free tier)

## Local Development

```bash
npm install
# Create .env and fill in values (see .env file)
npx prisma db push
node server.js
```

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /health | Health check (for cron-job.org) |
| GET | /api/slots?date=YYYY-MM-DD | Get available time slots |
| POST | /api/booking | Create a booking |
| POST | /api/admin/login | Admin login |
| POST | /api/admin/logout | Admin logout |
| GET | /api/admin/check | Check session |
| GET | /api/admin/bookings | Get all bookings |
| PUT | /api/admin/bookings/:id/confirm | Confirm booking |
| PUT | /api/admin/bookings/:id/cancel | Cancel booking |
| POST | /api/admin/block | Block a date |
| DELETE | /api/admin/block/:id | Unblock a date |
| GET | /api/admin/blocked | Get blocked dates |

## Public Pages (served from /public)

- `/booking.html` — Client booking form
- `/admin.html` — Admin login
- `/dashboard.html` — Admin dashboard

## Deployment

See the deployment guide generated with your files or follow the Render.com setup:
1. Push this repo to GitHub (`fsociety-backend`)
2. Connect repo on render.com → New Web Service
3. Render reads `render.yaml` automatically
4. Add environment variables in Render dashboard
5. Deploy

## Environment Variables (set in Render dashboard only)

```
DATABASE_URL         — Neon PostgreSQL connection string
RESEND_API_KEY       — Resend API key
ADMIN_USERNAME       — Admin panel username
ADMIN_PASSWORD_HASH  — bcrypt hash of admin password
SESSION_SECRET       — Random 32+ char string
ADMIN_EMAIL          — Where booking notifications are sent
```

**⚠️ Never commit `.env` to GitHub.**
