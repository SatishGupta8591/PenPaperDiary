import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const PinModal = ({ isVisible, onClose, mode = 'verify' }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  const router = useRouter();

  const handleSetPin = async () => {
    try {
      if (pin.length !== 4) {
        Alert.alert('Error', 'PIN must be 4 digits');
        return;
      }

      if (pin !== confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      await AsyncStorage.setItem(`securityPin_${userId}`, pin);
      Alert.alert('Success', 'PIN set successfully');
      onClose(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to set PIN');
    }
  };

  const handleVerifyPin = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const savedPin = await AsyncStorage.getItem(`securityPin_${userId}`);

      if (pin === savedPin) {
        setAttempts(0);
        onClose(true);
      } else {
        const remainingAttempts = maxAttempts - (attempts + 1);
        setAttempts(prev => prev + 1);
        setPin('');
        
        if (remainingAttempts === 0) {
          Alert.alert(
            'Maximum attempts reached',
            'Please try again later',
            [
              {
                text: 'OK',
                onPress: () => {
                  setAttempts(0);
                  handleCancel();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Invalid PIN',
            `Incorrect PIN. ${remainingAttempts} attempts remaining`
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify PIN');
    }
  };

  const handleForgotPin = async () => {
    Alert.alert(
      "Reset PIN",
      "Are you sure you want to reset your PIN? You'll need to set a new PIN.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              await AsyncStorage.removeItem(`securityPin_${userId}`);
              Alert.alert("Success", "PIN has been reset. Please set a new PIN.");
              onClose(false);
              // Redirect to home tab after small delay
              setTimeout(() => {
                router.replace("/(tabs)/home");
              }, 500);
            } catch (error) {
              Alert.alert("Error", "Failed to reset PIN");
            }
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    setPin('');
    setConfirmPin('');
    onClose(false);
    // Add small delay before navigation to ensure state updates
    setTimeout(() => {
      router.push("/(tabs)/home");
    }, 100);
  };

  const resetModal = () => {
    setPin('');
    setConfirmPin('');
    setAttempts(0);
  };

  useEffect(() => {
    if (isVisible) {
      resetModal();
    }
  }, [isVisible]);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>
            {mode === 'set' ? 'Set Security PIN' : 'Enter Security PIN'}
          </Text>
          
          <TextInput
            style={styles.input}
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            placeholder="Enter 4-digit PIN"
          />

          {mode === 'set' && (
            <TextInput
              style={styles.input}
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="Confirm PIN"
            />
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={mode === 'set' ? handleSetPin : handleVerifyPin}
            >
              <Text style={styles.buttonText}>
                {mode === 'set' ? 'Set PIN' : 'Verify'}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'verify' && (
            <Pressable onPress={handleForgotPin}>
              <Text style={styles.forgotPin}>Forgot PIN?</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Keep the semi-transparent background
  },
  // Remove blurContainer style
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 8,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  confirmButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  forgotPin: {
    color: '#007BFF',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  }
});

export default PinModal;