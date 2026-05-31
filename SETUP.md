# Hostello Auth Setup — Google Login + Magic Link

## Step 1: Install new backend packages

```bash
cd server
npm install google-auth-library nodemailer
npm install --save-dev @types/nodemailer
```

## Step 2: Add environment variables on Render

Go to your Render dashboard → your backend service → **Environment** tab and add:

```
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
EMAIL_USER=your-gmail@gmail.com
EMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

Keep all your existing env vars (MONGO_URI, JWT_SECRET, etc.) — don't remove them.

## Step 3: Get Google Client ID (5 minutes)

1. Go to https://console.cloud.google.com
2. Select your project (or create one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-frontend.vercel.app`
7. Click **Create** → copy the **Client ID**
8. Paste it as `GOOGLE_CLIENT_ID` in Render AND as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel

## Step 4: Get Gmail App Password (3 minutes)

1. Go to https://myaccount.google.com/security
2. Make sure **2-Step Verification** is ON
3. Search for **App Passwords** in the search bar
4. App: **Mail** → Device: **Other** → type "Hostello" → click **Generate**
5. Copy the 16-character password
6. Paste as `EMAIL_APP_PASSWORD` in Render
7. Paste your Gmail address as `EMAIL_USER`

## Step 5: Add env vars to Vercel (frontend)

In Vercel dashboard → your project → **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
```

## Done! ✅

Your app now uses:
- **Google One-Tap** → users click "Continue with Google", done instantly
- **Magic Link** → users enter email, click link in email, done
- **No SMS costs ever**

## What changed in the code

| File | Change |
|---|---|
| `server/src/config/env.ts` | Added GOOGLE_CLIENT_ID, EMAIL_USER, EMAIL_APP_PASSWORD |
| `server/src/models/User.ts` | Added email, googleId, magicLinkToken fields (mobile now optional) |
| `server/src/controllers/authController.ts` | Replaced OTP logic with Google + Magic Link |
| `server/src/routes/auth.ts` | New routes: POST /google, POST /magic-link/send, GET /magic-link/verify |
| `server/src/utils/email.ts` | NEW — sends magic link emails via Gmail |
| `server/src/utils/otp.ts` | No longer used (kept in place, just not imported) |
| `src/components/LoginScreen.tsx` | New UI: Google button + email field |
| `src/providers/AuthProvider.tsx` | Added email/avatar fields to AuthUser |
| `src/app/auth/verify/page.tsx` | NEW — handles magic link clicks from email |
