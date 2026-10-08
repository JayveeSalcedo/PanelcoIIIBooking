# Room Booking

Request and approval system for Conference Room 1 & 2, AMA Hall, Staff House and the AM/FM Training Room.

- **Availability** (`/`): day timeline of every room — free, pending, booked.
- **Request a room** (`/request`): open form (no login). Rooms update live as you pick dates/times;
  booked rooms and rooms too small for the pax are disabled. Multi-day events supported.
- **Check status** (`/status`, `/r/<ref>`): requesters track and cancel with their reference number.
- **Approver** (`/admin`): password-protected. Approve / reject (reason required) pending requests,
  cancel approved ones, and edit rooms (capacity, active, order) under **Rooms**.

Rules: a time slot can't be requested if the room is already **approved** for an overlapping time.
Overlapping **pending** requests are allowed and flagged to the approver; once one is approved the others
can't be approved. Times are in Asia/Manila (`src/lib/time.ts`).

## Run locally

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD
npm run dev
```

With no `DATABASE_URL`, an embedded Postgres (PGlite) is stored in `./.pglite`. Delete that folder to reset.

## Deploy to Vercel

1. Push this folder to a GitHub repo and import it in Vercel.
2. In the project, **Storage → Create → Neon (Postgres)** and connect it — this sets `DATABASE_URL`.
   Pick the Singapore region (`aws-ap-southeast-1`) to match the functions region in `vercel.json` (`sin1`).
3. Add env var `ADMIN_PASSWORD` (Settings → Environment Variables).
4. Deploy. Tables and the five default rooms are created automatically on first request.
