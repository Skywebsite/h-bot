# Deployment Guide - Switch from Localhost to Production

## Current Setup (Local Development)
Both `ChatScreen.js` and `NotificationScreen.js` are configured to use:
```javascript
const API_URL = 'http://localhost:5000/api';
```

## When Ready to Deploy to Vercel

### Step 1: Update API URLs
In both files, change:
- `expo-app/src/screens/ChatScreen.js` (line 24)
- `expo-app/src/screens/NotificationScreen.js` (line 17)

From:
```javascript
const API_URL = 'http://localhost:5000/api'; // Local development
// const API_URL = 'https://d-bot-app-b.vercel.app/api'; // Production
```

To:
```javascript
// const API_URL = 'http://localhost:5000/api'; // Local development
const API_URL = 'https://d-bot-app-b.vercel.app/api'; // Production
```

### Step 2: Deploy Backend to Vercel
1. Make sure all server files are committed:
   ```bash
   git add server/routes/notifications.js
   git add server/models/Notification.js
   git add server/index.js
   ```

2. Commit and push:
   ```bash
   git commit -m "Add notification API routes"
   git push
   ```

3. Vercel will auto-deploy, or manually redeploy in Vercel dashboard

### Step 3: Verify Deployment
Test the API endpoints:
- `https://d-bot-app-b.vercel.app/api/notifications` (should return notifications)
- `https://d-bot-app-b.vercel.app/api/ai/chat` (should work as before)

### Step 4: Test in Expo App
1. Restart Expo app
2. Test notifications feature
3. Verify everything works with production API

## Quick Switch Script (Optional)
You can create a simple script to switch between local and production, but for now, just comment/uncomment the lines as shown above.

