# 📱 Build Expo APK Guide

## Prerequisites
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Expo account (sign up at expo.dev)
- [ ] Logged into EAS: `eas login`

## Production URLs Configured
- ✅ App Server: `https://d-bot-new-backedn-lxj9.vercel.app/api`
- ✅ Notification Server: `https://notification-backend-rho.vercel.app/api`

## Step 1: Login to EAS
```bash
cd expo-app
eas login
```

## Step 2: Configure Build
```bash
eas build:configure
```
This will create/update `eas.json` if needed.

## Step 3: Build Android APK
```bash
eas build --platform android --profile production
```

### Build Options:
- **Production APK**: `eas build --platform android --profile production`
- **Development Build**: `eas build --platform android --profile development`
- **Preview Build**: `eas build --platform android --profile preview`

## Step 4: Monitor Build
- The build will start on Expo servers
- You'll get a URL to monitor progress
- Build typically takes 10-20 minutes

## Step 5: Download APK
- Once build completes, download the APK from the Expo dashboard
- Or use: `eas build:list` to see your builds
- Download link will be provided in the build output

## Alternative: Local Build (Faster)
If you have Android Studio installed:

```bash
# Install dependencies
npm install

# Build locally
eas build --platform android --profile production --local
```

## Build Profiles (eas.json)
Your `eas.json` already has these profiles configured:
- **development**: For testing with development client
- **preview**: For internal testing (APK)
- **production**: For production release (APK/AAB)

## Troubleshooting

### Build Fails
1. Check `eas.json` configuration
2. Verify `app.json` has correct package name
3. Check environment variables if needed

### APK Too Large
- Enable ProGuard in `android/app/build.gradle`
- Remove unused dependencies
- Optimize images

### Signing Issues
- EAS handles signing automatically
- For manual signing, configure in `eas.json`

## Quick Commands
```bash
# List all builds
eas build:list

# View build details
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Download latest build
eas build:download
```

## Next Steps After Build
1. ✅ Test APK on physical device
2. ✅ Verify API connections work
3. ✅ Test push notifications
4. ✅ Test voice features (if using production build)
5. ✅ Upload to Google Play Store (if ready)

---

**Your app is configured with production URLs and ready to build! 🚀**

