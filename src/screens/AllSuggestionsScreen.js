import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AllSuggestionsScreen = ({ navigation, route }) => {
  const { onSuggestionSelect, allSuggestions: passedSuggestions } = route.params || {};
  const [selectedTheme, setSelectedTheme] = useState('dark');

  // All suggestions data
  const allSuggestions = passedSuggestions || [
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
      tabActive: '#667eea',
    },
    blue: {
      name: 'Blue',
      background: ['#0a1929', '#1a2f4a', '#0d1b2a'],
      tabActive: '#2196f3',
    },
    purple: {
      name: 'Purple',
      background: ['#1a0d2e', '#2d1b4e', '#0f0a1a'],
      tabActive: '#9c27b0',
    },
    green: {
      name: 'Green',
      background: ['#0d1f0d', '#1a3a1a', '#0a1a0a'],
      tabActive: '#4caf50',
    },
    orange: {
      name: 'Orange',
      background: ['#2e1a0d', '#4a2d1a', '#1a0f0a'],
      tabActive: '#ff9800',
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

  const handleSuggestionClick = async (suggestionText) => {
    // Navigate back first
    navigation.goBack();
    // Then call the callback after a small delay to ensure navigation completes
    if (onSuggestionSelect) {
      setTimeout(() => {
        onSuggestionSelect(suggestionText);
      }, 300);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <LinearGradient
        colors={currentTheme.background}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Suggestions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.suggestionsGrid}>
          {allSuggestions.map((suggestion) => (
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
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : (StatusBar.currentHeight || 0) + 10,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  suggestionCard: {
    width: '47%',
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
});

export default AllSuggestionsScreen;

