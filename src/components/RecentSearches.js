import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

const RecentSearches = ({ searches, onSelect }) => {
  if (!searches || searches.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🕒 Recent Searches</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {searches.map((term, index) => (
          <Animated.View
            key={index}
            entering={FadeInRight.delay(index * 100)}
          >
            <TouchableOpacity
              style={styles.searchItem}
              onPress={() => onSelect(term)}
            >
              <Text style={styles.searchText}>{term}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    marginBottom: 8,
  },
  headerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    gap: 8,
  },
  searchItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  searchText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
});

export default RecentSearches;

