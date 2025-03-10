import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const VerificationModal = ({ isVisible, onClose, onSuccess }) => {
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [input, setInput] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const handleVerification = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userMobile = await AsyncStorage.getItem(`userMobile_${userId}`);
      
      if (verificationMethod === 'mobile') {
        if (input !== userMobile) {
          Alert.alert('Error', 'Mobile number does not match our records');
          return;
        }
        
        // Generate 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        await AsyncStorage.setItem(`resetOtp_${userId}`, generatedOtp);
        
        Alert.alert('OTP Sent', `Your OTP is: ${generatedOtp}`);
        setShowOtpInput(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    }
  };

  const verifyOtp = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const storedOtp = await AsyncStorage.getItem(`resetOtp_${userId}`);
      
      if (otp === storedOtp) {
        await AsyncStorage.removeItem(`resetOtp_${userId}`);
        onSuccess();
      } else {
        Alert.alert('Error', 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'OTP verification failed');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {!verificationMethod ? (
            <>
              <Text style={styles.title}>Verify Your Identity</Text>
              <TouchableOpacity 
                style={styles.methodButton}
                onPress={() => setVerificationMethod('mobile')}
              >
                <MaterialIcons name="phone" size={24} color="#007BFF" />
                <Text style={styles.methodText}>Verify via Mobile Number</Text>
              </TouchableOpacity>
            </>
          ) : !showOtpInput ? (
            <>
              <Text style={styles.title}>Enter Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Enter your registered mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
              <TouchableOpacity 
                style={styles.button}
                onPress={handleVerification}
              >
                <Text style={styles.buttonText}>Send OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Enter OTP</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                placeholder="Enter 6-digit OTP"
                keyboardType="numeric"
                maxLength={6}
              />
              <TouchableOpacity 
                style={styles.button}
                onPress={verifyOtp}
              >
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              setVerificationMethod(null);
              setInput('');
              setOtp('');
              setShowOtpInput(false);
              onClose();
            }}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: '100%',
    marginBottom: 10,
  },
  methodText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 15,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default VerificationModal;