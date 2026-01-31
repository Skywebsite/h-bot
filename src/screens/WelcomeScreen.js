import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen = ({ navigation, onWelcomeComplete }) => {
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleGetStarted = async () => {
    if (onWelcomeComplete) {
      await onWelcomeComplete();
    }
    navigation.replace('Chat');
  };

  const handleTermsPress = () => {
    setShowTermsModal(true);
  };

  const handleCloseTerms = () => {
    setShowTermsModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#0a0a0a']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Background Pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternLine1} />
        <View style={styles.patternLine2} />
        <View style={styles.patternCircle} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Illustration Section */}
        <View style={styles.illustrationContainer}>
          {/* Robot */}
          <View style={styles.robotContainer}>
            <View style={styles.robotBody}>
              <View style={styles.robotHead}>
                <View style={styles.robotEye} />
                <View style={styles.robotEye} />
              </View>
              <View style={styles.robotTablet}>
                <View style={styles.tabletScreen} />
              </View>
            </View>
          </View>

          {/* Person */}
          <View style={styles.personContainer}>
            <View style={styles.personBody}>
              <View style={styles.personHead} />
              <View style={styles.personTop}>
                <View style={{ position: 'absolute', top: 5, left: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                <View style={{ position: 'absolute', top: 15, left: 18, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                <View style={{ position: 'absolute', top: 25, left: 10, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                <View style={{ position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
                <View style={{ position: 'absolute', top: 22, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' }} />
              </View>
              <View style={styles.personTablet}>
                <View style={styles.tabletScreen} />
              </View>
            </View>
          </View>

          {/* Books */}
          <View style={styles.booksContainer}>
            <View style={styles.book1} />
            <View style={styles.book2} />
          </View>

          {/* Decorative Circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
        </View>

        {/* Title */}
        <Text style={styles.title}>H-BOT</Text>

        {/* Description */}
        <Text style={styles.description}>
          Events, timings, venue info—sab{'\n'}
          milega idhar! Just type, chill karo 😎
        </Text>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity style={styles.termsButton} onPress={handleTermsPress}>
          <Text style={styles.termsText}>Terms & conditions</Text>
        </TouchableOpacity>
        <Text style={styles.termsSmallText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseTerms}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={handleCloseTerms} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>1. Acceptance of Terms</Text>
              <Text style={styles.modalText}>
                By accessing and using H-BOT, you accept and agree to be bound by the terms and provision of this agreement.
              </Text>

              <Text style={styles.modalSectionTitle}>2. Use License</Text>
              <Text style={styles.modalText}>
                Permission is granted to temporarily use H-BOT for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </Text>

              <Text style={styles.modalSectionTitle}>3. Service Description</Text>
              <Text style={styles.modalText}>
                H-BOT provides event information, timings, venue details, and related services. We strive to provide accurate information but do not guarantee the completeness or accuracy of all data.
              </Text>

              <Text style={styles.modalSectionTitle}>4. User Responsibilities</Text>
              <Text style={styles.modalText}>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
              </Text>

              <Text style={styles.modalSectionTitle}>5. Privacy Policy</Text>
              <Text style={styles.modalText}>
                Your use of H-BOT is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your information.
              </Text>

              <Text style={styles.modalSectionTitle}>6. Limitation of Liability</Text>
              <Text style={styles.modalText}>
                H-BOT shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </Text>

              <Text style={styles.modalSectionTitle}>7. Changes to Terms</Text>
              <Text style={styles.modalText}>
                We reserve the right to modify these terms at any time. Your continued use of H-BOT after any such changes constitutes your acceptance of the new terms.
              </Text>

              <Text style={styles.modalSectionTitle}>8. Contact Information</Text>
              <Text style={styles.modalText}>
                If you have any questions about these Terms & Conditions, please contact us through the app.
              </Text>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseTerms}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
    top: 100,
    left: -50,
    width: 200,
    height: 1,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
  },
  patternLine2: {
    position: 'absolute',
    top: 200,
    right: -50,
    width: 200,
    height: 1,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '-45deg' }],
  },
  patternCircle: {
    position: 'absolute',
    top: 150,
    left: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
  },
  illustrationContainer: {
    width: '100%',
    height: 250,
    marginBottom: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotContainer: {
    position: 'absolute',
    left: '15%',
    top: '20%',
    zIndex: 3,
  },
  robotBody: {
    alignItems: 'center',
  },
  robotHead: {
    width: 50,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  robotEye: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
  },
  robotTablet: {
    width: 40,
    height: 50,
    backgroundColor: '#667eea',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabletScreen: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    margin: 2,
  },
  personContainer: {
    position: 'absolute',
    right: '15%',
    top: '25%',
    zIndex: 2,
  },
  personBody: {
    alignItems: 'center',
  },
  personHead: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#d4a574',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  personTop: {
    width: 50,
    height: 40,
    backgroundColor: '#ffd700',
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  personTablet: {
    width: 40,
    height: 50,
    backgroundColor: '#ffd700',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  booksContainer: {
    position: 'absolute',
    left: '20%',
    bottom: '10%',
    zIndex: 1,
  },
  book1: {
    width: 35,
    height: 45,
    backgroundColor: '#667eea',
    borderRadius: 2,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  book2: {
    width: 35,
    height: 45,
    backgroundColor: '#8b5cf6',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  circle1: {
    position: 'absolute',
    top: '10%',
    right: '10%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  circle2: {
    position: 'absolute',
    bottom: '15%',
    right: '20%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  circle3: {
    position: 'absolute',
    top: '30%',
    left: '5%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'center',
  },
  termsButton: {
    paddingVertical: 12,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
  termsSmallText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0a0a0a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    maxHeight: 400,
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 12,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0a0a0a',
  },
  modalCloseButton: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default WelcomeScreen;

