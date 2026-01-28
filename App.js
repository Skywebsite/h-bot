import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthScreen from './src/screens/AuthScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationScreen from './src/screens/NotificationScreen';

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
  const notificationListener = useRef();
  const responseListener = useRef();

  // Load cached user immediately on app start (before Firebase check)
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('user');
        if (cachedUser) {
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          // Set loading to false immediately so user sees cached state
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading cached user:', error);
      }
    };

    loadCachedUser();
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
            text: 'OK',
            onPress: () => {
              // Optionally navigate to notification screen or handle action
              if (notification.request.content.data?.notificationId) {
                // Could navigate to notification details if needed
              }
            }
          }
        ],
        { cancelable: true }
      );
    });

    // Listen for user tapping on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
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
    };
  }, []);

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
          } else {
            // User logged out - clear cache
            setUser(null);
            await AsyncStorage.removeItem('user');
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

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    AsyncStorage.setItem('user', JSON.stringify(userData));
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
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Chat">
              {(props) => <ChatScreen {...props} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Notifications">
              {(props) => <NotificationScreen {...props} user={user} />}
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
      try {
        const user = await AsyncStorage.getItem('user');
        const userData = user ? JSON.parse(user) : null;
        const userId = userData?.uid || userData?.email || 'anonymous';
        
        // Use appropriate URL based on platform
        const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
        const apiUrl = Platform.OS === 'android' && isDev 
          ? 'http://10.156.236.116:5000/api/push/register' // Physical Android device (change to 10.0.2.2 for emulator)
          : isDev
          ? 'http://localhost:5000/api/push/register' // Local development
          : 'https://d-bot-new-backedn-lxj9.vercel.app/api/push/register'; // Production App Server
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
        console.error('API URL was:', apiUrl);
      }
    }
  } catch (error) {
    console.error('Error getting Expo push token:', error);
  }

  return token;
}

// Schedule recurring notifications every 30 minutes
async function scheduleRecurringNotifications() {
  // Skip on web platform - notifications not supported
  if (Platform.OS === 'web') {
    return;
  }

  try {
    // Cancel any existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule notification every 30 minutes
    const trigger = {
      type: 'timeInterval',
      seconds: 30 * 60, // 30 minutes in seconds
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "H-BOT",
        body: "Have any plans today?",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger,
    });

    console.log('Recurring notifications scheduled every 30 minutes');
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

