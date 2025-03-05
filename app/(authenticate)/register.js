import {
  StyleSheet,
  Pressable,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  TextInput,
  Alert,
} from "react-native";
import React from "react";
import { useState, useEffect } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import axios from "axios";

axios.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});

const register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleRegister = async () => {
    try {
      setLoading(true);
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      };
  
      const response = await axios.post("http://192.168.1.110:8000/register", userData);
      
      if (response.data) {
        Alert.alert("Success", "Registration successful!");
        router.replace("/login");
      }
  
    } catch (error) {
      // Different error types
      if (!error.response) {
        // Network error
        Alert.alert("Error", "Network connection failed. Please check your internet.");
      } 
      else if (error.response.status === 400) {
        // Validation error
        Alert.alert("Registration Failed", error.response.data.message || "Invalid input data");
      }
      else if (error.response.status === 500) {
        // Server error
        Alert.alert("Error", "Server error occurred. Please try again later.");
      }
      else {
        // Generic error
        Alert.alert("Registration Failed", "An unexpected error occurred");
      }
      console.log("Error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}
    >
      <View style={{ marginTop: 100 }}>
        <Text style={{ fontSize: 25, fontWeight: "00", color: "#0066b2" }}>
          PenPaperDiary
        </Text>
      </View>
      <KeyboardAvoidingView>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 30 }}>
            Register to your account
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
            <Ionicons
              style={{ marginLeft: 8 }}
              name="person"
              size={24}
              color="gray"
            />
            <TextInput
              value={name}
              onChangeText={(text) => setName(text)}
              style={{
                color: "gray",
                marginVertical: 1,
                width: 300,
                fontSize: email ? 17 : 17,
              }}
              placeholder="Enter your Name"
            ></TextInput>
          </View>
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

          <View style={{ marginTop: 60 }} />

          <Pressable
            onPress={handleRegister}
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
              {loading ? "Registering..." : "Register"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace("/login")}
            style={{ marginTop: 15 }}
          >
            <Text style={{ textAlign: "center", fontSize: 15, color: "gray" }}>
              Already have an account? Sign Up
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default register;

const styles = StyleSheet.create({});
