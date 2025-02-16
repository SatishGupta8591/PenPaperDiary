import { StyleSheet, Text, View, Pressable, TextInput, FlatList, Alert, ScrollView, Modal } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { useRouter, useLocalSearchParams } from "expo-router";
import axios from 'axios';

const Info = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchSubtasks();
  }, []);

  const fetchSubtasks = async () => {
    try {
      console.log("Fetching subtasks for todo:", params.id); // Debug log

      const response = await axios.get(`http://192.168.1.109:8000/todos/${params.id}`);
      
      console.log("Fetched todo data:", response.data); // Debug log

      setSubtasks(response.data.subtasks || []);
    } catch (error) {
      console.error("Error fetching subtasks:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        "Failed to fetch subtasks. Please try again."
      );
    }
  };

  const addSubtask = async () => {
    try {
      if (!newSubtask.trim()) {
        Alert.alert("Error", "Please enter a subtask");
        return;
      }

      console.log("Adding subtask:", { todoId: params.id, title: newSubtask }); // Debug log

      const response = await axios.post(
        `http://192.168.1.109:8000/todos/${params.id}/subtasks`,
        {
          title: newSubtask.trim()
        }
      );

      console.log("Server response:", response.data); // Debug log

      if (response.data.todo && response.data.todo.subtasks) {
        setSubtasks(response.data.todo.subtasks);
        setNewSubtask("");
      }
    } catch (error) {
      console.error("Error adding subtask:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        "Failed to add subtask. Please try again."
      );
    }
  };

  const markSubtaskAsCompleted = async (subtaskId) => {
    try {
      const response = await axios.patch(
        `http://192.168.1.109:8000/todos/${params.id}/subtasks/${subtaskId}/complete`
      );
      console.log("Subtask marked as completed:", response.data);
      fetchSubtasks();
    } catch (error) {
      console.error("Error marking subtask as completed:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        "Failed to mark subtask as completed. Please try again."
      );
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      const response = await axios.delete(
        `http://192.168.1.109:8000/todos/${params.id}/subtasks/${subtaskId}`
      );
      console.log("Subtask deleted:", response.data);
      fetchSubtasks();
    } catch (error) {
      console.error("Error deleting subtask:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        "Failed to delete subtask. Please try again."
      );
    }
  };

  const editSubtask = async (subtaskId, newTitle) => {
    try {
      const response = await axios.patch(
        `http://192.168.1.109:8000/todos/${params.id}/subtasks/${subtaskId}`,
        { title: newTitle }
      );
      console.log("Subtask edited:", response.data);
      fetchSubtasks();
    } catch (error) {
      console.error("Error editing subtask:", error.response?.data || error.message);
      Alert.alert(
        "Error",
        "Failed to edit subtask. Please try again."
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "white", padding: 10 }}>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Ionicons name="arrow-back-outline" size={24} color="black" onPress={() => router.back()} />
        <Pressable onPress={() => setOptionsModalVisible(true)} ref={popoverRef}>
          <Entypo name="dots-three-vertical" size={24} color="black" />
        </Pressable>
      </View>
      <View style={{ marginTop: 5 }}>
        <Text style={{ fontSize: 15, fontWeight: "500" }}>
          Category  - {params?.category}
        </Text>
      </View>
      <Text style={{ marginTop: 20, fontSize: 17, fontWeight: "600" }}>
        {params?.title}
      </Text>
      <View style={{ marginTop: 50 }} />

      {/* Add SubTask Section */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <AntDesign name="plus" size={24} color="#7CB9E8" />
        <Text style={{ color: "#7CB9E8", fontSize: 16, fontWeight: "500" }}>
          Add a SubTask
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <TextInput
          style={styles.subtaskInput}
          placeholder="Enter subtask"
          value={newSubtask}
          onChangeText={setNewSubtask}
        />
        <Pressable onPress={addSubtask}>
          <Ionicons name="send-outline" size={24} color="black" />
        </Pressable>
      </View>

      {/* Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isOptionsModalVisible}
        onRequestClose={() => {
          setOptionsModalVisible(!isOptionsModalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setOptionsModalVisible(false);
                // Handle Due Date press
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AntDesign name="calendar" size={24} color="black" />
                <Text style={styles.textStyle}>Due Date</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setOptionsModalVisible(false);
                // Handle Time and Remainder press
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="time-sharp" size={24} color="gray" />
                <Text style={styles.textStyle}>Time and Remainder</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setOptionsModalVisible(false);
                // Handle Repeat Task press
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name="repeat" size={24} color="black" />
                <Text style={styles.textStyle}>Repeat Task</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setOptionsModalVisible(false);
                // Handle Notes press
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <SimpleLineIcons name="note" size={24} color="black" />
                <Text style={styles.textStyle}>Notes</Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.modalOption, styles.buttonClose]}
              onPress={() => setOptionsModalVisible(!isOptionsModalVisible)}
            >
              <Text style={styles.textStyle}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Subtasks Section */}
      <View style={{ marginTop: 15 }}>
        <Text style={{ fontSize: 17, fontWeight: "600" }}>Subtasks</Text>
        {subtasks
          .filter((subtask) => !subtask.completed)
          .map((item) => (
            <View style={styles.subtaskItem} key={item._id}>
              <Text style={styles.subtaskTitle}>{item.title}</Text>
              <View style={styles.subtaskActions}>
                <Pressable onPress={() => markSubtaskAsCompleted(item._id)}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="black" />
                </Pressable>
                <Pressable onPress={() => editSubtask(item._id, "New Title")}>
                  <Feather name="edit" size={24} color="black" />
                </Pressable>
                <Pressable onPress={() => deleteSubtask(item._id)}>
                  <EvilIcons name="trash" size={24} color="black" />
                </Pressable>
              </View>
            </View>
          ))}
      </View>

      {/* Completed Subtasks Section */}
      <View style={{ marginTop: 15 }}>
        <Pressable
          onPress={() => setShowCompleted(!showCompleted)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            marginVertical: 10,
          }}>
          <Text>Completed Subtasks</Text>
          <MaterialIcons name={showCompleted ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="black" />
        </Pressable>

        {showCompleted &&
          subtasks
            .filter((subtask) => subtask.completed)
            .map((item) => (
              <View style={styles.subtaskItem} key={item._id}>
                <Text style={[styles.subtaskTitle, { textDecorationLine: 'line-through', color: 'gray' }]}>{item.title}</Text>
                <View style={styles.subtaskActions}>
                  <Pressable onPress={() => deleteSubtask(item._id)}>
                    <EvilIcons name="trash" size={24} color="black" />
                  </Pressable>
                </View>
              </View>
            ))}
      </View>
    </ScrollView>
  );
};

export default Info;

const styles = StyleSheet.create({
  subtaskInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    flex: 1,
  },
  subtaskItem: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtaskTitle: {
    fontSize: 16,
  },
  subtaskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginTop: 0,
    paddingTop: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    marginTop: 30,
    marginRight: 20,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOption: {
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  buttonClose: {
    backgroundColor: "transparent",
  },
  textStyle: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center"
  },
});