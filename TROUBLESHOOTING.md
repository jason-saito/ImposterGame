# Troubleshooting Guide

## URL Joining Not Working

### Issue: Visiting `https://sosussy.onrender.com/lobby/67` doesn't show join form

**Symptoms:**
- URL doesn't work
- "Room not found" error appears

**Root Cause:**
The backend stores rooms **in memory** (`Map` object). When Render spins down the server due to inactivity (free tier), all rooms are lost.

**Solution:**

#### Option 1: Keep Backend Warm (Quick Fix)
Set up a service to ping your backend every 10 minutes:
- Use cron-job.org or UptimeRobot
- Ping: `https://your-backend-url.onrender.com/health`
- This prevents Render from spinning down

#### Option 2: Add Database (Permanent Fix)
Use a persistent database instead of in-memory storage:
- PostgreSQL (Render provides free tier)
- Redis
- MongoDB

### Debugging Steps

1. **Check Browser Console** (Press F12):
   ```
   Look for: "Lobby URL check: { code: '67', gameCode: null, willShowJoinForm: true }"
   ```
   - If you see `code: undefined`, the URL parameter isn't being read
   - If you see `gameCode: '67'`, you're already in the room

2. **Check API URL**:
   ```
   Look for: "Attempting to join via URL: { code: '67', playerName: 'Name', API_URL: 'https://...' }"
   ```
   - Verify API_URL points to your actual backend
   - Check for CORS errors

3. **Test Backend Directly**:
   ```bash
   curl https://your-backend-url.onrender.com/health
   ```
   - Should return: "Imposter Game API is running"
   - If it fails, backend is down

## Common Issues

### 1. Room Not Found (Even Though It Exists)

**Cause:** Backend restarted and lost all in-memory rooms

**Solutions:**
- Refresh everyone out and create a new room
- Implement database storage (see Option 2 above)
- Keep backend warm (see Option 1 above)

### 2. CORS Errors

**Symptoms:** Console shows `Access-Control-Allow-Origin` errors

**Fix:**
1. Go to Render backend dashboard
2. Set environment variable:
   ```
   CORS_ORIGIN=https://sosussy.onrender.com
   ```
3. Redeploy backend

### 3. Socket.IO Connection Failed

**Symptoms:** Game doesn't update in real-time

**Fix:**
1. Go to Render frontend dashboard
2. Set environment variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```
3. Redeploy frontend

### 4. Join Form Not Showing

**Check:**
1. Is the URL correct? `https://sosussy.onrender.com/lobby/67`
2. Open browser console (F12) and look for: `"Lobby URL check"`
3. Verify the code is in the URL

**Common Causes:**
- URL is `https://sosussy.onrender.com/lobby` (missing code)
- Already joined the room (gameCode is set in localStorage)

## Environment Variables Checklist

### Backend (Render Dashboard)
```
CORS_ORIGIN=https://sosussy.onrender.com
PORT=3001
```

### Frontend (Render Dashboard)
```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

## Testing Checklist

1. ✅ Visit frontend URL directly
2. ✅ Create a new game
3. ✅ Copy lobby URL
4. ✅ Open in incognito/private window
5. ✅ Paste lobby URL
6. ✅ Should see join form with code displayed
7. ✅ Enter name and join
8. ✅ Both players should see each other

## Still Not Working?

1. **Clear localStorage:**
   - Open console (F12)
   - Type: `localStorage.clear()`
   - Refresh page

2. **Check Render Logs:**
   - Go to backend dashboard
   - Click "Logs"
   - Look for errors

3. **Verify Deployment:**
   - Backend shows "Live"
   - Frontend shows "Live"
   - Recent deploy was successful
