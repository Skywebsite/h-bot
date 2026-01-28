# D-Bot Expo App - Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android development) or Xcode (for iOS development)

## Installation Steps

1. **Navigate to the expo-app directory:**
   ```bash
   cd expo-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Update API URL:**
   - Open `src/screens/ChatScreen.js`
   - Find the line: `const API_URL = 'http://localhost:3000';`
   - Replace with your actual backend API URL
   - For Android emulator, use `http://10.0.2.2:3000` instead of `localhost`
   - For physical device, use your computer's IP address (e.g., `http://192.168.1.100:3000`)

4. **Configure Firebase (if needed):**
   - The Firebase configuration is already set up in `firebase.js`
   - For production, consider using environment variables
   - For Google Sign-In on native, you'll need to set up `expo-auth-session` or `@react-native-google-signin/google-signin`

5. **Create placeholder assets (optional):**
   ```bash
   mkdir assets
   # Add your icon.png, splash.png, adaptive-icon.png, and favicon.png files
   ```

6. **Start the development server:**
   ```bash
   npm start
   ```
   (This automatically uses `npx expo start`, so you don't need Expo CLI installed globally)

7. **Run on device:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your physical device

## Important Notes

- **API URL**: Make sure your backend server is running and accessible
- **Google Sign-In**: Currently shows an alert. To enable, you need to:
  1. Install `expo-auth-session` or `@react-native-google-signin/google-signin`
  2. Configure OAuth credentials in Firebase Console
  3. Update the `handleGoogleAuth` function in `AuthScreen.js`

- **Firebase**: The app uses Firebase JS SDK which works with Expo. For production, consider using React Native Firebase for better performance.

## Troubleshooting

- **Metro bundler issues**: Clear cache with `expo start -c`
- **Firebase errors**: Make sure your Firebase project is properly configured
- **Network errors**: Check that your API URL is correct and server is running
- **Android build issues**: Make sure Android Studio and SDK are properly installed

## Project Structure

```
expo-app/
├── App.js                    # Main app with navigation
├── firebase.js               # Firebase configuration
├── package.json              # Dependencies
├── app.json                  # Expo configuration
├── babel.config.js           # Babel configuration
├── src/
│   ├── screens/
│   │   ├── AuthScreen.js     # Authentication screen
│   │   └── ChatScreen.js     # Chat interface
│   └── components/
│       └── RecentSearches.js  # Recent searches component
└── README.md                 # Project documentation
```

