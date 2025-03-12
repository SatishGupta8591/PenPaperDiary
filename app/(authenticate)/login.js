import {
  StyleSheet,
  Pressable,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  Alert,
  Animated,
  Image,
  TouchableOpacity,
  ScrollView
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Poppins_600SemiBold, Poppins_400Regular } from '@expo-google-fonts/poppins';

axios.interceptors.request.use(request => {
  console.log('Request:', JSON.stringify(request, null, 2));
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response;
  },
  error => {
    console.log('Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_400Regular
  });

  const logoAnim = new Animated.Value(0);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const userId = await AsyncStorage.getItem("userId"); // Get userId
          if (userId) {
            router.replace("/(tabs)/home");
          } else {
            router.replace("/(authenticate)/login"); // If no userId, go to login
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    checkLoginStatus();

    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Error", "Please enter both email and password");
        return;
      }

      setLoading(true);
      const response = await axios.post("http://192.168.1.110:8000/login", {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.data.token && response.data.userId && response.data.name) {
        try {
          await AsyncStorage.multiSet([
            ["authToken", response.data.token],
            ["userId", response.data.userId.toString()],
            ["userName", response.data.name || ""],
          ]);
          router.replace("/(tabs)/home");
        } catch (storageError) {
          console.error("Storage error:", storageError);
          Alert.alert("Error", "Failed to save login data");
        }
      } else {
        Alert.alert("Error", "Invalid credentials received from server");
      }
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Invalid credentials");
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
        colors={['#007bff', '#00a5ff']}
        style={styles.gradientBackground}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
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

          <Animatable.View 
            animation="fadeInUpBig"
            duration={1000}
            style={styles.formContainer}
          >
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue</Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color="#007bff" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={24} color="#007bff" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <LinearGradient
                colors={['#007bff', '#00a5ff']}
                style={styles.gradient}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => router.replace("/register")}
            >
              <Text style={styles.registerText}>
                New here? <Text style={styles.registerHighlight}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    tintColor: 'white', // This will make logo white for better visibility
  },
  appTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 28,
    color: 'white',
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  welcomeText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  subtitleText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  gradient: {
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
  },
  registerLink: {
    marginTop: 30,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
  },
  registerHighlight: {
    color: '#007bff',
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%'
  }
});
