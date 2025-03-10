import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, Image, Pressable } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MobilePrompt from '../../../components/MobilePrompt'; // Add this import

const Settings = () => {
  const router = useRouter();
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState("https://cdn-icons-png.flaticon.com/512/3177/3177440.png");
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [hasCheckedMobile, setHasCheckedMobile] = useState(false);

  useEffect(() => {
    checkMobileStatus();
  }, []);

  const checkMobileStatus = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const mobileNumber = await AsyncStorage.getItem(`userMobile_${userId}`);
      const hasShownPrompt = await AsyncStorage.getItem(`mobilePromptShown_${userId}`);
      
      if (!mobileNumber && !hasShownPrompt && !hasCheckedMobile) {
        setShowMobilePrompt(true);
        setHasCheckedMobile(true);
      }
    } catch (error) {
      console.error("Error checking mobile status:", error);
    }
  };

  const handleAddMobile = () => {
    setShowMobilePrompt(false);
    // Navigate to mobile number input screen
    router.push('/(tabs)/profile/add-mobile');
  };

  const handleLater = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      await AsyncStorage.setItem(`mobilePromptShown_${userId}`, 'true');
      setShowMobilePrompt(false);
    } catch (error) {
      console.error("Error handling later:", error);
    }
  };

  const handleProfileImageChange = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not found");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem(`userProfileImage_${userId}`, imageUri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const settingsOptions = [
    {
      id: 'profile',
      title: 'Change Profile Picture',
      icon: 'person-circle-outline',
      onPress: () => {
        setIsImageModalVisible(true); // This will show the existing image modal
        router.back(); // Go back to profile page
      }
    },
    {
      id: 'name',
      title: 'Change Name',
      icon: 'person-outline',
      onPress: () => {
        // Add name change navigation
      }
    },
    {
      id: 'email',
      title: 'Change Email',
      icon: 'mail-outline',
      onPress: () => {
        // Add email change navigation
      }
    },
    {
      id: 'password',
      title: 'Change Password',
      icon: 'lock-closed-outline',
      onPress: () => {
        // Add password change navigation
      }
    },
    {
      id: 'mobile',
      title: 'Add Mobile Number',
      icon: 'phone-portrait-outline',
      onPress: async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          const userData = {
            name: await AsyncStorage.getItem('userName'),
            email: await AsyncStorage.getItem('userEmail'),
            phoneNumber: await AsyncStorage.getItem(`userMobile_${userId}`) || '',
          };
          
          // Navigate to register page with existing user data
          router.push({
            pathname: '/(authenticate)/register',
            params: {
              mode: 'updateMobile',
              ...userData
            }
          });
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch user details');
        }
      }
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: async () => {
        try {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("userId");
          await AsyncStorage.removeItem("userName");
          router.replace("/(authenticate)/login");
        } catch (error) {
          Alert.alert("Error", "Failed to logout");
        }
      },
      danger: true
    }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={option.onPress}
          >
            <View style={styles.optionContent}>
              <Ionicons 
                name={option.icon} 
                size={24} 
                color={option.danger ? '#FF6B6B' : '#007BFF'} 
              />
              <Text style={[
                styles.optionText,
                option.danger && { color: '#FF6B6B' }
              ]}>
                {option.title}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={{ uri: profileImage }}
              style={styles.modalImage}
            />
            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalButton, { backgroundColor: '#FF6B6B' }]}
                onPress={async () => {
                  try {
                    const userId = await AsyncStorage.getItem("userId");
                    if (userId) {
                      await AsyncStorage.removeItem(`userProfileImage_${userId}`);
                      setProfileImage("https://cdn-icons-png.flaticon.com/512/3177/3177440.png");
                      setIsImageModalVisible(false);
                    }
                  } catch (error) {
                    Alert.alert("Error", "Failed to remove profile picture");
                  }
                }}
              >
                <Text style={styles.buttonText}>Remove Photo</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalButton, { backgroundColor: '#4ECDC4' }]}
                onPress={async () => {
                  await handleProfileImageChange();
                  setIsImageModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Change Photo</Text>
              </Pressable>
            </View>
            <Pressable 
              style={[styles.modalButton, { backgroundColor: '#95A5A6', marginTop: 10 }]}
              onPress={() => setIsImageModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <MobilePrompt 
        isVisible={showMobilePrompt}
        onClose={handleLater}
        onAddMobile={handleAddMobile}
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
    padding: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Settings;