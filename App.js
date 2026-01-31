import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthScreen from './src/screens/AuthScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import AllSuggestionsScreen from './src/screens/AllSuggestionsScreen';

// Configure notification handler to show popup alerts for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Always show alert/popup for notifications received while app is in foreground
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const navigationRef = useNavigationContainerRef();

  // Load cached user and welcome screen status immediately on app start (before Firebase check)
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('user');
        const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
        
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
        }
        
        if (welcomeSeen === 'true') {
          setHasSeenWelcome(true);
        }
        
        // Set loading to false immediately so user sees cached state
        setLoading(false);
      } catch (error) {
        console.error('Error loading cached data:', error);
        setLoading(false);
      }
    };

    loadCachedData();
  }, []);

  // Setup notifications
  useEffect(() => {
    // Suppress Expo Go warning for push notifications (SDK 53+ limitation)
    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (args[0]?.includes?.('expo-notifications') && args[0]?.includes?.('Expo Go')) {
        // Suppress the Expo Go push notification warning
        return;
      }
      originalWarn.apply(console, args);
    };

    registerForPushNotificationsAsync().then(() => {
      scheduleRecurringNotifications();
    });

    // Refresh notifications every hour to get new messages from API
    const refreshInterval = setInterval(() => {
      scheduleRecurringNotifications();
    }, 60 * 60 * 1000); // Every hour

    // Also refresh when app comes to foreground
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        scheduleRecurringNotifications();
      }
    });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Manually show alert popup for foreground notifications
      // This ensures the notification is displayed even if the handler doesn't work
      const title = notification.request.content.title || 'Notification';
      const body = notification.request.content.body || '';
      
      Alert.alert(
        title,
        body,
        [
          {
            text: 'View',
            onPress: () => {
              // Navigate to NotificationScreen when user taps "View"
              if (navigationRef.isReady() && user) {
                navigationRef.navigate('Notifications');
              }
            }
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      // Navigate to NotificationScreen when notification is tapped
      // Use setTimeout to ensure navigation is ready and user state is set
      setTimeout(() => {
        if (navigationRef.isReady()) {
          // Check if user is logged in by checking current user state
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              navigationRef.navigate('Notifications');
            } catch (error) {
              console.log('Navigation error:', error);
            }
          }
        }
      }, 500);
    });

    return () => {
      // Cleanup notification listeners
      if (notificationListener.current) {
        // Use remove() method if available, otherwise use removeNotificationSubscription
        if (typeof notificationListener.current.remove === 'function') {
          notificationListener.current.remove();
        } else if (Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
      }
      if (responseListener.current) {
        // Use remove() method if available, otherwise use removeNotificationSubscription
        if (typeof responseListener.current.remove === 'function') {
          responseListener.current.remove();
        } else if (Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      }
      // Cleanup refresh interval and app state listener
      clearInterval(refreshInterval);
      appStateSubscription?.remove();
    };
  }, []);

  // Handle app opened from notification when user is logged in
  useEffect(() => {
    if (user && navigationRef.isReady()) {
      // Check if app was opened from a notification
      Notifications.getLastNotificationResponseAsync().then(response => {
        if (response) {
          // Navigate to NotificationScreen if app was opened from notification
          setTimeout(() => {
            if (navigationRef.isReady()) {
              try {
                navigationRef.navigate('Notifications');
              } catch (error) {
                console.log('Navigation error on app open:', error);
              }
            }
          }, 1000); // Small delay to ensure navigation is ready
        }
      });
    }
  }, [user]);

  // Firebase auth state listener (verifies cached user is still valid)
  useEffect(() => {
    let unsubscribe = null;
    
    // Delay auth state listener to ensure Firebase is fully initialized
    const timer = setTimeout(() => {
      try {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL
            };
            setUser(userData);
            // Update cache with latest user data
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            // Check welcome screen status
            const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
            setHasSeenWelcome(welcomeSeen === 'true');
          } else {
            // User logged out - clear cache
            setUser(null);
            await AsyncStorage.removeItem('user');
            setHasSeenWelcome(false);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error('Firebase Auth error:', error);
        setLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleAuthSuccess = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    // Check if user has seen welcome screen
    const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
    if (welcomeSeen !== 'true') {
      setHasSeenWelcome(false);
    } else {
      setHasSeenWelcome(true);
    }
  };

  const handleWelcomeComplete = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    setHasSeenWelcome(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : !hasSeenWelcome ? (
          <Stack.Screen name="Welcome">
            {(props) => <WelcomeScreen {...props} onWelcomeComplete={handleWelcomeComplete} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Chat">
              {(props) => <ChatScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {(props) => <NotificationScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen 
              name="AllSuggestions" 
              options={{ 
                presentation: 'card',
                animation: 'slide_from_bottom'
              }}
            >
              {(props) => <AllSuggestionsScreen {...props} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Register for push notifications
async function registerForPushNotificationsAsync() {
  // Skip push notifications on web platform
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web platform');
    return null;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'a2d3d451-e71d-4fe8-b65f-1e2cbc4cc851', // From app.json
    });
    token = tokenData.data;
    console.log('Expo Push Token:', token);
    
    // Register token with backend
    if (token) {
      // Skip push notification registration in Expo Go (not supported in SDK 53+)
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) {
        console.log('Skipping push token registration - Expo Go does not support push notifications in SDK 53+. Use a development build instead.');
        return token;
      }

      let apiUrl = ''; // Declare outside try block for error handling
      try {
        const user = await AsyncStorage.getItem('user');
        const userData = user ? JSON.parse(user) : null;
        const userId = userData?.uid || userData?.email || 'anonymous';
        
        // Use same API URL configuration as ChatScreen
        // For physical device testing, use your computer's IP
        const USE_PHYSICAL_DEVICE = true; // Set to true if testing on real phone
        const YOUR_COMPUTER_IP = '10.156.236.116'; // Your computer's IP address
        
        const baseUrl = USE_PHYSICAL_DEVICE
          ? `http://${YOUR_COMPUTER_IP}:5000/api`  // Physical device - MUST use your computer's IP
          : Platform.OS === 'android' 
          ? 'http://10.0.2.2:5000/api'  // Android emulator
          : Platform.OS === 'web'
          ? 'http://localhost:5000/api'  // Web
          : 'http://localhost:5000/api'; // iOS simulator
        
        apiUrl = `${baseUrl}/push/register`;
        console.log('Registering device token at:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            token,
            platform: Platform.OS
          })
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Device token registered with backend');
      } catch (error) {
        console.error('Failed to register device token:', error);
        if (apiUrl) {
          console.error('API URL was:', apiUrl);
        }
        // Don't throw - allow app to continue even if registration fails
      }
    }
  } catch (error) {
    console.error('Error getting Expo push token:', error);
  }

  return token;
}

// Schedule notifications from API every 30 minutes
async function scheduleRecurringNotifications() {
  // Skip on web platform - notifications not supported
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Fetch notifications from API
    // Use localhost for testing
    // For Android emulator use: http://10.0.2.2:5000/api
    // For iOS simulator use: http://localhost:5000/api
    // For physical device use: http://[your-computer-ip]:5000/api
    const API_URL = Platform.OS === 'android' 
      ? 'http://10.0.2.2:5000/api'  // Android emulator
      : 'http://localhost:5000/api'; // iOS simulator and others
    let notificationMessages = [];
    
    try {
      const response = await fetch(`${API_URL}/notifications`);
      if (response.ok) {
        const notifications = await response.json();
        // Extract messages from notifications (use message field, or title + message)
        notificationMessages = notifications.map(notif => {
          // Use message if available, otherwise use title, or combine both
          if (notif.message) {
            return notif.message;
          } else if (notif.title) {
            return notif.title;
          } else {
            return `${notif.title || 'Notification'}: ${notif.message || ''}`;
          }
        }).filter(msg => msg && msg.trim().length > 0); // Remove empty messages
      }
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
      // Fallback to default messages if API fails
      notificationMessages = [
        "Have any plans today?",
        "Discover exciting events near you!",
        "Check out what's happening around you!",
        "Don't miss out on today's events!",
        "Explore new events and activities!"
      ];
    }

    // If no notifications found, use default messages
    if (notificationMessages.length === 0) {
      notificationMessages = [
        "Have any plans today?",
        "Discover exciting events near you!",
        "Check out what's happening around you!",
        "Don't miss out on today's events!",
        "Explore new events and activities!"
      ];
    }

    const intervalMinutes = 30; // Send every 30 minutes
    const numberOfNotifications = 48; // Schedule 48 notifications (24 hours worth: 48 * 30 = 1440 minutes)

    // Schedule notifications every 30 minutes
    for (let i = 0; i < numberOfNotifications; i++) {
      const delayMinutes = i * intervalMinutes;
      
      // Calculate the trigger time
      const triggerDate = new Date();
      triggerDate.setMinutes(triggerDate.getMinutes() + delayMinutes);

      // Cycle through notification messages
      const messageIndex = i % notificationMessages.length;
      const message = notificationMessages[messageIndex];

      await Notifications.scheduleNotificationAsync({
        identifier: `notification-${i}`,
        content: {
          title: "H-BOT",
          body: message,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: triggerDate,
        },
      });
    }

    console.log(`Scheduled ${numberOfNotifications} notifications from API, each ${intervalMinutes} minutes apart`);
    console.log(`Using ${notificationMessages.length} notification messages from API`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

