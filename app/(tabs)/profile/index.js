import {
  Image,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicator,
  Pressable,
  Alert,
  ScrollView, // Import ScrollView
  RefreshControl, // Import RefreshControl
  Modal, // Import Modal
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import moment from 'moment';

const Index = () => {
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState(null);
  const [pendingTasks, setPendingTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [refreshing, setRefreshing] = useState(false); // State for refresh control
  const [profileImage, setProfileImage] = useState("https://cdn-icons-png.flaticon.com/512/3177/3177440.png");
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(false);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    fetchUserDetails();
    fetchTasksData();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        const response = await axios.get("http://192.168.1.110:8000/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserName(response.data.name);
      }
    } catch (error) {
      console.log("Error fetching user details:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userId"); // Also remove userId
      await AsyncStorage.removeItem("userName"); // Also remove userName
      setCompletedTasks(null); // Reset completedTasks
      setPendingTasks(null); // Reset pendingTasks
      setUserName(""); // Reset userName
      router.replace("/(authenticate)/login");
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const fetchTasksData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.log("No userId found");
        return;
      }

      // Fetch task counts with proper error handling
      const countResponse = await axios.get(
        `http://192.168.1.110:8000/todos/count`,
        {
          params: { userId }
        }
      );

      // Fetch only pending tasks
      const tasksResponse = await axios.get(
        `http://192.168.1.110:8000/users/${userId}/todos`,
        {
          params: { status: 'pending' }
        }
      );

      setUpcomingTasks(tasksResponse.data.todos || []);
      
      const { totalCompletedTodos, totalPendingTodos } = countResponse.data;
      setCompletedTasks(totalCompletedTodos);
      setPendingTasks(totalPendingTodos);

    } catch (error) {
      console.error("Error fetching tasks data:", error);
      setUpcomingTasks([]);
      setCompletedTasks(0);
      setPendingTasks(0);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDetails();
    fetchTasksData()
      .then(() => setRefreshing(false));
  }, []);

  const addTodo = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        console.log("No userId available");
        return;
      }

      const todoData = {
        title: todo,
        category: category,
        userId: userId // Add userId when creating todo
      };

      const response = await axios.post(
        `http://192.168.1.110:8000/todos/${userId}`,
        todoData
      );

      if (response.data) {
        await getUserTodos(userId);
        setModalVisible(false);
        setTodo("");
      }
    } catch (error) {
      console.log("Error adding todo:", error.response?.data || error.message);
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
        // Save with user ID as part of the key
        await AsyncStorage.setItem(`userProfileImage_${userId}`, imageUri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          const savedImage = await AsyncStorage.getItem(`userProfileImage_${userId}`);
          if (savedImage) {
            setProfileImage(savedImage);
          } else {
            setProfileImage("https://cdn-icons-png.flaticon.com/512/3177/3177440.png");
          }
        }
      } catch (error) {
        console.log("Error loading profile image:", error);
        setProfileImage("https://cdn-icons-png.flaticon.com/512/3177/3177440.png");
      }
    };
    loadProfileImage();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library to change profile picture.');
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        contentContainerStyle={{ padding: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Profile Section */}
        <View style={[styles.profileSection, { marginBottom: 10 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Pressable onPress={() => setIsImageModalVisible(true)}>
                <View style={styles.profileImageContainer}>
                  <Image
                    style={styles.profileImage}
                    source={{ uri: profileImage }}
                  />
                </View>
              </Pressable>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "600" }}>
                  Welcome, {userName}
                </Text>
                <Text style={{ fontSize: 15, color: "gray", marginTop: 4 }}>
                  Select Categories
                </Text>
              </View>
            </View>

            <Pressable onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color="#FF6347" />
            </Pressable>
          </View>
        </View>

        {/* Tasks Overview */}
        <View style={{ marginVertical: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Tasks Overview</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007BFF"
              style={{ marginVertical: 20 }}
            />
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginVertical: 8,
              }}
            >
              {/* Completed Tasks */}
              <View style={styles.taskBox}>
                <Text style={styles.taskCount}>{completedTasks}</Text>
                <Text style={styles.taskLabel}>Completed Tasks</Text>
              </View>

              {/* Pending Tasks */}
              <View style={styles.taskBox}>
                <Text style={styles.taskCount}>{pendingTasks}</Text>
                <Text style={styles.taskLabel}>Pending Tasks</Text>
              </View>
            </View>
          )}
        </View>

        {/* Line Chart - Show only when data is available */}
        {!loading && completedTasks !== null && pendingTasks !== null && (
          <LineChart
            data={{
              labels: ["Pending Tasks", "Completed Tasks"],
              datasets: [
                {
                  data: [
                    isNaN(pendingTasks) ? 0 : pendingTasks,
                    isNaN(completedTasks) ? 0 : completedTasks,
                  ],
                },
              ],
            }}
            width={Dimensions.get("window").width - 20}
            height={220}
            yAxisInterval={2}
            chartConfig={{
              backgroundColor: "#e26a00",
              backgroundGradientFrom: "#fb8c00",
              backgroundGradientTo: "#ffa726",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#ffa726",
              },
            }}
            bezier
            style={{ borderRadius: 16 }}
          />
        )}

        {/* Tasks for the Next Seven Days */}
        <View style={styles.taskReminderBox}>
          <Text style={{ textAlign: "center", color: "white", fontSize: 16 }}>
            Tasks for the next seven days
          </Text>
        </View>

        {/* Add this new section for pending tasks */}
        <View style={styles.pendingTasksContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#007BFF" />
          ) : pendingTasks > 0 ? (
            <View style={styles.tasksList}>
              <Pressable 
                onPress={() => setExpandedTasks(!expandedTasks)}
                style={styles.tasksHeader}
              >
                <View style={styles.headerLeft}>
                  <MaterialIcons name="pending-actions" size={24} color="#FF9500" />
                  <Text style={styles.pendingTasksTitle}>Upcoming Tasks ({pendingTasks})</Text>
                </View>
                <MaterialIcons 
                  name={expandedTasks ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#343a40" 
                />
              </Pressable>
              
              {expandedTasks && (
                <View style={styles.expandedTasksWrapper}>
                  <ScrollView 
                    style={styles.expandedTasksContainer}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {upcomingTasks.map((task, index) => (
                      <View key={task._id} style={styles.taskItem}>
                        <View style={styles.taskItemLeft}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskCategory}>{task.category}</Text>
                        </View>
                        <Text style={styles.taskDate}>
                          {moment(task.dueDate).format('MMM DD')}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noTasksContainer}>
              <Text style={styles.noTasksText}>No pending tasks</Text>
            </View>
          )}
        </View>

        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.taskImage}
            source={{
              uri: "https://cdn-icons-png.flaticon.com/128/9537/9537221.png",
            }}
          />
        </View>
      </ScrollView>
      {/* Keep the Modal outside ScrollView */}
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
                    console.log("Error removing profile image:", error);
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
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  taskBox: {
    backgroundColor: "#89CFF0",
    padding: 15,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  taskCount: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  taskLabel: {
    marginTop: 4,
    fontSize: 14,
  },
  taskReminderBox: {
    backgroundColor: "#89CFF0",
    padding: 10,
    borderRadius: 6,
    marginTop: 15,
  },
  pendingTasksContainer: {
    marginVertical: 15, // Change marginTop to marginVertical
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tasksList: {
    gap: 10,
  },
  pendingTasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 10,
  },
  taskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  taskIndicatorText: {
    fontSize: 14,
    color: '#495057',
  },
  noTasksContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noTasksText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20, // Change marginTop to marginVertical
    paddingBottom: 20, // Add padding at bottom for better scrolling
  },
  taskImage: {
    width: 120,
    height: 120,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
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
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expandedTasksWrapper: {
    height: 300, // Fixed height for the container
    marginTop: 10,
    marginBottom: 10,
  },
  expandedTasksContainer: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
    marginBottom: 8,
  },
  taskItemLeft: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#343a40',
  },
  taskCategory: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  taskDate: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: '500',
  },
  profileSection: {
   // padding: 10,
    //backgroundColor: 'white',
   // borderRadius: 10,
   // borderWidth: 1,
   // borderColor: '#e9ecef',
  //  elevation: 2,
  },
});
