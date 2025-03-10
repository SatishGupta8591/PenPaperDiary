import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Register = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isUpdateMode = params.mode === 'updateMobile';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (isUpdateMode) {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const userName = await AsyncStorage.getItem('userName');
          const userEmail = await AsyncStorage.getItem('userEmail');
          const userMobile = await AsyncStorage.getItem(`userMobile_${userId}`);

          setName(userName || '');
          setEmail(userEmail || '');
          setPhoneNumber(userMobile || '');
        } catch (error) {
          console.error('Error loading user data:', error);
          Alert.alert('Error', 'Failed to load user data');
        }
      }
    };

    loadUserData();
  }, [isUpdateMode]);

  const handleSubmit = async () => {
    if (isUpdateMode) {
      try {
        if (!phoneNumber.trim()) {
          Alert.alert('Error', 'Please enter your mobile number');
          return;
        }

        if (!/^\d{10}$/.test(phoneNumber.trim())) {
          Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
          return;
        }

        setLoading(true);
        const userId = await AsyncStorage.getItem('userId');
        
        // Update in backend first
        await axios.patch('http://192.168.1.110:8000/users/update-mobile', {
          userId,
          phoneNumber: phoneNumber.trim()
        });

        // If backend update successful, update locally
        await AsyncStorage.setItem(`userMobile_${userId}`, phoneNumber.trim());

        Alert.alert(
          'Success', 
          'Mobile number updated successfully',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to update mobile number');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // Regular registration validation
      if (!name.trim() || !email.trim() || !password) {
        Alert.alert("Error", "Name, email and password are required");
        return;
      }

      if (phoneNumber && !/^\d{10}$/.test(phoneNumber.trim())) {
        Alert.alert("Error", "Please enter a valid 10-digit phone number or leave it empty");
        return;
      }

      setLoading(true);
      const response = await axios.post("http://192.168.1.110:8000/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phoneNumber: phoneNumber.trim() || undefined
      });

      if (response.data.status === 'success') {
        Alert.alert("Success", "Registration successful!");
        router.replace("/login");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isUpdateMode) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Mobile Number</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.userInfoSection}>
            <Text style={styles.sectionTitle}>Current Information</Text>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.userInfoText}>{name}</Text>
            </View>
            <View style={styles.userInfoItem}>
              <MaterialIcons name="email" size={20} color="#666" />
              <Text style={styles.userInfoText}>{email}</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Enter Mobile Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color="#666" style={styles.inputIcon} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus={true}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.updateButton,
              { opacity: loading ? 0.7 : 1 }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Mobile Number</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0066b2" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {isUpdateMode ? 'Update Mobile Number' : 'Register'}
        </Text>
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.formContainer}>
        {isUpdateMode ? (
          <>
            <Text style={styles.subtitle}>Current Information</Text>
            
            <View style={[styles.inputContainer, { backgroundColor: '#f8f8f8' }]}>
              <MaterialIcons name="person" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={name}
                style={[styles.input, { color: '#666' }]}
                editable={false}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: '#f8f8f8' }]}>
              <MaterialIcons name="email" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={email}
                style={[styles.input, { color: '#666' }]}
                editable={false}
              />
            </View>

            <Text style={[styles.subtitle, { marginTop: 20 }]}>Update Mobile Number</Text>
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Enter your name"
                editable={!isUpdateMode}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                editable={!isUpdateMode}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color="gray" style={styles.icon} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                placeholder="Enter your mobile number (optional)"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {isUpdateMode ? 'Update Mobile Number' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>

        {!isUpdateMode && (
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.loginText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 25,
    fontWeight: '600',
    color: '#0066b2',
  },
  formContainer: {
    padding: 20,
    marginTop: 30,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#0066b2',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: '#0066b2',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 20,
  },
  userInfoSection: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 5,
  },
  userInfoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#666',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  updateButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Register;
