# SMTP Email Configuration Guide

## ✅ .env File Created

The `.env` file has been created with SMTP configuration. The `FRONTEND_URL` is set to `http://localhost:3000` for development.

## 📧 Setting Up SMTP

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "IMS Backend" as the name
   - Copy the 16-character password

3. **Update .env file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=noreply@nfsu.ac.in
   ```

### Option 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=noreply@nfsu.ac.in
```

### Option 3: Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
SMTP_FROM=noreply@yourdomain.com
```

## 🔗 Frontend URL Configuration

The `FRONTEND_URL` is currently set to:
```env
FRONTEND_URL=http://localhost:3000
```

**Change this if:**
- Your frontend runs on a different port (e.g., `http://localhost:5173` for Vite)
- You're using a different frontend URL
- You're in production (e.g., `https://portal.nfsu.ac.in`)

## 📝 Email Links

All email links will use the `FRONTEND_URL`:
- Enrollment link: `http://localhost:3000/enroll/{id}`
- Login link: `http://localhost:3000/login`

## 🧪 Testing Email

1. Update `.env` with your SMTP credentials
2. Start the server: `npm start`
3. Submit a test application
4. Approve it as admin
5. Check the applicant's email for the enrollment link

## ⚠️ Important Notes

- **Never commit `.env` to git** (it's already in `.gitignore`)
- Use `.env.example` as a template for team members
- For production, use a secure SMTP service
- Gmail App Passwords expire if you regenerate them

## 🔒 Security

- Keep your SMTP credentials secure
- Use App Passwords instead of your main password
- Consider using environment-specific `.env` files (`.env.development`, `.env.production`)
