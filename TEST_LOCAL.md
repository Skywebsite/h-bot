# Testing Notifications Locally

## Quick Setup

1. **Start your local server:**
   ```bash
   cd server
   npm start
   ```
   Make sure it's running on port 5000

2. **Update NotificationScreen.js for local testing:**
   - Open `expo-app/src/screens/NotificationScreen.js`
   - Change line 16 from:
     ```javascript
     const API_URL = 'https://d-bot-app-b.vercel.app/api';
     ```
   - To (for web/simulator):
     ```javascript
     const API_URL = 'http://localhost:5000/api';
     ```
   - Or for Android emulator:
     ```javascript
     const API_URL = 'http://10.0.2.2:5000/api';
     ```
   - Or for physical device (replace with your computer's IP):
     ```javascript
     const API_URL = 'http://192.168.1.XXX:5000/api';
     ```

3. **Restart Expo app:**
   - Stop and restart `npm start` in expo-app
   - The notifications should now work!

## Option 2: Deploy to Vercel

To use the deployed server, you need to:
1. Commit all changes (including notification routes)
2. Push to your repository
3. Vercel will auto-deploy, or manually redeploy

Then the API will be available at: `https://d-bot-app-b.vercel.app/api/notifications`

