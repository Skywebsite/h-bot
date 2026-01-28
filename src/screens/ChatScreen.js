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
  PermissionsAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import Constants from 'expo-constants';
// Using fetch API instead of axios for React Native compatibility
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { Ionicons } from '@expo/vector-icons';

// Check if we're in Expo Go (voice won't work) or production build (voice will work)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// LOCAL DEVELOPMENT - Use appropriate URL based on platform
// Android emulator uses 10.0.2.2 to access host machine's localhost
// Physical Android device uses your computer's IP address
// iOS simulator and web can use localhost
const getApiUrl = () => {
  // Check if we're in development mode
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  
  if (isDev) {
    if (Platform.OS === 'android') {
      // Use your computer's IP address for physical device
      // For emulator, change back to 'http://10.0.2.2:5000/api'
      return 'http://10.156.236.116:5000/api'; // Physical Android device
    }
    return 'http://localhost:5000/api'; // iOS simulator or web
  }
  return 'https://d-bot-new-backedn-lxj9.vercel.app/api'; // Production App Server
};
const API_URL = getApiUrl();

const ChatScreen = ({ user, navigation }) => {
  const greetingMessage = "Yo! 👋 I'm D-Bot 🤖✨\nEvents, timings, venue info—sab milega idhar!\nJust type, chill karo 😎";
  const [messages, setMessages] = useState([
    { role: 'ai', content: '', isTyping: true },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [greetingTyped, setGreetingTyped] = useState(false);
  const [searches, setSearches] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [localProfilePic, setLocalProfilePic] = useState(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollViewRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(-350)).current;

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
      setShowMenu(false);
      
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

  // Voice Recognition setup will be done after handleSend is defined

  // Request microphone permissions
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'D-Bot needs access to your microphone for voice input',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission error:', err);
        return false;
      }
    }
    return true; // iOS permissions handled automatically
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      // Check if we're in Expo Go
      if (isExpoGo) {
        alert('Voice input is not available in Expo Go. Please build the app to use this feature.');
        setIsVoiceMode(false);
        return;
      }

      // Check if Voice is available
      if (!Voice || typeof Voice.start !== 'function') {
        alert('Voice recognition is not available. Please rebuild the app.');
        setIsVoiceMode(false);
        return;
      }

      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone permission is required for voice input');
        return;
      }

      await Voice.start('en-US'); // Start recognition for English
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      if (error.message?.includes('null') || error.message?.includes('startSpeech')) {
        alert('Voice recognition requires a production build. Please rebuild the app with native modules enabled.');
        setIsVoiceMode(false);
      } else {
        alert(`Failed to start voice recording: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Stop voice recording
  const stopRecording = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop();
      }
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  // Toggle voice mode
  const toggleVoiceMode = () => {
    // Check if we're in Expo Go
    if (isExpoGo) {
      alert('Voice input requires a production build.\n\nText-to-speech (AI responses) will still work.\n\nTo enable voice input, build the app with:\neas build --platform android\nor\nnpx expo run:android');
      return;
    }

    // Check if Voice is available before enabling voice mode
    if (!isVoiceMode && (!Voice || typeof Voice.start !== 'function')) {
      alert('Voice recognition is not available. Please rebuild the app to enable native modules.');
      return;
    }

    if (isRecording) {
      stopRecording();
    }
    setIsVoiceMode(!isVoiceMode);
    setInput(''); // Clear input when switching modes
  };

  // Speak AI response
  const speakText = (text) => {
    if (!isVoiceMode || !text) return;
    
    // Stop any ongoing speech
    Speech.stop();
    
    // Clean text for speech (remove markdown, emojis, etc.)
    const cleanText = text
      .replace(/[#*_`]/g, '') // Remove markdown
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .substring(0, 500); // Limit length
    
    setIsSpeaking(true);
    Speech.speak(cleanText, {
      language: 'en',
      pitch: 1.0,
      rate: 0.9,
      onDone: () => {
        setIsSpeaking(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
      },
      onError: (error) => {
        console.error('Speech error:', error);
        setIsSpeaking(false);
      },
    });
  };

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

    const personalizedGreeting = user
      ? `Hey ${user.displayName}! 👋 I'm D-Bot 🤖✨\nEvents, timings, venue info—sab milega idhar!\nJust type, chill karo 😎`
      : greetingMessage;

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
    
    // Stop recording if active
    if (isRecording) {
      await stopRecording();
    }

    // Create session if it doesn't exist
    if (!currentSessionId && user?.uid) {
      const newSession = await createNewSession();
      if (newSession) {
        setCurrentSessionId(newSession._id);
      }
    }

    // Save user message to session
    if (currentSessionId) {
      await saveMessageToSession('user', userMessage);
    }

    try {
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
        })
      });
      const responseData = await response.json();
      const { answer, sources } = responseData;

      const aiMessage = {
        role: 'ai',
        content: answer,
        sources: sources,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to session
      if (currentSessionId) {
        await saveMessageToSession('ai', answer, sources);
      }

      // Speak AI response if in voice mode
      if (isVoiceMode) {
        speakText(answer);
      }

      // Reload sessions to update recent chats
      if (user?.uid) {
        loadChatSessions();
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: "Sorry, I'm having trouble connecting to the brain right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, currentSessionId, user, isRecording, isVoiceMode, API_URL, createNewSession, saveMessageToSession, loadChatSessions, speakText, stopRecording]);

  // Setup Voice Recognition (moved here after handleSend is defined)
  useEffect(() => {
    // Skip setup in Expo Go (voice recognition requires native modules)
    if (isExpoGo) {
      console.log('Voice recognition disabled in Expo Go. Will work in production builds.');
      return;
    }

    // Skip on web platform
    if (Platform.OS === 'web') {
      return;
    }

    // Check if Voice is available
    if (!Voice || typeof Voice.start !== 'function') {
      console.warn('Voice recognition not available. This feature requires a production build.');
      return;
    }

    // Voice recognition event handlers
    Voice.onSpeechStart = () => {
      setIsRecording(true);
      console.log('Speech recognition started');
    };

    Voice.onSpeechEnd = () => {
      setIsRecording(false);
      console.log('Speech recognition ended');
    };

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        const recognizedText = e.value[0];
        console.log('Recognized text:', recognizedText);
        setInput(recognizedText);
        // Auto-send in voice mode
        if (isVoiceMode) {
          setTimeout(() => {
            handleSend(recognizedText);
          }, 500);
        }
      }
    };

    Voice.onSpeechError = (e) => {
      console.error('Speech recognition error:', e);
      setIsRecording(false);
      if (e.error?.code !== '7') { // Ignore "no match" errors
        alert('Speech recognition error. Please try again.');
      }
    };

    return () => {
      if (Voice && typeof Voice.destroy === 'function') {
        Voice.destroy().then(() => {
          if (Voice && typeof Voice.removeAllListeners === 'function') {
            Voice.removeAllListeners();
          }
        }).catch(() => {
          // Ignore cleanup errors
        });
      }
    };
  }, [isVoiceMode, handleSend]);

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

  // Animate drawer opening/closing
  useEffect(() => {
    if (showMenu) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -350,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMenu]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text 
          style={[
            styles.headerTitle,
            Platform.OS === 'web' && styles.headerTitleWeb
          ]}
          {...(Platform.OS === 'web' && { className: 'honk-font' })}
        >
          D-Bot
        </Text>
        <TouchableOpacity 
          onPress={handleNewChat}
          style={styles.newChatButton}
        >
          <Image 
            source={require('./fiber_new_24dp_E3E3E3_FILL0_wght400_GRAD0_opsz24.png')}
            style={styles.newChatIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Chat Container */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              {msg.isTyping && idx === 0 ? (
                <View style={styles.typingContainer}>
                  <Text style={[styles.messageText, msg.role === 'user' ? styles.userMessageText : styles.aiMessageText]}>{msg.content}</Text>
                  <View style={styles.cursor} />
                </View>
              ) : (
                <Markdown style={msg.role === 'user' ? markdownStylesUser : markdownStylesAI}>{msg.content}</Markdown>
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
            <View style={[styles.messageBubble, styles.aiMessage, styles.typingBubble]}>
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>D-Bot is thinking</Text>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={isVoiceMode ? "Tap microphone to speak..." : "Type your question..."}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={input}
              onChangeText={setInput}
              multiline
              editable={!isLoading && !isVoiceMode}
            />
          </View>
          
          {/* Voice Mode Toggle Button */}
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isVoiceMode && styles.voiceButtonActive,
              (isLoading || isSpeaking) && styles.voiceButtonDisabled
            ]}
            onPress={toggleVoiceMode}
            disabled={isLoading || isSpeaking}
          >
            <Ionicons 
              name={isVoiceMode ? "mic" : "mic-outline"} 
              size={24} 
              color={isVoiceMode ? "#fff" : "rgba(255, 255, 255, 0.7)"} 
            />
            {isRecording && (
              <View style={styles.recordingIndicator} />
            )}
          </TouchableOpacity>

          {/* Send Button or Record Button */}
          {isVoiceMode ? (
            <TouchableOpacity
              style={[
                styles.sendButton,
                isRecording ? styles.recordButtonActive : styles.recordButton,
                (isLoading || isSpeaking) && styles.sendButtonDisabled
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isSpeaking}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <Ionicons name="mic-circle" size={28} color="#fff" />
              )}
            </TouchableOpacity>
          ) : (
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Hamburger Menu Drawer */}
      {showMenu && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <Animated.View 
            style={[
              styles.drawerContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.drawerContent}>
              {/* Profile Section */}
              <View style={styles.profileSection}>
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
                    <Text style={styles.profilePicEditIcon}>📷</Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || ''}</Text>
                <TouchableOpacity
                  onPress={async () => {
                    await handleLogout();
                    setShowMenu(false);
                  }}
                  style={styles.drawerLogoutButton}
                >
                  <Text style={styles.drawerLogoutText}>Logout</Text>
                </TouchableOpacity>
              </View>

              {/* Notifications Button */}
              <TouchableOpacity
                onPress={() => {
                  setShowMenu(false);
                  navigation.navigate('Notifications');
                }}
                style={styles.notificationButton}
              >
                <Text style={styles.notificationButtonIcon}>📢</Text>
                <Text style={styles.notificationButtonText}>Notifications</Text>
              </TouchableOpacity>

              {/* Recent Chats Section */}
              <View style={styles.recentChatsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>🕒 Recent Chats</Text>
                  <TouchableOpacity
                    onPress={() => setShowMenu(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                {chatSessions.length > 0 ? (
                  <ScrollView style={styles.drawerScrollView} showsVerticalScrollIndicator={false}>
                    {chatSessions.map((session) => (
                      <TouchableOpacity
                        key={session._id}
                        style={[
                          styles.drawerSearchItem,
                          currentSessionId === session._id && styles.drawerSearchItemActive
                        ]}
                        onPress={() => {
                          loadSession(session._id);
                        }}
                      >
                        <Text style={styles.drawerSearchText} numberOfLines={1}>
                          {session.sessionName || 'New Chat'}
                        </Text>
                        {session.lastMessage && (
                          <Text style={styles.drawerSearchSubtext} numberOfLines={1}>
                            {session.lastMessage}
                          </Text>
                        )}
                        <Text style={styles.drawerSearchTime}>
                          {new Date(session.lastMessageTime).toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No recent chats</Text>
                    <Text style={styles.emptyStateSubtext}>Start chatting to see your history</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by <Text style={styles.footerBrand}>SkyWeb</Text>
        </Text>
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      fontFamily: '"Honk", system-ui',
      fontVariationSettings: '"MORF" 15, "SHLN" 50',
    } : {
      // For native platforms, use system fonts as fallback
      fontFamily: Platform.select({
        ios: 'System',
        android: 'sans-serif',
        default: 'System',
      }),
    }),
  },
  headerTitleWeb: {
    fontFamily: '"Honk", system-ui',
    fontVariationSettings: '"MORF" 15, "SHLN" 50',
  },
  newChatButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  newChatIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
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
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#3a3a3a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    fontSize: 15,
    color: 'white',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5dc',
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
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  voiceButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },
  recordingIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4444',
    top: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  recordButton: {
    backgroundColor: '#667eea',
  },
  recordButtonActive: {
    backgroundColor: '#ff4444',
  },
  stopIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 2,
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
});

export default ChatScreen;

