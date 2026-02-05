# Troubleshooting Admin Login Issues

## ✅ Verified Working
- Admin user exists in database
- Password hash is correct
- Password verification works

## 🔍 Debugging Steps

### 1. Check Backend is Running
Make sure your backend server is running:
```bash
cd ims-backend
npm start
```
Should see: `Server running on port 5000`

### 2. Check Frontend API URL
Verify the frontend is pointing to the correct backend:
- Check `ims-frontend/.env` or `ims-frontend/src/config/api.ts`
- Should be: `http://localhost:5000/api`

### 3. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for any errors
- **Network tab**: Check if the login request is being sent
  - Should be POST to `http://localhost:5000/api/login`
  - Check the request payload
  - Check the response

### 4. Check Backend Logs
When you try to login, you should see in the backend console:
```
Login attempt: { username: 'admin', userType: 'admin', hasPassword: true }
Admin lookup: Found admin ID 1
Verifying password...
Password verification result: true
Login successful for: admin
```

### 5. Common Issues

#### Issue: "Cannot connect to server"
**Solution**: Backend is not running or wrong port
- Start backend: `cd ims-backend && npm start`
- Check backend is on port 5000

#### Issue: "Invalid credentials" but admin exists
**Possible causes**:
- Wrong username (should be exactly "admin")
- Wrong password (should be exactly "admin123")
- User type not selected correctly (must select "Admin" radio button)

#### Issue: CORS error
**Solution**: CORS is already enabled in backend, but check:
- Backend `server.js` has `app.use(cors())`
- Frontend URL matches backend CORS settings

#### Issue: Network error
**Solution**: 
- Check if backend is accessible: Open `http://localhost:5000/api/login` in browser (should show method not allowed, not connection refused)
- Check firewall/antivirus blocking localhost connections

### 6. Test Login with curl/Postman

Test the API directly:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123","userType":"admin"}'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@nfsu.ac.in",
    "fullName": "System Administrator",
    "role": "Admin"
  }
}
```

### 7. Reset Admin Password

If needed, delete and recreate admin:
```bash
# Connect to your database and delete the admin
# Or modify scripts/seedAdmin.js to force recreate
```

Then run:
```bash
node scripts/seedAdmin.js
```

## 📋 Login Credentials

- **Username:** `admin`
- **Password:** `admin123`
- **User Type:** Select "Admin" radio button

## 🔧 Quick Fixes

1. **Clear browser cache and localStorage:**
   - Open DevTools (F12)
   - Application tab → Local Storage → Clear all
   - Refresh page

2. **Check request format:**
   - Open Network tab in DevTools
   - Try login
   - Check the login request payload:
     ```json
     {
       "username": "admin",
       "password": "admin123",
       "userType": "admin"
     }
     ```

3. **Verify backend response:**
   - Check Network tab response
   - Should be 200 OK with token
   - If 401, check backend logs for details

## 📞 Still Not Working?

Check the backend console logs when you try to login. The enhanced logging will show:
- What username/userType is being received
- Whether admin is found
- Password verification result
- Any errors

Share the backend console output for further debugging.
