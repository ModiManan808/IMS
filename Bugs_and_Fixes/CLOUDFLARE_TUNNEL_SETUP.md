# Cloudflare Tunnel Backend Connection Fix

## Problem

Your frontend is accessible via Cloudflare tunnel:
- **Frontend**: https://hydraulic-visiting-patents-rejected.trycloudflare.com
- **Backend**: Running on `localhost:5586` (not accessible from internet)

When your mentor opens the Cloudflare URL, the frontend tries to connect to `localhost:5586` which doesn't exist on their machine.

---

## Solution Options

### ✅ Option 1: Create Cloudflare Tunnel for Backend (RECOMMENDED)

**Step 1: Create backend tunnel**
```bash
cd c:\Users\modim\Code\IMS\ims-backend-main
cloudflared tunnel --url http://localhost:5586
```

This will give you a URL like: `https://some-random-url.trycloudflare.com`

**Step 2: Update frontend environment variable**
```bash
# In frontend terminal
set REACT_APP_API_URL=https://your-backend-tunnel-url.trycloudflare.com/api
npm start
```

**Step 3: Update CORS in backend**

Add the frontend Cloudflare URL to CORS:

File: `ims-backend-main/server.js`
```javascript
app.use(cors({
  origin: [
    'http://localhost:3759',
    'https://hydraulic-visiting-patents-rejected.trycloudflare.com'
  ],
  credentials: true
}));
```

---

### Option 2: Use Single Tunnel with Path Routing (Advanced)

Create a `cloudflared` config file to route both frontend and backend through one tunnel.

---

## Quick Setup Commands

**Terminal 1 - Backend:**
```bash
cd c:\Users\modim\Code\IMS\ims-backend-main
node server.js
```

**Terminal 2 - Backend Tunnel:**
```bash
cloudflared tunnel --url http://localhost:5586
```
Copy the URL you get (e.g., `https://abc-123.trycloudflare.com`)

**Terminal 3 - Frontend (with backend URL):**
```bash
cd c:\Users\modim\Code\IMS\ims-frontend-main
set REACT_APP_API_URL=https://abc-123.trycloudflare.com/api
npm start
```

**Terminal 4 - Frontend Tunnel:**
```bash
cd c:\Users\modim\Code\IMS\ims-frontend-main
cloudflared tunnel --url http://localhost:3759
```

---

## Backend CORS Update

**File**: `c:/Users/modim/Code/IMS/ims-backend-main/server.js`

Find the CORS configuration and update it to:

```javascript
const allowedOrigins = [
  'http://localhost:3759',
  process.env.FRONTEND_URL,
  'https://hydraulic-visiting-patents-rejected.trycloudflare.com'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

---

## Verification Steps

1. Open backend tunnel URL in browser → should see "Cannot GET /"
2. Try backend tunnel URL + `/api` → should see API response or error
3. Open frontend tunnel URL → should load the homepage
4. Try logging in → should work if CORS is configured correctly

---

## Common Issues

### Issue 1: CORS Error
**Error**: "Access-Control-Allow-Origin header is missing"
**Fix**: Update backend CORS to include frontend Cloudflare URL

### Issue 2: Backend URL Not Updated
**Error**: "Network Error" or "ERR_CONNECTION_REFUSED"
**Fix**: Make sure `REACT_APP_API_URL` is set before running `npm start`

### Issue 3: Tunnel Disconnects
**Fix**: Keep terminal windows open. Cloudflare tunnel requires active connection.

---

## For Your Mentor

Share these URLs:
- **Frontend**: https://hydraulic-visiting-patents-rejected.trycloudflare.com
- **Backend**: Your backend tunnel URL
- **Login**: `admin` / `admin123`

---

## Alternative: Use .env File

Instead of setting environment variable each time:

**File**: `ims-frontend-main/.env`
```
REACT_APP_API_URL=https://your-backend-tunnel.trycloudflare.com/api
```

Then just run `npm start` normally.
