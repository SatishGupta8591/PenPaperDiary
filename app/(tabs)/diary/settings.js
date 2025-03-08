import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import PinModal from '../../../components/PinModal';

const Settings = () => {
  const router = useRouter();
  const [isPinModalVisible, setPinModalVisible] = useState(false);

  const handleSetupLock = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const existingPin = await AsyncStorage.getItem(`securityPin_${userId}`);
      
      if (existingPin) {
        // Show PIN verification modal first
        setPinModalVisible(true);
      } else {
        // No existing PIN, go directly to PIN setup
        setPinModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check PIN status');
    }
  };

  const handleResetPin = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await AsyncStorage.removeItem(`securityPin_${userId}`);
      Alert.alert('Success', 'PIN has been reset successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to reset PIN');
    }
  };

  const handleRemoveSecurity = async () => {
    Alert.alert(
      'Remove Security',
      'Are you sure you want to remove security lock?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              await AsyncStorage.removeItem(`securityPin_${userId}`);
              Alert.alert('Success', 'Security lock removed successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove security lock');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.option} onPress={handleSetupLock}>
          <MaterialIcons name="security" size={24} color="#007BFF" />
          <Text style={styles.optionText}>Setup Security Lock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleResetPin}>
          <MaterialIcons name="lock-reset" size={24} color="#007BFF" />
          <Text style={styles.optionText}>Reset PIN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleRemoveSecurity}>
          <MaterialIcons name="no-encryption" size={24} color="#FF6B6B" />
          <Text style={[styles.optionText, { color: '#FF6B6B' }]}>Remove Security Lock</Text>
        </TouchableOpacity>
      </View>

      <PinModal
        isVisible={isPinModalVisible}
        mode="set"
        onClose={(success) => {
          setPinModalVisible(false);
          if (success) {
            Alert.alert('Success', 'PIN set successfully');
            router.back();
          }
        }}
      />
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
});

export default Settings;