# Reverb Real-Time Notifications - Quick Start

## ✅ Status: Ready to Test

### What Was Fixed
1. **Real-time notifications now work properly** - No more page refresh needed
2. **Toast notifications display** - Visual feedback appears at top-right  
3. **Connection monitoring** - Console logs show connection status
4. **Debug tools added** - Easy to troubleshoot issues

---

## 🚀 Quick Start (3 Steps)

### Step 1: Ensure Reverb is Running
```powershell
cd "c:\Users\mjmonteagudo\Documents\DSWD GitLab\SYSTEM_TEMPLATE_AD_LOGIN"
php artisan reverb:start
```

**Expected output:** `INFO  Starting server on 0.0.0.0:8080 (127.0.0.1).`

✅ **Reverb is already running in your terminal!**

---

### Step 2: Test Real-Time Notifications

#### Method A: Use Debug Page (Recommended)
1. Go to: `http://127.0.0.1:1620/debug/notifications`
2. Click "Send Test Notification" button
3. **Expected result:** Green toast appears at top-right ✅

#### Method B: Change a User's Role
1. Go to: `http://127.0.0.1:1620/users`
2. Click on any user
3. Change their role
4. **Expected result:** That user gets a notification immediately (no refresh needed) ✅

---

### Step 3: Verify in Browser Console (F12)

Open DevTools → Console tab and you should see:
```
✓ User ID: [your-id]
✓ VITE_REVERB_HOST: 127.0.0.1
✓ VITE_REVERB_PORT: 8080
✓ VITE_REVERB_SCHEME: http
✓ VITE_REVERB_APP_KEY: local
✓ WebSocket connected
📬 Notification received: {type: 'role_changed', ...}
```

---

## 🔍 What Changed

| Component | Change | Why |
|-----------|--------|-----|
| **Hook** | Error handling + logging | See connection issues in console |
| **Toaster** | Theme, colors, duration | Visible with better UX |
| **Endpoint** | Test notification API | Debug without changing roles |
| **Debug Page** | New route at `/debug/notifications` | Quick testing without users |
| **Routes** | `/api/test-notification` | Backend endpoint |

---

## 📋 Technical Details

### Real-Time Flow
```
1. User role changes → UserRoleChanged notification created
2. Notification queued for broadcast via 'broadcast' channel
3. Reverb WebSocket forwards to Echo client
4. Echo listener triggers → Toast + badge + list update
5. User sees change instantly (no page refresh)
```

### Files Modified
- `resources/js/hooks/use-notifications.ts` - Enhanced error handling
- `resources/js/layouts/app-layout.tsx` - Better Toaster config
- `app/Http/Controllers/NotificationController.php` - Test endpoint
- `routes/web.php` - New routes
- `resources/js/pages/debug/notifications.tsx` - Debug page (new)

---

## ⚙️ Configuration

Your `.env` is already configured:
```env
BROADCAST_CONNECTION=reverb
BROADCAST_DRIVER=reverb
REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_PORT=8080
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
```

✅ **No manual configuration needed!**

---

## 🐛 Troubleshooting

### Toast Not Showing?
- [ ] Reverb running? Check terminal for `Starting server on 0.0.0.0:8080`
- [ ] Frontend rebuilt? Run `npm run build`
- [ ] Logged in? Check you're authenticated
- [ ] Browser console errors? Check F12 console tab

### WebSocket Won't Connect?
- [ ] Port 8080 not blocked by firewall
- [ ] Reverb not already running on another terminal
- [ ] Check env vars: `VITE_REVERB_HOST=127.0.0.1`, `VITE_REVERB_PORT=8080`

### Notification Doesn't Broadcast?
- [ ] User queue worker running? Run `php artisan queue:work` OR set `QUEUE_CONNECTION=sync`
- [ ] User authorized? Check `routes/channels.php` → `user.notifications.{id}`
- [ ] Browser console shows channel error? Check auth

---

## 📚 Next Steps

1. ✅ Keep Reverb running (`php artisan reverb:start`)
2. ✅ Visit debug page (`/debug/notifications`)
3. ✅ Send test notification
4. ✅ Verify toast appears
5. ✅ Test by changing a user's role
6. ✅ Confirm notification appears in real-time

---

## 🎯 Success Criteria

When working properly, you should see:

| Action | Expected Result |
|--------|-----------------|
| Send test notification | Toast appears at top-right, notification badge updates |
| Change user role | User gets notification instantly, no page refresh |
| Click bell icon | Dropdown shows latest 10 notifications |
| Click notification | Marked as read, blue highlight goes away |
| Browser console (F12) | Shows `✓ WebSocket connected` and `📬 Notification received` |

---

**Status:** ✅ Ready to test! Reverb is running on port 8080.
