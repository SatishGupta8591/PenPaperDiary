import { StyleSheet, Text, View, Pressable, ScrollView, Image, TextInput, Alert, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { BottomModal } from "react-native-modals";
import { ModalTitle, ModalContent } from "react-native-modals";
import { SlideAnimation } from "react-native-modals";
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import moment from "moment";
import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();
  const [todos, setTodos] = useState([]);
  const today = moment().format("MMM Do ");
  const [pendingTodos, setPendingTodos] = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [marked, setMarked] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState("All");
  const [todo, setTodo] = useState("");
  const [showCompleted, setShowCompleted] = useState(true); // State to toggle completed tasks visibility
  const [userId, setUserId] = useState(null);
  const [customCategory, setCustomCategory] = useState(""); // State for custom category input
  const [categories, setCategories] = useState(["All", "Work", "Personal", "Wishlist"]); // State for categories
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false); // State for category modal visibility
  const [isEditCategoryModalVisible, setEditCategoryModalVisible] = useState(false); // State for edit category modal visibility
  const [categoryToEdit, setCategoryToEdit] = useState(""); // State for category to edit

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem("userId");
      if (id) {
        setUserId(id);
        getUserTodos(id); // Fetch todos for the user
      }
    };
    getUserId();
  }, []);

  const suggestions = [
    {
      id: "0",
      todo: "Drink Water, keep healthy",
    },
    {
      id: "1",
      todo: "Go Excercising",
    },
    {
      id: "2",
      todo: "Go to bed early",
    },
    {
      id: "3",
      todo: "Take pill reminder",
    },
    {
      id: "4",
      todo: "Go Shopping",
    },
    {
      id: "5",
      todo: "finish assignments",
    },
  ];

  const addTodo = async () => {
    if (!todo.trim()) return;
  
    try {
      const todoData = {
        title: todo.trim(),
        category: category,
      };
      
      setModalVisible(false); // Close modal first for better UX
      const tempTodo = todo; // Store todo temporarily
      setTodo(""); // Clear input immediately
      
      await axios.post(`http://192.168.1.110:8000/todos/${userId}`, todoData);
      await getUserTodos(userId);
    } catch (error) {
      console.error("Error adding todo:", error);
      Alert.alert("Error", "Failed to add todo");
      setTodo(tempTodo); // Restore todo text if failed
    }
  };

  const getUserTodos = async (id) => {
    try {
      const response = await axios.get(
        `http://192.168.1.110:8000/users/${id}/todos`
      );
      console.log(response.data.todos);
      setTodos(response.data.todos);

      const fetchedTodos = response.data.todos || [];
      const pending = fetchedTodos.filter(
        (todo) => todo.status !== "completed"
      );
      const completed = fetchedTodos.filter(
        (todo) => todo.status === "completed"
      );
      setPendingTodos(pending);
      setCompletedTodos(completed);
    } catch (error) {
      console.log("error", error);
    }
  };

  const markTodoAsCompleted = async (todoId) => {
    try {
      const completedAt = new Date().toISOString(); // Create ISO string for consistent date format
      const response = await axios.patch(
        `http://192.168.1.110:8000/todos/${todoId}/complete`,
        { 
          status: "completed",
          completedAt: completedAt
        }
      );
      console.log("Todo completed:", response.data);
      await getUserTodos(userId); // Refresh todos list after completion
    } catch (error) {
      console.error("Error completing todo:", error);
    }
  };

  const deleteTodo = async (todoId) => {
    try {
      const response = await axios.delete(
        `http://192.168.1.110:8000/todos/${todoId}`
      );
      console.log(response.data);
      await getUserTodos(userId); // Refresh the todos list
    } catch (error) {
      console.log("error", error);
    }
  };

  const addCategory = () => {
    if (customCategory.trim()) {
      setCategories([...categories, customCategory]);
      setCustomCategory("");
      setCategoryModalVisible(false);
    }
  };

  const deleteCategory = (categoryToDelete) => {
    setCategories(categories.filter(cat => cat !== categoryToDelete));
  };

  const editCategory = () => {
    if (categoryToEdit.trim()) {
      setCategories(categories.map(cat => cat === categoryToEdit ? customCategory : cat));
      setCustomCategory("");
      setEditCategoryModalVisible(false);
    }
  };

  const handleLongPress = (cat) => {
    Alert.alert(
      "Edit or Delete Category",
      `What would you like to do with the category "${cat}"?`,
      [
        {
          text: "Edit",
          onPress: () => {
            setCategoryToEdit(cat);
            setEditCategoryModalVisible(true);
          },
        },
        {
          text: "Delete",
          onPress: () => deleteCategory(cat),
          style: "destructive",
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const revertTodoToPending = async (todoId) => {
    try {
      const response = await axios.patch(
        `http://192.168.1.110:8000/todos/${todoId}/revert`
      );
      console.log("Todo reverted:", response.data);
      await getUserTodos(userId); // Refresh the todos list
    } catch (error) {
      console.error("Error reverting todo:", error);
      Alert.alert("Error", "Failed to revert todo");
    }
  };

  console.log("completed", completedTodos);
  console.log("pending", pendingTodos);

  return (
    <>
      <Text style={{ color: "#007FFF", fontSize: 20, fontWeight: "bold", textAlign: "left", 
        marginLeft: 10, marginTop:3 }}>
        PenPaperDiary
      </Text>
      <View style={{
        marginHorizontal: 10,
        marginVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat, index) => (
            <Pressable
              key={index}
              style={{
                backgroundColor: "#7CB9E8",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,
              }}
              onPress={() => setCategory(cat)}
            >
              <Text style={{ color: "white", textAlign: "center" }}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable onPress={() => setModalVisible(!isModalVisible)}>
          <AntDesign name="pluscircle" size={30} color="#007FFF" />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: "white" }}>
        <View style={{ padding: 10 }}>
          {todos?.length > 0 ? (
            <View>
              {pendingTodos?.length > 0 && <Text>Tasks to Do ! {today}</Text>}

              {pendingTodos?.map((item, index) => (
                <Pressable
                  onPress={() => {
                    router?.push({
                      pathname: "/home/info",
                      params: {
                        id: item._id,
                        title: item?.title,
                        category: item?.category,
                        createdAt: item?.createdAt,
                        dueDate: item?.dueDate,
                      },
                    });
                  }}
                  style={{
                    backgroundColor: "#E0E0E0",
                    padding: 10,
                    borderRadius: 7,
                    marginVertical: 10,
                  }}
                  key={index}>
                  <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}>
                    <Entypo
                      onPress={() => markTodoAsCompleted(item?._id)}
                      name="circle" size={18} color="black" />
                    <View style={{ flex: 1 }}>
                      <Text>{item?.title}</Text>
                      <Text style={{
                        color: "gray",
                        fontSize: 12,
                      }}>Added on {moment(item?.createdAt).format("MMM Do, h:mm a")}</Text>
                    </View>
                    <Feather name="flag" size={20} color="black" />
                    <EvilIcons name="trash" size={24} color="black" onPress={() => deleteTodo(item?._id)} />
                  </View>
                </Pressable>
              ))}

              {completedTodos?.length > 0 && (
                <View>
                  <View style={{
                    justifyContent: "center",
                    alignItems: "center",
                    margin: 10,
                  }}
                  >
                    <Image
                      style={{ width: 100, height: 100 }}
                      source={{
                        uri: "https://cdn-icons-png.flaticon.com/128/6784/6784655.png",
                      }}
                    />
                  </View>
                  <Pressable
                    onPress={() => setShowCompleted(!showCompleted)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginVertical: 10,
                    }}>
                    <Text>Completed Tasks</Text>
                    <MaterialIcons name={showCompleted ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="black" />
                  </Pressable>

                  {showCompleted && completedTodos?.map((item, index) => (
                    <Pressable 
                      style={{
                        backgroundColor: "#E0E0E0",
                        padding: 10,
                        borderRadius: 7,
                        marginVertical: 10,
                      }}
                      key={index}
                    >
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}>
                        <FontAwesome 
                          name="circle" 
                          size={18} 
                          color="gray"
                          onPress={() => {
                            Alert.alert(
                              "Revert Todo",
                              "Do you want to mark this task as pending?",
                              [
                                {
                                  text: "Cancel",
                                  style: "cancel"
                                },
                                {
                                  text: "Yes",
                                  onPress: () => revertTodoToPending(item._id)
                                }
                              ]
                            );
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            textDecorationLine: "line-through",
                            color: "gray",
                          }}>{item?.title}</Text>
                          <Text style={{
                            color: "gray",
                            fontSize: 12,
                          }}>
                            {item?.completedAt 
                              ? `Completed on ${moment(item.completedAt).format("MMM Do, h:mm a")}`
                              : "Completion date unknown"}
                          </Text>
                        </View>
                        <Feather name="flag" size={20} color="black" />
                        <EvilIcons name="trash" size={30} color="black" onPress={() => deleteTodo(item?._id)} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 130,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              <Image
                style={{ width: 200, height: 200, resizeMode: "contain" }}
                source={{
                  uri: "https://cdn-icons-png.flaticon.com/128/2387/2387679.png",
                }}
              />
              <Text style={{
                fontSize: 16,
                marginTop: 15,
                fontWeight: "600",
                textAlign: "center",
              }}>
                No Tasks for today ! add a task
              </Text>
              <Pressable onPress={() => setModalVisible(!isModalVisible)}
                style={{ marginTop: 15 }}>
                <AntDesign name="pluscircle" size={30} color="#007FFF" />
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomModal
        onBackdropPress={() => setModalVisible(!isModalVisible)}
        onHardwareBackPress={() => setModalVisible(!isModalVisible)}
        swipeDirection={["up", "down"]}
        swipeThreshold={200}
        modalTitle={<ModalTitle title="Add a todo" />}
        modalAnimation={
          new SlideAnimation({
            slideFrom: "bottom",
          })
        }
        visible={isModalVisible}
        onTouchOutside={() => setModalVisible(!isModalVisible)}
      >
        <ModalContent style={{ width: "100%", height: 280 }}>
          <View
            style={{
              marginVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              value={todo}
              onChangeText={(text) => setTodo(text)}
              placeholder="Input a new task here"
              style={{
                padding: 10,
                borderColor: "#007FFF",
                borderWidth: 1,
                borderRadius: 5,
                flex: 1,
                fontSize: 16,
              }}
              autoCorrect={false}
              autoCapitalize="sentences"
              maxLength={100}
              returnKeyType="done"
              blurOnSubmit={true}
            />
            <TouchableOpacity 
              onPress={addTodo}
              disabled={!todo.trim()}
              style={{
                opacity: todo.trim() ? 1 : 0.5,
              }}
            >
              <Ionicons name="send" size={24} color="#007FFF" />
            </TouchableOpacity>
          </View>

          <Text>Choose Category</Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{ marginVertical: 0.5 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {categories.map((cat, index) => (
                <Pressable
                  key={index}
                  onPress={() => setCategory(cat)}
                  onLongPress={() => handleLongPress(cat)}
                  style={{
                    borderColor: "#E0E0E0",
                    paddingHorizontal: 5,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderRadius: 25,
                    marginRight: 5,
                    height: 35,
                    justifyContent: 'center',
                  }}>
                  <Text style={{ textAlign: 'center' }}>{cat}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setCategoryModalVisible(true)}>
                <AntDesign name="pluscircle" size={24} color="#007FFF" />
              </Pressable>
            </View>
          </ScrollView>

          <Text>Some suggestions</Text>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginVertical: 10,
          }}
          >
            {suggestions?.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => setTodo(item?.todo)}
                style={{
                  backgroundColor: "#F0F8FF",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 25,
                }}
              >
                <Text style={{ textAlign: "center" }}>{item?.todo}</Text>
              </Pressable>
            ))}
          </View>
        </ModalContent>
      </BottomModal>

      <BottomModal
        onBackdropPress={() => setCategoryModalVisible(!isCategoryModalVisible)}
        onHardwareBackPress={() => setCategoryModalVisible(!isCategoryModalVisible)}
        swipeDirection={["up", "down"]}
        swipeThreshold={200}
        modalTitle={<ModalTitle title="Add a category" />}
        modalAnimation={
          new SlideAnimation({
            slideFrom: "bottom",
          })
        }
        visible={isCategoryModalVisible}
        onTouchOutside={() => setCategoryModalVisible(!isCategoryModalVisible)}
      >
        <ModalContent style={{ width: "100%", height: 150 }}>
          <View
            style={{
              marginVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              value={customCategory}
              onChangeText={(text) => setCustomCategory(text)}
              placeholder="Input a new category here"
              style={{
                padding: 10,
                borderColor: "#007FFF",
                borderWidth: 1,
                borderRadius: 5,
                flex: 1,
              }}
            />
            <Ionicons onPress={addCategory} name="send" size={24} color="#007FFF" />
          </View>
        </ModalContent>
      </BottomModal>

      <BottomModal
        onBackdropPress={() => setEditCategoryModalVisible(!isEditCategoryModalVisible)}
        onHardwareBackPress={() => setEditCategoryModalVisible(!isEditCategoryModalVisible)}
        swipeDirection={["up", "down"]}
        swipeThreshold={200}
        modalTitle={<ModalTitle title="Edit category" />}
        modalAnimation={
          new SlideAnimation({
            slideFrom: "bottom",
          })
        }
        visible={isEditCategoryModalVisible}
        onTouchOutside={() => setEditCategoryModalVisible(!isEditCategoryModalVisible)}
      >
        <ModalContent style={{ width: "100%", height: 150 }}>
          <View
            style={{
              marginVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              value={customCategory}
              onChangeText={(text) => setCustomCategory(text)}
              placeholder="Edit category"
              style={{
                padding: 10,
                borderColor: "#007FFF",
                borderWidth: 1,
                borderRadius: 5,
                flex: 1,
              }}
            />
            <Ionicons onPress={editCategory} name="send" size={24} color="#007FFF" />
          </View>
        </ModalContent>
      </BottomModal>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});