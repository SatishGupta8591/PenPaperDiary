import { Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from "react";
import moment from "moment";
import { Calendar } from "react-native-calendars";
import axios from "axios";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';

const index = () => {
  const today = moment().format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(today);
  const [todos, setTodos] = useState([]);
  const [showCompleted, setShowCompleted] = useState(true); // State to toggle completed tasks visibility

  const fetchCompletedTodos = async () => {
    try {
      const response = await axios.get(
        `http://192.168.1.109:8000/todos/completed/${selectedDate}`
      );
      const completedTodos = response.data.completedTodos || [];
      setTodos(completedTodos);
    }
    catch (error) {
      console.log("error", error);
    }
  }

  useEffect(() => {
    fetchCompletedTodos();
  }, [selectedDate]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#7CB9E8" },
        }}
      />
      <View style={{ marginTop: 20 }} />
      <Pressable
        onPress={() => setShowCompleted(!showCompleted)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          marginVertical: 10,
          marginHorizontal: 10,
        }}
      >
        <Text>Completed Tasks</Text>
        <MaterialIcons name={showCompleted ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="black" />
      </Pressable>

      {showCompleted && todos?.map((item, index) => (
        <Pressable
          style={{
            backgroundColor: "#E0E0E0",
            padding: 10,
            borderRadius: 7,
            marginVertical: 5, // Reduced margin for better spacing
            marginHorizontal: 10,
          }}
          key={index}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FontAwesome name="circle" size={18} color="gray" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  textDecorationLine: "line-through",
                  color: "gray",
                }}
              >
                {item?.title}
              </Text>
              <Text style={{ color: "gray", fontSize: 12 }}>
                Completed at {moment(item?.createdAt).format("h:mm a")}
              </Text>
            </View>
            <Feather name="flag" size={20} color="gray" />
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default index;

const styles = StyleSheet.create({});

