# Quick Start Guide

## Installation & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update API URL** (if needed):
   - Open `src/screens/ChatScreen.js`
   - Update `const API_URL = 'http://localhost:3000';` with your backend URL
   - For Android emulator: `http://10.0.2.2:3000`
   - For physical device: Use your computer's IP (e.g., `http://192.168.1.100:3000`)

3. **Start the app:**
   ```bash
   npm start
   ```

4. **Choose your platform:**
   - Press `a` - Android emulator
   - Press `i` - iOS simulator  
   - Scan QR code - Physical device (Expo Go app)

## Troubleshooting

- **"expo is not recognized"**: The package.json now uses `npx expo start`, so this is handled automatically
- **Network errors**: Make sure your backend API is running and the URL is correct
- **Metro bundler cache issues**: Run `npm start -- --clear` to clear cache

## Notes

- No need to install Expo CLI globally - `npx` handles it
- Make sure your backend server is running before testing the chat
- Firebase authentication is already configured

