import { Image, StyleSheet, Text, View, Dimensions, ActivityIndicator, Pressable, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const Index = () => {
  const router = useRouter();
  const [completedTasks, setCompletedTasks] = useState(null);
  const [pendingTasks, setPendingTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchUserDetails();
    fetchTasksData();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await axios.get("http://192.168.1.109:8000/user", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setUserName(response.data.name);
      }
    } catch (error) {
      console.log("Error fetching user details:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      router.replace('/(authenticate)/login');
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const fetchTasksData = async () => {
    try {
      const response = await axios.get("http://192.168.1.109:8000/todos/count");
      const { totalCompletedTasks, totalPendingTasks } = response.data;

      if (!isNaN(totalCompletedTasks) && !isNaN(totalPendingTasks)) {
        setCompletedTasks(totalCompletedTasks);
        setPendingTasks(totalPendingTasks);
      } else {
        console.log("Invalid API data received:", response.data);
        setCompletedTasks(0);
        setPendingTasks(0);
      }
    } catch (error) {
      console.log("Error fetching tasks data:", error);
      setCompletedTasks(0);
      setPendingTasks(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 10, flex: 1, backgroundColor: "white" }}>
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: 10 
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Image
            style={{ width: 60, height: 60, borderRadius: 30 }}
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
            }}
          />
          <View>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Welcome, {userName}</Text>
            <Text style={{ fontSize: 15, color: "gray", marginTop: 4 }}>Select Categories</Text>
          </View>
        </View>
        
        <Pressable onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF6347" />
        </Pressable>
      </View>

      {/* Tasks Overview */}
      <View style={{ marginVertical: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Tasks Overview</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#007BFF" style={{ marginVertical: 20 }} />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 8 }}>
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

      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image
          style={styles.taskImage}
          source={{
            uri: "https://cdn-icons-png.flaticon.com/128/9537/9537221.png",
          }}
        />
      </View>
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
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  taskImage: {
    width: 120,
    height: 120,
  },
});
