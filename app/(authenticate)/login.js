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
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  const renderLoginButton = () => (
    <Pressable
      onPress={handleLogin}
      disabled={loading}
      style={{
        width: 200,
        backgroundColor: loading ? "#cccccc" : "#6699CC",
        padding: 15,
        borderRadius: 6,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: 16,
        }}
      >
        {loading ? "Logging in..." : "Login"}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}
    >
      <View style={{ marginTop: 100 }}>
        <Text style={{ fontSize: 25, fontWeight: "00", color: "#0066b2" }}>
          PenPaperDiary
        </Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 30 }}>
            Log in to your account
          </Text>
        </View>
        <View style={{ marginTop: 70 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#E0E0E0",
              paddingVertical: 5,
              borderRadius: 5,
              marginTop: 30,
            }}
          >
            <MaterialIcons
              style={{ marginLeft: 8 }}
              name="email"
              size={24}
              color="gray"
            />
            <TextInput
              value={email}
              onChangeText={(text) => setEmail(text)}
              style={{
                color: "gray",
                marginVertical: 1,
                width: 300,
                fontSize: email ? 17 : 17,
              }}
              placeholder="Enter your email"
            ></TextInput>
          </View>
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#E0E0E0",
                paddingVertical: 5,
                borderRadius: 5,
                marginTop: 30,
              }}
            >
              <AntDesign
                style={{ marginLeft: 8 }}
                name="lock"
                size={24}
                color="gray"
              />
              <TextInput
                value={password}
                secureTextEntry={true}
                onChangeText={(text) => setPassword(text)}
                style={{
                  color: "gray",
                  marginVertical: 1,
                  width: 300,
                  fontSize: email ? 17 : 17,
                }}
                placeholder="Enter your Password"
              ></TextInput>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              justifyContent: "space-between",
            }}
          >
            <Text>Keep me logged in</Text>
            <Text style={{ color: "#007FFF", fontWeight: "500" }}>
              Forgot Password
            </Text>
          </View>
          <View style={{ marginTop: 60 }} />
          {renderLoginButton()}
          <Pressable
            onPress={() => router.replace("/register")}
            style={{ marginTop: 15 }}
          >
            <Text style={{ textAlign: "center", fontSize: 15, color: "gray" }}>
              Don't have an account? Sign up
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({});
