import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const PinSetup = () => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const router = useRouter();
  const { mode } = useLocalSearchParams();

  const handleSetPin = async () => {
    try {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        Alert.alert('Error', 'PIN must be 4 digits');
        return;
      }

      if (pin !== confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      await AsyncStorage.setItem(`securityPin_${userId}`, pin);
      Alert.alert(
        'Success', 
        mode === 'change' ? 'PIN changed successfully' : 'PIN set successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to set PIN');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'change' ? 'Change PIN' : 'Setup PIN'}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Enter New PIN</Text>
        <TextInput
          style={styles.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="Enter 4-digit PIN"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          placeholder="Confirm PIN"
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.button} onPress={handleSetPin}>
          <Text style={styles.buttonText}>
            {mode === 'change' ? 'Change PIN' : 'Set PIN'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PinSetup;