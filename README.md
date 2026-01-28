# D-Bot Expo App

A React Native Expo application that replicates the D-Bot web frontend functionality.

## Features

- 🔐 Firebase Authentication (Email/Password & Google Sign-In)
- 💬 AI Chat Interface with event information
- 🔍 Recent Searches functionality
- 🎨 Modern, clean UI design
- 📱 Cross-platform (iOS & Android)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd expo-app
   npm install
   ```

2. **Configure Firebase:**
   - For Android: Place your `google-services.json` file in the `expo-app` directory
   - Update the Firebase configuration in `firebase.js` if needed
   - For Google Sign-In, update the `webClientId` in `AuthScreen.js` with your Firebase Web Client ID

3. **Update API URL:**
   - Open `src/screens/ChatScreen.js`
   - Update the `API_URL` constant with your backend API URL

4. **Run the app:**
   ```bash
   npm start
   ```
   This will use `npx expo start` automatically. Then:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app on your physical device

## Project Structure

```
expo-app/
├── App.js                 # Main app component with navigation
├── firebase.js            # Firebase configuration
├── src/
│   ├── screens/
│   │   ├── AuthScreen.js  # Authentication screen
│   │   └── ChatScreen.js  # Chat interface screen
│   └── components/
│       └── RecentSearches.js  # Recent searches component
├── package.json
├── app.json
└── babel.config.js
```

## Dependencies

- `expo` - Expo framework
- `@react-native-firebase/app` & `@react-native-firebase/auth` - Firebase integration
- `axios` - HTTP client for API calls
- `react-native-markdown-display` - Markdown rendering for chat messages
- `react-native-reanimated` - Animations
- `expo-linear-gradient` - Gradient backgrounds
- `@react-navigation/native` - Navigation

## Notes

- Make sure your backend API is running and accessible
- For Google Sign-In to work, you need to configure Google Sign-In in your Firebase project
- The app uses AsyncStorage for local data persistence

# h-bot
