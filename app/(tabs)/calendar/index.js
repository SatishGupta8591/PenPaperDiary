import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import React, { useState, useEffect } from "react";
import moment from "moment";
import { Calendar } from "react-native-calendars";
import axios from "axios";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router'; // Import useRouter
import AsyncStorage from '@react-native-async-storage/async-storage';

const index = () => {
  const today = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);
  const [todos, setTodos] = useState([]);
  const [diaryEntries, setDiaryEntries] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true); // State to toggle completed tasks visibility
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // Initialize useRouter
  const [showDiaryEntries, setShowDiaryEntries] = useState(false); // Add this state

  const fetchCompletedTodos = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log("No userId found");
        return;
      }

      // Updated API endpoint
      const response = await axios.get(
        `http://192.168.1.110:8000/todos/${userId}/completed`,
        {
          params: { date: selectedDate }
        }
      );

      if (response.data && response.data.completedTodos) {
        setTodos(response.data.completedTodos);
      } else {
        setTodos([]);
      }
    }
    catch (error) {
      console.log("error fetching completed todos:", error);
      setTodos([]);
    }
  };

  const fetchDiaryEntries = async (date) => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log("No userId found");
        return;
      }

      const response = await axios.get(
        `http://192.168.1.110:8000/diary/${userId}?date=${date}`
      );
      
      // Filter entries to only show entries for the exact selected date
      const filteredEntries = response.data.diaries.filter(entry => 
        moment(entry.date).format('YYYY-MM-DD') === date
      );
      
      setDiaryEntries(filteredEntries || []);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      setDiaryEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTodos();
    fetchDiaryEntries(selectedDate);
  }, [selectedDate]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    setShowDiaryEntries(false); // Hide entries when new date is selected
  };

  const handleViewDiaryEntries = async () => {
    setShowDiaryEntries(true);
    await fetchDiaryEntries(selectedDate);
  };

  const handleCompletedTasksPress = async () => {
    setShowCompleted(!showCompleted);
    if (!showCompleted) { // Only fetch if we're showing the tasks
      await fetchCompletedTodos();
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#7CB9E8" },
        }}
      />
      
      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleCompletedTasksPress}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Completed Tasks</Text>
          <MaterialIcons 
            name={showCompleted ? "arrow-drop-up" : "arrow-drop-down"} 
            size={24} 
            color="white" 
          />
        </Pressable>

        <Pressable
          onPress={handleViewDiaryEntries}
          style={styles.button}
        >
          <Text style={styles.buttonText}>View Diary Entries</Text>
        </Pressable>
      </View>

      {showCompleted && (
        <View style={styles.sectionContainer}>
          {todos?.map((item, index) => (
            <Pressable
              style={styles.taskItem}
              key={index}
            >
              <View style={styles.taskContent}>
                <FontAwesome name="circle" size={18} color="gray" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>
                    {item?.title}
                  </Text>
                  <Text style={styles.taskTime}>
                    Completed at {moment(item?.createdAt).format("h:mm a")}
                  </Text>
                </View>
                <Feather name="flag" size={20} color="gray" />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {showDiaryEntries && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            Diary Entries for {moment(selectedDate).format('MMMM D, YYYY')}
          </Text>
          
          {loading ? (
            <Text style={styles.messageText}>Loading entries...</Text>
          ) : diaryEntries.length > 0 ? (
            diaryEntries.map((entry, index) => (
              <View key={index} style={styles.diaryEntry}>
                <Text style={styles.diaryTitle}>{entry.title}</Text>
                <Text style={styles.diaryContent} numberOfLines={2}>
                  {entry.content}
                </Text>
                <Text style={styles.diaryCategory}>{entry.category}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.messageText}>
              No diary entries found for {moment(selectedDate).format('MMMM D, YYYY')}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default index;

const styles = StyleSheet.create({
  sectionContainer: {
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  diaryEntry: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007BFF',
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  diaryContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  diaryCategory: {
    fontSize: 12,
    color: '#007BFF',
    fontWeight: '500',
  },
  messageText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  completedTasksSection: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  completedTasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  taskItem: {
    backgroundColor: '#E0E0E0',
    padding: 10,
    borderRadius: 7,
    marginBottom: 8,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskTitle: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  taskTime: {
    color: 'gray',
    fontSize: 12,
  },
  buttonContainer: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '45%', // This ensures both buttons have same width
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

