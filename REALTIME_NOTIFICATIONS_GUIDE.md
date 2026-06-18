# Real-Time Notifications with Reverb - Setup Guide

## Changes Made

### 1. **Enhanced `use-notifications` Hook** (`resources/js/hooks/use-notifications.ts`)
   - ✅ Added proper error handling and logging
   - ✅ Made `userId` parameter optional and added guard check
   - ✅ Added connection status tracking (`isConnected`)
   - ✅ Added `.on('connect')`, `.on('disconnect')`, `.on('error')` event handlers
   - ✅ Better error messages and debugging logs
   - ✅ Improved toast notifications with better descriptions
   - ✅ Added channel error handling for authorization failures

### 2. **Improved Toaster Configuration** (`resources/js/layouts/app-layout.tsx`)
   - ✅ Added `theme="system"` for dark/light mode support
   - ✅ Added `richColors` for better visual distinction
   - ✅ Added `expand` to show full message content
   - ✅ Set `duration={5000}` for 5-second display

### 3. **Test Notification Endpoint** (`app/Http/Controllers/NotificationController.php`)
   - ✅ Added `sendTestNotification()` method
   - ✅ Sends test role change notification for debugging

### 4. **Routes** (`routes/web.php`)
   - ✅ Added `/api/test-notification` endpoint
   - ✅ Added `/debug/notifications` debug page

### 5. **Debug Page** (`resources/js/pages/debug/notifications.tsx`)
   - ✅ Displays current configuration
   - ✅ Shows Reverb environment variables
   - ✅ Button to send test notification
   - ✅ Connection status indicators

---

## Prerequisites

### Reverb Server Must Be Running

**Option A: Start Reverb in a terminal**
```bash
cd "c:\Users\mjmonteagudo\Documents\DSWD GitLab\SYSTEM_TEMPLATE_AD_LOGIN"
php artisan reverb:start
```

Expected output:
```
INFO  Starting server on 0.0.0.0:8080 (127.0.0.1).
```

**✅ Currently running on port 8080**

### Environment Configuration

Verify `.env` has these settings:
```env
BROADCAST_CONNECTION=reverb
BROADCAST_DRIVER=reverb

REVERB_APP_ID=local
REVERB_APP_KEY=local
REVERB_APP_SECRET=local
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http

VITE_REVERB_APP_KEY=local
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

✅ **All configured correctly in your `.env`**

---

## Testing Real-Time Notifications

### Step 1: Build Frontend
```bash
npm run build
# or for development with hot reload
npm run dev
```

### Step 2: Access Debug Page
1. Navigate to: `http://127.0.0.1:1620/debug/notifications`
2. You should see:
   - ✓ User ID
   - ✓ Reverb configuration
   - "Send Test Notification" button

### Step 3: Test Real-Time Notification
1. Click "Send Test Notification" button
2. **Expected Result:**
   - ✅ Green toast notification appears at top-right
   - ✅ Notification badge updates in top-right bell icon
   - ✅ Notification appears in dropdown when you click the bell

### Step 4: Check Browser Logs
Open DevTools (F12) → Console tab and verify:
```
✓ User ID: [your-user-id]
✓ VITE_REVERB_HOST: 127.0.0.1
✓ VITE_REVERB_PORT: 8080
✓ VITE_REVERB_SCHEME: http
✓ VITE_REVERB_APP_KEY: local
--- Echo Connection Test ---
✓ WebSocket connected
✓ private: user.notifications.{id}
📬 Notification received: {...}
```

---

## Troubleshooting

### Issue 1: Toast Not Showing
**Solution:**
- Verify Reverb server is running: `php artisan reverb:start`
- Check browser console (F12) for connection errors
- Clear browser cache: Ctrl+Shift+Del
- Rebuild frontend: `npm run build`

### Issue 2: WebSocket Connection Fails
**Symptoms:** Console shows `✗ WebSocket error`

**Solution:**
- Ensure Reverb is running on port 8080
- Check `VITE_REVERB_PORT=8080` in `.env`
- Firewall: Allow port 8080
- Try: `php artisan reverb:restart`

### Issue 3: Channel Authorization Fails
**Symptoms:** Console shows `✗ Channel authorization error`

**Solution:**
- Verify user is authenticated (logged in)
- Check `routes/channels.php` authorization logic
- Ensure `userId` is being passed to NotificationCenter component

### Issue 4: Notification Doesn't Appear Immediately
**Solution:**
- **Database queue:** If using `QUEUE_CONNECTION=database`, jobs may be delayed
- Run queue worker: `php artisan queue:work`
- Or switch to `QUEUE_CONNECTION=sync` for immediate processing in `.env`

---

## How It Works

### Frontend Flow (Real-Time)
```
1. Page loads → useNotifications hook initializes
2. Echo connects to Reverb WebSocket on ws://127.0.0.1:8080
3. Echo subscribes to private channel: user.notifications.{userId}
4. Notification broadcast sent from server
5. Echo listener receives notification
6. Toast appears + badge updates + notification list updates
```

### Backend Flow (Broadcast)
```
1. Admin changes user role
2. UserRoleChanged notification is sent
3. Notification stored in database (via 'database' channel)
4. Notification broadcast to user (via 'broadcast' channel)
5. Broadcast sent to Reverb WebSocket
6. Client receives via Echo listener
```

---

## Commands Reference

```bash
# Start Reverb server
php artisan reverb:start

# Restart Reverb
php artisan reverb:restart

# View active connections (in real-time)
php artisan reverb:status

# Process queued notifications (if using database queue)
php artisan queue:work

# Send test notification manually
php artisan tinker
>>> $user = User::first();
>>> $user->notify(new UserRoleChanged($user, $user, 'Admin', 'Editor'));

# View running processes
Get-Process php
```

---

## What's New

| Feature | Before | After |
|---------|--------|-------|
| **Toasts** | Basic, minimal | Rich colors, system theme, 5 sec duration |
| **Connection Status** | Silent failures | Logged to console with `✓` and `✗` indicators |
| **Error Handling** | None | Try-catch with user-friendly messages |
| **Debugging** | No visibility | Debug page with env vars and test button |
| **Channel Errors** | Silent | Now shows error messages |
| **userId Handling** | Required | Optional with safe guard checks |

---

## Next Steps

1. ✅ Start Reverb: `php artisan reverb:start`
2. ✅ Build frontend: `npm run build`
3. ✅ Test via debug page: `/debug/notifications`
4. ✅ Monitor browser console (F12)
5. ✅ Verify toasts appear
6. ✅ Update user role to trigger real notification
7. ✅ Confirm toast appears immediately (no page refresh needed)

---

## File Changes Summary

```
Modified:
  - resources/js/hooks/use-notifications.ts
  - resources/js/layouts/app-layout.tsx
  - app/Http/Controllers/NotificationController.php
  - routes/web.php

Created:
  - resources/js/pages/debug/notifications.tsx
```

---

**Status:** ✅ Real-time notifications are now fully configured with debug tools!
