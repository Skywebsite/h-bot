import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Animated,
  StatusBar,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import Constants from 'expo-constants';
// Using fetch API instead of axios for React Native compatibility
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

// LOCAL DEVELOPMENT - Use localhost for testing
// IMPORTANT: For physical devices, you MUST use your computer's IP address instead of localhost
// To find your IP: 
//   Windows: Open CMD and type "ipconfig" (look for IPv4 Address, usually 192.168.x.x)
//   Mac/Linux: Open Terminal and type "ifconfig" or "ip addr" (look for inet)
//   Example: If your IP is 192.168.1.100, use: http://192.168.1.100:5000/api
//
// For Android emulator: http://10.0.2.2:5000/api
// For iOS simulator: http://localhost:5000/api  
// For physical device: http://[YOUR_COMPUTER_IP]:5000/api (CHANGE THIS!)
// For web: http://localhost:5000/api
//
// CHANGE THIS if testing on physical device:
const USE_PHYSICAL_DEVICE = true; // Set to true if testing on real phone
const YOUR_COMPUTER_IP = '10.156.236.116'; // Your computer's IP address

const API_URL = USE_PHYSICAL_DEVICE
  ? `http://${YOUR_COMPUTER_IP}:5000/api`  // Physical device - MUST use your computer's IP
  : Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : Platform.OS === 'web'
  ? 'http://localhost:5000/api'  // Web
  : 'http://localhost:5000/api'; // iOS simulator

const ChatScreen = ({ user, navigation }) => {
  // Log API URL on component mount for debugging
  useEffect(() => {
    console.log('=== API CONFIGURATION ===');
    console.log('API_URL:', API_URL);
    console.log('Platform:', Platform.OS);
    console.log('USE_PHYSICAL_DEVICE:', USE_PHYSICAL_DEVICE);
    if (USE_PHYSICAL_DEVICE) {
      console.log('YOUR_COMPUTER_IP:', YOUR_COMPUTER_IP);
      console.warn('⚠️ Testing on physical device - make sure IP is correct!');
    }
    
    // Test API connection on mount (optional - can be removed)
    const testConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const testResponse = await fetch(`${API_URL.replace('/api', '')}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('✅ Backend health check:', testResponse.ok ? 'OK' : 'Failed');
      } catch (error) {
        console.warn('⚠️ Backend health check failed:', error.message);
        console.warn('Make sure backend is running and accessible!');
      }
    };
    
    // Only test if not web (web might have CORS issues)
    if (Platform.OS !== 'web') {
      testConnection();
    }
  }, []);

  const greetingMessage = user?.displayName 
    ? `Hey ${user.displayName}! 👋 I'm H-Bot 🤖 ✨ Events, timings, venue info—sab milega idhar! Just type, chill karo 😎`
    : "Hey admin! 👋 I'm H-Bot 🤖 ✨ Events, timings, venue info—sab milega idhar! Just type, chill karo 😎";
  const [messages, setMessages] = useState([
    { role: 'ai', content: '', isTyping: true },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingTyped, setGreetingTyped] = useState(false);
  const [searches, setSearches] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [localProfilePic, setLocalProfilePic] = useState(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const scrollViewRef = useRef(null);

  // All suggestions data
  const allSuggestions = [
    {
      id: 1,
      title: 'Find Events Today',
      description: 'Discover all the exciting events happening today in your area',
      query: 'What events are happening today?',
      color: 'yellow',
      icon: 'calendar',
    },
    {
      id: 2,
      title: 'Upcoming Events',
      description: 'Browse through all the upcoming events scheduled for this week',
      query: 'Show me upcoming events this week',
      color: 'purple',
      icon: 'time',
    },
    {
      id: 3,
      title: 'Popular Events',
      description: 'Check out the most popular and trending events right now',
      query: 'Show me popular events',
      color: 'orange',
      icon: 'flame',
    },
    {
      id: 4,
      title: 'Events by Location',
      description: 'Find events happening at specific venues or locations',
      query: 'Show me event venues and locations',
      color: 'green',
      icon: 'location',
    },
    {
      id: 5,
      title: 'Free Events',
      description: 'Discover free events and activities you can attend',
      query: 'Show me free events',
      color: 'blue',
      icon: 'gift',
    },
    {
      id: 6,
      title: 'Event Categories',
      description: 'Explore events by category like music, sports, arts, and more',
      query: 'Find events by category',
      color: 'pink',
      icon: 'grid',
    },
    {
      id: 7,
      title: 'Event Timings',
      description: 'Get information about event schedules and timings',
      query: 'What are the event timings?',
      color: 'teal',
      icon: 'alarm',
    },
    {
      id: 8,
      title: 'Weekend Events',
      description: 'Find exciting events happening this weekend',
      query: 'Show me weekend events',
      color: 'red',
      icon: 'sunny',
    },
  ];

  // Theme definitions
  const themes = {
    dark: {
      name: 'Dark',
      background: ['#000000', '#1a1a1a', '#0a0a0a'],
      userMessageBg: '#3a3a3a',
      aiMessageBg: '#f5f5dc',
      userMessageText: '#ffffff',
      aiMessageText: '#333333',
      tabActive: '#667eea',
      tabInactive: '#ffffff',
      inputBg: '#1a1a1a',
      sendButton: '#667eea',
    },
    blue: {
      name: 'Blue',
      background: ['#0a1929', '#1a2f4a', '#0d1b2a'],
      userMessageBg: '#1e3a5f',
      aiMessageBg: '#e3f2fd',
      userMessageText: '#ffffff',
      aiMessageText: '#1565c0',
      tabActive: '#2196f3',
      tabInactive: '#ffffff',
      inputBg: '#1a2f4a',
      sendButton: '#2196f3',
    },
    purple: {
      name: 'Purple',
      background: ['#1a0d2e', '#2d1b4e', '#0f0a1a'],
      userMessageBg: '#4a2c6d',
      aiMessageBg: '#f3e5f5',
      userMessageText: '#ffffff',
      aiMessageText: '#6a1b9a',
      tabActive: '#9c27b0',
      tabInactive: '#ffffff',
      inputBg: '#2d1b4e',
      sendButton: '#9c27b0',
    },
    green: {
      name: 'Green',
      background: ['#0d1f0d', '#1a3a1a', '#0a1a0a'],
      userMessageBg: '#2d5a2d',
      aiMessageBg: '#e8f5e9',
      userMessageText: '#ffffff',
      aiMessageText: '#2e7d32',
      tabActive: '#4caf50',
      tabInactive: '#ffffff',
      inputBg: '#1a3a1a',
      sendButton: '#4caf50',
    },
    orange: {
      name: 'Orange',
      background: ['#2e1a0d', '#4a2d1a', '#1a0f0a'],
      userMessageBg: '#6d4a2c',
      aiMessageBg: '#fff3e0',
      userMessageText: '#ffffff',
      aiMessageText: '#e65100',
      tabActive: '#ff9800',
      tabInactive: '#ffffff',
      inputBg: '#4a2d1a',
      sendButton: '#ff9800',
    },
  };

  const currentTheme = themes[selectedTheme] || themes.dark;

  // Load theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('selectedTheme');
        if (savedTheme && themes[savedTheme]) {
          setSelectedTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const handleThemeChange = async (themeName) => {
    setSelectedTheme(themeName);
    setShowThemeSelector(false);
    try {
      await AsyncStorage.setItem('selectedTheme', themeName);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Load Google Fonts
  useEffect(() => {
    // For web platform, inject Google Fonts CSS
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Honk:MORF@15&family=Iceberg&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);

      // Add custom styles for the fonts
      const style = document.createElement('style');
      style.textContent = `
        .iceberg-regular {
          font-family: "Iceberg", sans-serif;
          font-weight: 400;
          font-style: normal;
        }
        .honk-font {
          font-family: "Honk", system-ui;
          font-optical-sizing: auto;
          font-weight: 400;
          font-style: normal;
          font-variation-settings: "MORF" 15, "SHLN" 50;
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  // Load profile picture from database
  useEffect(() => {
    if (user?.uid) {
      loadProfileFromDatabase();
    }
  }, [user]);

  const loadProfileFromDatabase = async () => {
    try {
      console.log('Loading profile from:', `${API_URL}/user-profile/${user.uid}`);
      const response = await fetch(`${API_URL}/user-profile/${user.uid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Profile data:', data);
      
      if (data && data.profilePicture) {
        console.log('Setting profile picture:', data.profilePicture);
        setLocalProfilePic(data.profilePicture);
      } else {
        console.log('No profile picture found');
        // Set to null or default image
        setLocalProfilePic(null);
      }
    } catch (error) {
      // Profile doesn't exist yet, that's okay - server now returns empty profile
      console.log('Profile not found or error loading:', error.message);
      setLocalProfilePic(null);
    }
  };

  // Load chat sessions from database
  useEffect(() => {
    if (user?.uid) {
      loadChatSessions();
    }
  }, [user]);

  const loadChatSessions = async () => {
    try {
      console.log('Loading chat sessions from:', `${API_URL}/chat-sessions/user/${user.uid}`);
      const response = await fetch(`${API_URL}/chat-sessions/user/${user.uid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Always set to array, even if empty
      setChatSessions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      console.error('API URL:', API_URL);
      // Set empty array on error
      setChatSessions([]);
    }
  };

  const createNewSession = async () => {
    try {
      if (!user?.uid) return null;
      
      const response = await fetch(`${API_URL}/chat-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        userId: user.uid,
        sessionName: 'New Chat'
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const saveMessageToSession = async (role, content, sources = []) => {
    try {
      if (!currentSessionId || !user?.uid) return;

      const response = await fetch(`${API_URL}/chat-sessions/${currentSessionId}/message`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        role,
        content,
        sources
        })
      });

      // Reload chat sessions to update titles (especially when first user message updates title)
      if (response.ok && role === 'user') {
        loadChatSessions();
      }
    } catch (error) {
      console.error('Error saving message to session:', error);
    }
  };

  const loadSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/chat-sessions/${sessionId}`);
      const session = await response.json();
      
      // Set messages from session
      const sessionMessages = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        sources: msg.sources || []
      }));
      
      setMessages(sessionMessages);
      setCurrentSessionId(sessionId);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  // Request image picker permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to change your profile picture!');
        }
      }
    })();
  }, []);

  const handleChangeProfilePic = async () => {
    try {
      console.log('Opening image picker...');
      
      // Request permissions first
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access camera roll is required!');
          return;
        }
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Use string format for newer expo-image-picker
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Get base64 for Cloudinary upload
      });

      console.log('Image picker result:', result.canceled ? 'Canceled' : 'Selected');

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const base64Image = result.assets[0].base64;
        
        console.log('Image selected:', {
          uri: imageUri,
          hasBase64: !!base64Image,
          base64Length: base64Image?.length || 0
        });

        if (!base64Image) {
          alert('Failed to get image data. Please try again.');
          return;
        }

        if (!user?.uid) {
          alert('User not logged in. Please log in first.');
          return;
        }
        
        // Show image immediately (optimistic update)
        setLocalProfilePic(imageUri);

        // Upload to Cloudinary and save to database
          try {
            // Convert to data URI format for Cloudinary
            const imageBase64 = `data:image/jpeg;base64,${base64Image}`;
            
          console.log('Uploading to:', `${API_URL}/user-profile/${user.uid}/picture`);
          
            const response = await fetch(
              `${API_URL}/user-profile/${user.uid}/picture`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  imageBase64,
                  email: user.email || '', // Include email from user object
                  displayName: user.displayName || ''
                })
              }
            );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log('Upload response:', data);

            // Update with Cloudinary URL
          if (data.profilePicture) {
            setLocalProfilePic(data.profilePicture);
            console.log('Profile picture updated successfully');
          } else {
            console.warn('No profilePicture in response:', data);
            alert('Upload successful but no picture URL returned.');
            }
          } catch (uploadError) {
            console.error('Error uploading profile picture:', uploadError);
          alert(`Error uploading profile picture: ${uploadError.message}`);
            // Revert to previous image on error
            await loadProfileFromDatabase();
          }
      } else if (result.canceled) {
        console.log('User canceled image selection');
      } else {
        console.warn('Unexpected result format:', result);
        alert('Failed to select image. Please try again.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert(`Error selecting image: ${error.message}`);
    }
  };

  useEffect(() => {
    if (greetingTyped) return;

    const personalizedGreeting = greetingMessage;

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < personalizedGreeting.length) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            content: personalizedGreeting.substring(0, currentIndex + 1),
          };
          return updated;
        });
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setMessages((prev) => {
          const updated = [...prev];
          updated[0] = {
            ...updated[0],
            isTyping: false,
          };
          return updated;
        });
        setGreetingTyped(true);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [greetingTyped, user]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = useCallback(async (messageText = null) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage = messageToSend.trim();
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];

    setInput('');
    setMessages(updatedMessages);
    setIsLoading(true);

    // Create session if it doesn't exist (skip in private mode)
    if (!isPrivateMode && !currentSessionId && user?.uid) {
      const newSession = await createNewSession();
      if (newSession) {
        setCurrentSessionId(newSession._id);
      }
    }

    // Save user message to session (skip in private mode)
    if (!isPrivateMode && currentSessionId) {
      await saveMessageToSession('user', userMessage);
    }

    // Safety: Ensure loading is cleared even if something goes wrong
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout - forcing loading state to false');
      setIsLoading(false);
    }, 35000); // 35 seconds safety timeout

    try {
      console.log('=== SENDING MESSAGE ===');
      console.log('API_URL:', API_URL);
      console.log('Message:', userMessage);
      console.log('Platform:', Platform.OS);
      
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('Request timeout after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout
      
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        question: userMessage,
        conversationHistory: updatedMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        user: user
          ? {
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
            }
          : null,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      clearTimeout(loadingTimeout);
      console.log('=== RESPONSE RECEIVED ===');
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Response received:', responseData ? 'Success' : 'Empty');
      
      // Validate response structure
      if (!responseData || !responseData.answer) {
        console.error('Invalid API response:', responseData);
        throw new Error('Invalid response from server - no answer field');
      }

      const { answer, sources } = responseData;
      console.log('Answer length:', answer?.length || 0);
      console.log('Answer preview:', answer?.substring(0, 100));

      if (!answer || answer.trim().length === 0) {
        throw new Error('Received empty answer from server');
      }

      const aiMessage = {
        role: 'ai',
        content: answer,
        sources: sources || [],
      };

      console.log('Adding AI message to chat');
      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to session (skip in private mode)
      if (!isPrivateMode && currentSessionId) {
        await saveMessageToSession('ai', answer, sources);
      }

      // Reload sessions to update recent chats (skip in private mode)
      if (!isPrivateMode && user?.uid) {
        loadChatSessions();
      }
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('=== CHAT ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('User message:', userMessage);
      console.error('API_URL:', API_URL);
      console.error('Platform:', Platform.OS);
      
      let errorMessage = "Sorry, I'm having trouble connecting to the brain right now. Please try again later.";
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        errorMessage = "Request timed out after 30 seconds. Please check:\n1. Your internet connection\n2. Backend server is running\n3. Correct API URL";
      } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('Network request failed'))) {
        errorMessage = `Cannot connect to server.\n\nCurrent API: ${API_URL}\n\nFor physical device, make sure:\n1. Backend is running on port 5000\n2. Use your computer's IP (not localhost)\n3. Phone and computer on same Wi-Fi\n4. Firewall allows port 5000`;
      } else if (error.message && error.message.includes('HTTP')) {
        errorMessage = `Server error: ${error.message}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      console.log('Adding error message to chat');
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: errorMessage,
        },
      ]);
    } finally {
      console.log('Clearing loading state');
      setIsLoading(false);
      clearTimeout(loadingTimeout);
    }
  }, [input, isLoading, messages, currentSessionId, user, isPrivateMode, API_URL, createNewSession, saveMessageToSession, loadChatSessions]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearchSelect = (term) => {
    setInput(term);
  };

  // Handle suggestion card click
  const handleSuggestionClick = async (suggestionText) => {
    console.log('Suggestion clicked:', suggestionText);
    // Dismiss keyboard if open
    Keyboard.dismiss();
    // Set input and send immediately
    try {
      await handleSend(suggestionText);
      // Scroll to bottom after a short delay to show the new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    } catch (error) {
      console.error('Error sending suggestion:', error);
    }
  };


  // Handle prompt button click
  const handlePromptClick = async (promptText) => {
    console.log('Prompt clicked:', promptText);
    // Dismiss keyboard if open
    Keyboard.dismiss();
    // Set input and send immediately
    try {
      await handleSend(promptText);
      // Scroll to bottom after a short delay to show the new messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    } catch (error) {
      console.error('Error sending prompt:', error);
    }
  };

  const handleNewChat = async () => {
    // Reset to initial state with greeting
    setMessages([
      { role: 'ai', content: '', isTyping: true },
    ]);
    setInput('');
    setGreetingTyped(false);
    setCurrentSessionId(null);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    
    // Reload sessions
    if (user?.uid) {
      loadChatSessions();
    }
  };


  const [activeTab, setActiveTab] = useState('Chat');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <LinearGradient
        colors={currentTheme.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternLine1} />
        <View style={styles.patternLine2} />
      </View>

      {/* Title Bar with Private Badge */}
      <View style={styles.titleBar}>
        <Text style={styles.titleText}>H-BOT</Text>
        <TouchableOpacity 
          style={[styles.proBadge, isPrivateMode && styles.proBadgeActive]}
          onPress={() => {
            const newPrivateMode = !isPrivateMode;
            setIsPrivateMode(newPrivateMode);
            // Clear current session when enabling private mode
            if (newPrivateMode) {
              setCurrentSessionId(null);
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" size={14} color={isPrivateMode ? "#FFD700" : "#999"} />
          <Text style={[styles.proText, isPrivateMode && styles.proTextActive]}>Private</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Chat' && { backgroundColor: currentTheme.tabActive }]}
          onPress={() => setActiveTab('Chat')}
        >
          <Ionicons 
            name="chatbubble" 
            size={20} 
            color={activeTab === 'Chat' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'Chat' && styles.tabTextActive]}>
            Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'History' && { backgroundColor: currentTheme.tabActive }]}
          onPress={() => setActiveTab('History')}
        >
          <Ionicons 
            name="time" 
            size={20} 
            color={activeTab === 'History' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'History' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Setting' && { backgroundColor: currentTheme.tabActive }]}
          onPress={() => setActiveTab('Setting')}
        >
          <Ionicons 
            name="settings" 
            size={20} 
            color={activeTab === 'Setting' ? '#fff' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'Setting' && styles.tabTextActive]}>
            Setting
          </Text>
        </TouchableOpacity>
      </View>

      {/* Keyboard Avoiding View - Wraps both ScrollView and Input */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Main Content */}
        <ScrollView 
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContentContainer}
        >
        {activeTab === 'Chat' && (
          <>
            {/* Suggestions Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                <TouchableOpacity 
                  onPress={() => {
                    navigation.navigate('AllSuggestions', {
                      allSuggestions: allSuggestions,
                      onSuggestionSelect: handleSuggestionClick,
                    });
                  }}
                >
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionsContainer}>
                {allSuggestions.slice(0, 2).map((suggestion) => (
                  <TouchableOpacity 
                    key={suggestion.id}
                    style={[
                      styles.suggestionCard,
                      suggestion.color === 'yellow' && styles.suggestionCardYellow,
                      suggestion.color === 'purple' && styles.suggestionCardPurple,
                      suggestion.color === 'orange' && styles.suggestionCardOrange,
                      suggestion.color === 'green' && styles.suggestionCardGreen,
                      suggestion.color === 'blue' && styles.suggestionCardBlue,
                      suggestion.color === 'pink' && styles.suggestionCardPink,
                      suggestion.color === 'teal' && styles.suggestionCardTeal,
                      suggestion.color === 'red' && styles.suggestionCardRed,
                    ]}
                    onPress={() => handleSuggestionClick(suggestion.query)}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.suggestionCardTitle,
                      (suggestion.color === 'purple' || suggestion.color === 'blue' || suggestion.color === 'teal' || suggestion.color === 'red') && styles.suggestionCardTitleLight
                    ]}>
                      {suggestion.title}
                    </Text>
                    <Text style={[
                      styles.suggestionCardText,
                      (suggestion.color === 'purple' || suggestion.color === 'blue' || suggestion.color === 'teal' || suggestion.color === 'red') && styles.suggestionCardTextLight
                    ]}>
                      {suggestion.description}
                    </Text>
                    <View style={styles.suggestionIllustration}>
                      <View style={[
                        styles.suggestionIconCircle,
                        (suggestion.color === 'yellow' || suggestion.color === 'orange' || suggestion.color === 'green') && styles.suggestionIconCircleDark
                      ]}>
                        <Ionicons 
                          name={suggestion.icon} 
                          size={28} 
                          color={suggestion.color === 'yellow' || suggestion.color === 'orange' || suggestion.color === 'green' ? '#000000' : '#ffffff'} 
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Chat Messages */}
            {messages.length > 0 && (
              <View style={styles.messagesSection}>
            {messages.map((msg, idx) => (
              <View
                key={idx}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' 
                    ? { backgroundColor: currentTheme.userMessageBg }
                    : { backgroundColor: currentTheme.aiMessageBg },
                ]}
              >
                {msg.isTyping && idx === 0 ? (
                  <View style={styles.typingContainer}>
                    <Text style={[styles.messageText, { color: msg.role === 'user' ? currentTheme.userMessageText : currentTheme.aiMessageText }]}>{msg.content}</Text>
                    <View style={styles.cursor} />
                  </View>
                ) : (
                  <Markdown style={msg.role === 'user' ? { ...markdownStylesUser, body: { ...markdownStylesUser.body, color: currentTheme.userMessageText } } : { ...markdownStylesAI, body: { ...markdownStylesAI.body, color: currentTheme.aiMessageText } }}>{msg.content}</Markdown>
                )}

                {/* Event Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <View style={styles.sourcesContainer}>
                    <Text style={styles.sourcesTitle}>
                      Found {msg.sources.length} Event{msg.sources.length !== 1 ? 's' : ''}
                    </Text>
                    {msg.sources.map((event, i) => {
                      const details = event.event_details || {};
                      const eventName = details.event_name || 'Event Name Unavailable';
                      const eventDate = details.event_date && details.event_date !== 'N/A' ? details.event_date : null;
                      const eventLocation = details.location && details.location !== 'N/A' ? details.location : null;
                      const eventTime = details.event_time && details.event_time !== 'N/A' ? details.event_time : null;

                      return (
                        <View key={i} style={styles.eventCard}>
                          <Text style={styles.eventName}>{eventName}</Text>
                          <View style={styles.eventDetails}>
                            {eventDate && (
                              <View style={styles.eventDetailRow}>
                                <Text style={styles.eventEmoji}>📅</Text>
                                <Text style={styles.eventDetailText}>{eventDate}</Text>
                              </View>
                            )}
                            {eventTime && (
                              <View style={styles.eventDetailRow}>
                                <Text style={styles.eventEmoji}>🕒</Text>
                                <Text style={styles.eventDetailText}>{eventTime}</Text>
                              </View>
                            )}
                            {eventLocation && (
                              <View style={styles.eventDetailRow}>
                                <Text style={styles.eventEmoji}>📍</Text>
                                <Text style={styles.eventDetailText}>{eventLocation}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageBubble, { backgroundColor: currentTheme.aiMessageBg }, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <Text style={[styles.typingText, { color: currentTheme.aiMessageText }]}>H-Bot is thinking</Text>
                  <View style={styles.typingDots}>
                    <View style={[styles.typingDot, { backgroundColor: currentTheme.aiMessageText }]} />
                    <View style={[styles.typingDot, { backgroundColor: currentTheme.aiMessageText }]} />
                    <View style={[styles.typingDot, { backgroundColor: currentTheme.aiMessageText }]} />
                  </View>
                </View>
              </View>
            )}
              </View>
            )}
          </>
        )}

        {/* History Tab Content */}
        {activeTab === 'History' && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Chats</Text>
            {chatSessions.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {chatSessions.map((session) => (
                  <TouchableOpacity
                    key={session._id}
                    style={[
                      styles.historyItem,
                      currentSessionId === session._id && styles.historyItemActive
                    ]}
                    onPress={() => {
                      loadSession(session._id);
                      setActiveTab('Chat');
                    }}
                  >
                    <Text style={styles.historyItemText} numberOfLines={1}>
                      {session.sessionName || 'New Chat'}
                    </Text>
                    {session.lastMessage && (
                      <Text style={styles.historyItemSubtext} numberOfLines={1}>
                        {session.lastMessage}
                      </Text>
                    )}
                    <Text style={styles.historyItemTime}>
                      {new Date(session.lastMessageTime).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyHistoryState}>
                <Text style={styles.emptyHistoryText}>No recent chats</Text>
                <Text style={styles.emptyHistorySubtext}>Start chatting to see your history</Text>
              </View>
            )}
          </View>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'Setting' && (
          <ScrollView style={styles.settingsSection} showsVerticalScrollIndicator={false}>
            {/* Profile Section */}
            <View style={styles.settingsProfileSection}>
              <TouchableOpacity
                onPress={handleChangeProfilePic}
                style={styles.profilePicContainer}
              >
                {localProfilePic ? (
                  <Image source={{ uri: localProfilePic }} style={styles.profilePic} />
                ) : user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.profilePic} />
                ) : (
                  <View style={styles.profilePicPlaceholder}>
                    <Text style={styles.profilePicPlaceholderText}>
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.profilePicEditBadge}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            </View>

            {/* Settings Options */}
            <View style={styles.settingsOptions}>
              {/* Notifications */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={styles.settingsOptionItem}
              >
                <View style={styles.settingsOptionLeft}>
                  <Ionicons name="notifications" size={24} color={currentTheme.tabActive} />
                  <Text style={styles.settingsOptionText}>Notifications</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>

              {/* Themes */}
              <TouchableOpacity
                onPress={() => setShowThemeSelector(true)}
                style={styles.settingsOptionItem}
              >
                <View style={styles.settingsOptionLeft}>
                  <Ionicons name="color-palette" size={24} color={currentTheme.tabActive} />
                  <Text style={styles.settingsOptionText}>Themes</Text>
                </View>
                <View style={styles.settingsOptionRight}>
                  <Text style={styles.settingsOptionValue}>{currentTheme.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                </View>
              </TouchableOpacity>

              {/* Private Mode */}
              <View style={styles.settingsOptionItem}>
                <View style={styles.settingsOptionLeft}>
                  <Ionicons name="lock-closed" size={24} color={currentTheme.tabActive} />
                  <View style={styles.settingsOptionTextContainer}>
                    <Text style={styles.settingsOptionText}>Private Mode</Text>
                    <Text style={styles.settingsOptionSubtext}>
                      {isPrivateMode ? 'Chats won\'t be saved' : 'Chats will be saved'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newPrivateMode = !isPrivateMode;
                    setIsPrivateMode(newPrivateMode);
                    if (newPrivateMode) {
                      setCurrentSessionId(null);
                    }
                  }}
                  style={[styles.toggleSwitch, isPrivateMode && { backgroundColor: currentTheme.tabActive }]}
                >
                  <View style={[styles.toggleSwitchThumb, isPrivateMode && styles.toggleSwitchThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Logout */}
              <TouchableOpacity
                onPress={async () => {
                  await handleLogout();
                }}
                style={[styles.settingsOptionItem, styles.logoutButton]}
              >
                <View style={styles.settingsOptionLeft}>
                  <Ionicons name="log-out" size={24} color="#ff4444" />
                  <Text style={[styles.settingsOptionText, styles.logoutText]}>Logout</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
        </ScrollView>

        {/* Prompt Library Section - Above Input Bar */}
        {activeTab === 'Chat' && (
          <View style={styles.promptLibraryFixedContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.promptLibraryContainer}
              contentContainerStyle={styles.promptLibraryContent}
            >
              <TouchableOpacity 
                style={[styles.promptButton, styles.newChatButton]}
                onPress={handleNewChat}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle" size={16} color="#FF6B35" />
                <Text style={[styles.promptButtonText, styles.newChatButtonText]}>New Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('What events are happening today?')}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Show me upcoming events this week')}
                activeOpacity={0.7}
              >
                <Ionicons name="time" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Show me event venues and locations')}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Venues</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Show me popular events')}
                activeOpacity={0.7}
              >
                <Ionicons name="flame" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Popular</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Show me free events')}
                activeOpacity={0.7}
              >
                <Ionicons name="gift" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Free</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Find music events')}
                activeOpacity={0.7}
              >
                <Ionicons name="musical-notes" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Music</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Find sports events')}
                activeOpacity={0.7}
              >
                <Ionicons name="football" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Sports</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Find arts and culture events')}
                activeOpacity={0.7}
              >
                <Ionicons name="color-palette" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Arts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Find food and dining events')}
                activeOpacity={0.7}
              >
                <Ionicons name="restaurant" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Food</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Show me weekend events')}
                activeOpacity={0.7}
              >
                <Ionicons name="sunny" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Weekend</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.promptButton}
                onPress={() => handlePromptClick('Help me find events')}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle" size={16} color="#667eea" />
                <Text style={styles.promptButtonText}>Help</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Bottom Input Area - Only show on Chat tab */}
        {activeTab === 'Chat' && (
          <View style={styles.bottomInputContainer}>
            {/* Input Field */}
            <View style={styles.inputRow}>
              <View style={[styles.inputWrapperNew, { backgroundColor: currentTheme.inputBg }]}>
                <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" style={styles.searchIcon} />
                <TextInput
                  style={styles.inputNew}
                  placeholder="Ask H-BOT"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={input}
                  onChangeText={setInput}
                  multiline={false}
                  editable={!isLoading}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (input.trim() && !isLoading) {
                      handleSend();
                    }
                  }}
                  onFocus={() => {
                    // Scroll to bottom when input is focused
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
              </View>
              <TouchableOpacity
                style={[styles.sendButtonNew, { backgroundColor: currentTheme.sendButton }, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
                onPress={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                <Ionicons name="paper-plane" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <Modal
          visible={showThemeSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowThemeSelector(false)}
        >
          <View style={styles.themeModalOverlay}>
            <View style={[styles.themeModalContent, { backgroundColor: currentTheme.background[1] }]}>
              <View style={[styles.themeModalHeader, { borderBottomColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={styles.themeModalTitle}>Choose Theme</Text>
                <TouchableOpacity
                  onPress={() => setShowThemeSelector(false)}
                  style={styles.themeModalCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.themeOptionsContainer}>
                {Object.entries(themes).map(([key, theme]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.themeOption,
                      { backgroundColor: selectedTheme === key ? `${theme.tabActive}20` : 'rgba(255, 255, 255, 0.05)' },
                      selectedTheme === key && { borderColor: theme.tabActive }
                    ]}
                    onPress={() => handleThemeChange(key)}
                  >
                    <View style={styles.themePreview}>
                      <View style={[styles.themePreviewColor, { backgroundColor: theme.background[0] }]} />
                      <View style={[styles.themePreviewColor, { backgroundColor: theme.userMessageBg }]} />
                      <View style={[styles.themePreviewColor, { backgroundColor: theme.aiMessageBg }]} />
                      <View style={[styles.themePreviewColor, { backgroundColor: theme.tabActive }]} />
                    </View>
                    <Text style={[styles.themeOptionText, selectedTheme === key && { color: '#ffffff' }]}>
                      {theme.name}
                    </Text>
                    {selectedTheme === key && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.tabActive} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by <Text style={styles.footerBrand}>SkyWeb</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const markdownStylesUser = {
  body: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
  },
};

const markdownStylesAI = {
  body: {
    color: '#333',
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 4,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternLine1: {
    position: 'absolute',
    top: 200,
    left: -50,
    width: 200,
    height: 1,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },
  patternLine2: {
    position: 'absolute',
    top: 300,
    right: -50,
    width: 200,
    height: 1,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-45deg' }],
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 0) + 40,
    paddingBottom: 16,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(153, 153, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#999',
    gap: 4,
  },
  proBadgeActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  proTextActive: {
    color: '#FFD700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#667eea',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  suggestionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  suggestionCardYellow: {
    backgroundColor: '#FFD700',
  },
  suggestionCardPurple: {
    backgroundColor: '#667eea',
  },
  suggestionCardOrange: {
    backgroundColor: '#FF9800',
  },
  suggestionCardGreen: {
    backgroundColor: '#4CAF50',
  },
  suggestionCardBlue: {
    backgroundColor: '#2196F3',
  },
  suggestionCardPink: {
    backgroundColor: '#E91E63',
  },
  suggestionCardTeal: {
    backgroundColor: '#009688',
  },
  suggestionCardRed: {
    backgroundColor: '#F44336',
  },
  suggestionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    zIndex: 2,
  },
  suggestionCardTitleLight: {
    color: '#ffffff',
  },
  suggestionCardText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 18,
    zIndex: 2,
  },
  suggestionCardTextLight: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  suggestionCardModal: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  allSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  suggestionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  suggestionsModalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  suggestionsModalContent: {
    width: '100%',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  suggestionsModalContentInner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  suggestionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  suggestionsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  suggestionsModalCloseButton: {
    padding: 4,
  },
  suggestionsModalScrollView: {
    flex: 1,
  },
  suggestionsModalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  suggestionIllustration: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
  },
  suggestionIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    position: 'absolute',
    bottom: 10,
    right: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionIconCircleDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  designPerson: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  articlePerson: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  promptLibraryFixedContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptLibraryContainer: {
    flexDirection: 'row',
  },
  promptLibraryContent: {
    paddingRight: 20,
  },
  promptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
    marginRight: 8,
  },
  promptButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  newChatButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)', // Orange background with transparency
    borderColor: '#FF6B35', // Orange border
    borderWidth: 1.5,
  },
  newChatButtonText: {
    color: '#FF6B35', // Orange text
    fontWeight: '600',
  },
  messagesSection: {
    paddingBottom: 20,
    marginTop: 20,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3a3a3a',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5dc',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cursor: {
    width: 2,
    height: 16,
    backgroundColor: '#1e88e5',
    marginLeft: 4,
  },
  sourcesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  sourcesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e88e5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.15)',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e88e5',
    marginBottom: 8,
  },
  eventDetails: {
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventEmoji: {
    fontSize: 14,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  typingBubble: {
    width: 'auto',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#999',
  },
  bottomInputContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#000000',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapperNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  inputNew: {
    flex: 1,
    fontSize: 15,
    color: 'white',
    padding: 0,
  },
  sendButtonNew: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    display: 'none',
  },
  footerText: {
    fontSize: 11,
    color: '#aaa',
  },
  footerBrand: {
    fontWeight: '600',
    color: '#1e88e5',
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  menuIcon: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'normal',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 350,
    height: '100%',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#667eea',
  },
  profilePicPlaceholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  profilePicEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  profilePicEditIcon: {
    fontSize: 18,
  },
  profilePicEditIconText: {
    fontSize: 18,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  drawerLogoutButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  drawerLogoutText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  notificationButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  notificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  recentChatsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
  },
  drawerScrollView: {
    flex: 1,
  },
  drawerSearchItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerSearchText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  drawerSearchSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginBottom: 4,
  },
  drawerSearchTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  drawerSearchItemActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  historySection: {
    paddingTop: 20,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  historyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyItemActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.3)',
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  historyItemText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyItemSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginBottom: 4,
  },
  historyItemTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
  },
  emptyHistoryState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyHistorySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  settingsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingsProfileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20,
  },
  settingsOptions: {
    gap: 12,
  },
  settingsOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingsOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingsOptionTextContainer: {
    flex: 1,
  },
  settingsOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingsOptionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  settingsOptionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsOptionValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  toggleSwitchThumbActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ff4444',
  },
  themeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  themeModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  themeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  themeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  themeModalCloseButton: {
    padding: 4,
  },
  themeOptionsContainer: {
    padding: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 16,
    gap: 4,
  },
  themePreviewColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  themeOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default ChatScreen;

