import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Alert, ActivityIndicator, Image, ScrollView, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

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

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={['#0066b2', '#00a5ff']}
        style={styles.gradientBackground}
      >
        <Animatable.View 
          animation="fadeInDown" 
          duration={1500}
          style={styles.headerContainer}
        >
          <Image 
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
          />
          <Animatable.Text 
            animation="fadeIn"
            delay={500}
            style={styles.appTitle}
          >
            PenPaperDiary
          </Animatable.Text>
        </Animatable.View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <Animatable.View 
            animation="fadeInUpBig"
            duration={1000}
            style={styles.formContainer}
          >
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitleText}>Sign up to get started</Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={24} color="#0066b2" style={styles.inputIcon} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="#0066b2" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                style={styles.input}
                placeholderTextColor="#999"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="#0066b2" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                style={styles.input}
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={24} color="#0066b2" style={styles.inputIcon} />
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Mobile Number (Optional)"
                style={styles.input}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={['#0066b2', '#00a5ff']}
                style={styles.gradient}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => router.replace("/login")}
            >
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginHighlight}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
    tintColor: 'white',
  },
  appTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: 'white',
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
  },
  welcomeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: '#333',
    marginBottom: 8,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  registerButton: {
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  gradient: {
    padding: 13,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
  },
  loginHighlight: {
    color: '#0066b2',
    fontFamily: 'Poppins_600SemiBold',
  }
});

export default Register;
