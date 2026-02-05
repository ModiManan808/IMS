# Quick Cloudflare Tunnel Setup

## What You Need to Do

### Step 1: Create Backend Tunnel (New Terminal)
```bash
cd c:\Users\modim\Code\IMS\ims-backend-main
cloudflared tunnel --url http://localhost:5586
```

**You'll see output like:**
```
2024-02-04... INF +--------------------------------------------------------------------------------------------+
2024-02-04... INF |  Your quick tunnel is running at https://some-random-words-1234.trycloudflare.com     |
2024-02-04... INF +--------------------------------------------------------------------------------------------+
```

**COPY THIS URL!** (e.g., `https://some-random-words-1234.trycloudflare.com`)

---

### Step 2: Update Frontend to Use Backend Tunnel

**Option A: Using Environment Variable (Temporary)**
```bash
# Stop frontend if running (Ctrl+C)
cd c:\Users\modim\Code\IMS\ims-frontend-main

# Set backend URL (replace with YOUR backend tunnel URL)
set REACT_APP_API_URL=https://some-random-words-1234.trycloudflare.com/api

# Start frontend
npm start
```

**Option B: Using .env File (Persistent)**

Create/Edit file: `ims-frontend-main/.env`
```
REACT_APP_API_URL=https://your-backend-tunnel-url.trycloudflare.com/api
```

Then just run `npm start`

---

### Step 3: Verify Everything Works

1. **Check backend tunnel**: Open `https://your-backend-tunnel-url.trycloudflare.com/api` in browser
   - Should see something (not blank)

2. **Check frontend**: Open `https://hydraulic-visiting-patents-rejected.trycloudflare.com`
   - Should load homepage

3. **Try logging in**: Use `admin` / `admin123`
   - If you get CORS error, backend tunnel isn't running
   - If you get network error, check `REACT_APP_API_URL` is set correctly

---

## Current Setup

✅ **Backend CORS**: Already configured to allow your Cloudflare frontend URL  
✅ **Frontend Tunnel**: Already running at https://hydraulic-visiting-patents-rejected.trycloudflare.com  
⏳ **Backend Tunnel**: You need to create this  
⏳ **Frontend ENV**: You need to set `REACT_APP_API_URL`

---

## What to Share with Your Mentor

Once everything is running:

**URLs:**
- Frontend: https://hydraulic-visiting-patents-rejected.trycloudflare.com
- Backend: (Your backend tunnel URL)

**Login:**
- Username: `admin`
- Password: `admin123`

**Note:** Keep all terminal windows open! Closing them will stop the tunnels.

---

## Troubleshooting

### "Network Error" in Browser Console
- Backend tunnel not running
- `REACT_APP_API_URL` not set correctly
- Run: `echo %REACT_APP_API_URL%` to check

### "CORS policy" Error
- Backend tunnel URL not matching frontend's API URL
- Restart backend server after CORS changes

### Tunnel Disconnects
- This is normal with free cloudflared tunnels
- Just restart the tunnel command

---

## Terminal Layout

You'll need 4 terminals running:

1. **Backend Server**: `node server.js`
2. **Backend Tunnel**: `cloudflared tunnel --url http://localhost:5586`
3. **Frontend Server**: `npm start` (with `REACT_APP_API_URL` set)
4. **Frontend Tunnel**: `cloudflared tunnel --url http://localhost:3759`

Keep all 4 running!
