# EduShare Run Guide

## 1) Install dependencies

From the project root:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

## 2) Environment files

### Server
Copy:

- `server/.env.example` -> `server/.env`

### Client
Copy:

- `client/.env.example` -> `client/.env`

## 3) Database

Preferred:
- put your MongoDB connection string in `server/.env` as `MONGODB_URI`

Fallbacks already supported:
- if `MONGODB_URI` is missing and `mongodb-memory-server` is installed, the backend can start with an in-memory MongoDB
- otherwise set a normal MongoDB URI manually

## 4) Optional sample data

```bash
cd server
npm run seed
```

Use this only when you want a fresh demo dataset for presentation or development.

You can skip seeding and create your own real users from the sign-up page instead.

Sample accounts created by the seed:
- Admin: `admin@edushare.com` / `Admin123`
- Student seller dashboard: `nimali@example.com` / `Student123`
- Student buyer: `kasun@example.com` / `Student123`

## 5) Start backend

```bash
cd server
npm run dev
```

## 6) Start frontend

In a second terminal:

```bash
cd client
npm start
```

## Default URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Main page routes

- `/dashboard` – earnings dashboard
- `/upload` – upload and manage resources
- `/browse` – academic resource marketplace
- `/cart` – cart and checkout
- `/library` – purchased resources
- `/orders` – payment verification workflow
- `/settings` – profile and password settings
- `/admin/dashboard` – admin verification panel

## Notes

- Uploaded files are stored in `server/uploads/`
- The frontend uses `REACT_APP_API_URL`
- The backend serves uploaded files from `/uploads`
- Paid resources require checkout before download
