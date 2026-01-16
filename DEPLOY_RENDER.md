# Deploy to Render (Interview Demo)

This repo has **3 runtimes**:

1. **Frontend (Next.js)** — Node server (needs `next start`)
2. **Backend API (Flask)** — HTTP REST endpoints
3. **WebSocket server (python-websockets)** — real-time chat + private rooms

On Render, each service gets **one public port** (the `PORT` env var). Since your backend uses a **separate WebSocket port**, the simplest production setup is **3 Render Web Services**.

---

## 0) Create resources

### A) PostgreSQL

Create a Render **PostgreSQL** database.

-   Copy its **External Database URL** into `DATABASE_URL` for the backend services.

### B) Redis

Create a Render **Redis** instance (or use Upstash).

-   Copy its connection string into `REDIS_URL`.

---

## 1) Deploy Backend API service (Flask)

Create a Render **Web Service**:

-   **Name**: `findmyfriend-api`
-   **Root Directory**: `backend`
-   **Build Command**:
    -   `pip install -r requirements.txt`
-   **Start Command** (recommended):
    -   `gunicorn -w 1 -k gthread -t 120 -b 0.0.0.0:$PORT run:app`

Environment variables (minimum):

-   `DATABASE_URL` = (from Render Postgres)
-   `REDIS_URL` = (from Render Redis/Upstash)
-   `SECRET_KEY` = long random string
-   `WEBSOCKET_AUTOSTART` = `false` (important: don’t bind a second WS port here)
-   `CORS_ORIGINS` = `https://<your-frontend-service>.onrender.com`
-   `WEBSOCKET_PUBLIC_URL` = `wss://<your-ws-service>.onrender.com`

Optional (only if you use Google login):

-   `GOOGLE_CLIENT_ID`
-   `GOOGLE_CLIENT_SECRET`

---

## 2) Deploy WebSocket service (python-websockets)

Create another Render **Web Service**:

-   **Name**: `findmyfriend-ws`
-   **Root Directory**: `backend`
-   **Build Command**:
    -   `pip install -r requirements.txt`
-   **Start Command**:
    -   `python ws_run.py`

Environment variables:

-   `DATABASE_URL` = same as API
-   `REDIS_URL` = same as API
-   `SECRET_KEY` = same as API
-   `WEBSOCKET_AUTOSTART` = `false` (recommended)

This service will listen on Render’s `PORT` and accept WebSocket connections at:

-   `wss://findmyfriend-ws.onrender.com`

---

## 3) Deploy Frontend service (Next.js)

Create a Render **Web Service** (not Static Site, because you use Next.js route handlers):

-   **Name**: `findmyfriend-frontend`
-   **Root Directory**: `frontend`
-   **Build Command**:
    -   `npm ci && npm run build`
-   **Start Command**:
    -   `npm run start`

Environment variables:

-   `NEXT_PUBLIC_BACKEND_URL` = `https://<your-api-service>.onrender.com`

Notes:

-   Your frontend calls `/api/...` (Next route handlers), which then call the Flask backend via `NEXT_PUBLIC_BACKEND_URL`.

---

## Quick sanity checks

After all deploys are green:

-   Open the frontend URL and sign in.
-   In the API service logs, confirm requests hit `/api/auth/...` and `/api/chat/...`.
-   In the WS service logs, confirm you see `WebSocket server running on ws://0.0.0.0:<port>`.

---

## Common gotchas

-   **CORS blocked in browser**: set `CORS_ORIGINS` on the API service to your frontend URL.
-   **Wrong Postgres URL scheme**: Render sometimes provides `postgres://...`; backend normalizes to `postgresql://...`.
-   **WebSocket URL**: ensure `WEBSOCKET_PUBLIC_URL` is set on the API service to `wss://<ws-service>.onrender.com`.
