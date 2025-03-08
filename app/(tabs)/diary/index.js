import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Pressable, Animated, Alert, Image, AppState } from 'react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { FontAwesome } from '@expo/vector-icons';  // Fix FontAwesome import
import PinModal from '../../../components/PinModal';
import { useFocusEffect } from '@react-navigation/native';

function DiaryScreen() {
  // State declarations
  const [diaries, setDiaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDiaries, setFilteredDiaries] = useState([]);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isPinModalVisible, setPinModalVisible] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialCheck, setIsInitialCheck] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const slideAnim = useRef(new Animated.Value(-300)).current;
  
  // Router and params
  const router = useRouter();
  const { date } = useLocalSearchParams();

  // Add these animation functions after the state declarations
  const animateMenu = (toValue) => {
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // check pin function
  const checkPin = async () => {
    try {
      if (isAuthenticated) return; // Don't check if already authenticated
      
      const userId = await AsyncStorage.getItem('userId');
      const pin = await AsyncStorage.getItem(`securityPin_${userId}`);
      const hasPin = !!pin;
      setIsPinSet(hasPin);
      
      if (!hasPin && isInitialCheck) {
        // First time user - show PIN setup
        setPinModalVisible(true);
        setIsInitialCheck(false);
      } else if (hasPin && !isAuthenticated) {
        // Existing user - need verification
        setPinModalVisible(true);
      }
    } catch (error) {
      console.error('Error checking PIN:', error);
    }
  };

  // fetch diaries function
  const fetchDiaries = async () => {
    if (isLoading) return; // Prevent multiple calls
    
    try {
      setIsLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log("No userId found");
        return;
      }

      let apiUrl = `http://192.168.1.110:8000/diary/${userId}`;
      if (date) {
        apiUrl += `?date=${date}`;
      }

      const response = await axios.get(apiUrl);
      // Filter out archived entries
      const userDiaries = response.data.diaries.filter(
        (diary) => diary.userId === userId && !diary.isArchived
      );
      setDiaries(userDiaries || []);
      setFilteredDiaries(response.data.diaries);
    } catch (error) {
      console.error("Error fetching diaries:", error);
      setDiaries([]);
      setFilteredDiaries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update the toggleMenu function
  const toggleMenu = () => {
    if (isMenuVisible) {
      animateMenu(-300); // Slide out
      setTimeout(() => setMenuVisible(false), 300);
    } else {
      setMenuVisible(true);
      animateMenu(0); // Slide in
    }
  };

  // navigate to calendar view function
  const navigateToCalendarView = () => {
    setMenuVisible(false); // Close the menu
    router.push("/calendar"); // Navigate to the calendar route
  };

  // handle view diary entries function
  const handleViewDiaryEntries = () => {
    if (!isAuthenticated) {
      return; // Don't proceed if not authenticated
    }
    
    router.push({
      pathname: "/diary",
      params: { date: selectedDate }
    });
  };

  // handle edit diary function
  const handleEditDiary = (diary) => {
    if (!isAuthenticated) {
      return; // Don't proceed if not authenticated
    }

    Alert.alert(
      "Edit Diary",
      "Are you sure you want to edit this diary entry?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: () => {
            router.push({
              pathname: "/(tabs)/diary/add_diary",
              params: {
                isEditing: true,
                diaryId: diary._id,
                initialTitle: diary.title,
                initialContent: diary.content,
                initialCategory: diary.category
              }
            });
          }
        }
      ],
      { cancelable: false }
    );
  };

  // handle archive entries function
  const handleArchiveEntries = () => {
    setMenuVisible(false);
    router.push('/(tabs)/diary/archive');  // Update this line with correct path
  };

  // handle long press function
  const handleLongPress = (diary) => {
    Alert.alert(
      "Diary Options",
      "Choose an action",
      [
        {
          text: "Archive",
          onPress: () => handleArchiveDiary(diary._id),
          style: "default"
        },
        {
          text: "Delete",
          onPress: () => handleDeleteDiary(diary._id),
          style: "destructive"
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ],
      { cancelable: true }
    );
  };

  // handle archive diary function
  const handleArchiveDiary = async (diaryId) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const response = await axios.patch(
        `http://192.168.1.110:8000/diary/${diaryId}/archive`
      );

      if (response.data.diary) {
        setDiaries((prevDiaries) =>
          prevDiaries.filter((diary) => diary._id !== diaryId)
        );
        setFilteredDiaries((prevDiaries) =>
          prevDiaries.filter((diary) => diary._id !== diaryId)
        );
        Alert.alert("Success", "Diary archived successfully");
      }
    } catch (error) {
      console.error("Error archiving diary:", error);
      Alert.alert(
        "Error",
        "Failed to archive diary. Please try again."
      );
    }
  };

  // handle delete diary function
  const handleDeleteDiary = async (diaryId) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      await axios.delete(`http://192.168.1.110:8000/diary/${diaryId}`);
      fetchDiaries(); // Refresh the list
      Alert.alert("Success", "Diary deleted successfully");
    } catch (error) {
      console.error("Error deleting diary:", error);
      Alert.alert("Error", "Failed to delete diary");
    }
  };

  // handle search function
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredDiaries(diaries);
      return;
    }

    const filtered = diaries.filter((diary) => {
      const titleMatch = diary.title.toLowerCase().includes(text.toLowerCase());
      const contentMatch = diary.content.toLowerCase().includes(text.toLowerCase());
      const categoryMatch = diary.category.toLowerCase().includes(text.toLowerCase());
      return titleMatch || contentMatch || categoryMatch;
    });
    setFilteredDiaries(filtered);
  };

  // All hooks must be called before this line
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        checkPin();
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    fetchDiaries();
  }, [date, isAuthenticated]);

  useEffect(() => {
    setFilteredDiaries(diaries);
  }, [diaries]);

  const onRefresh = useCallback(() => {
    fetchDiaries();
  }, [date]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.searchBarWrapper}>
          <FontAwesome name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchBar} 
            placeholder="Search diary entries..." 
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => handleSearch('')}
              style={styles.clearSearch}
            >
              <AntDesign name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filteredDiaries.length > 0 ? (
        <FlatList
          data={filteredDiaries}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onLongPress={() => handleLongPress(item)}
              delayLongPress={500} // Half second delay for long press
              disabled={!isAuthenticated} // Disable interaction if not authenticated
            >
              <View style={styles.diaryItem}>
                <View style={styles.diaryHeader}>
                  <Text style={styles.diaryTitle}>{item.title || 'Untitled'}</Text>
                  <TouchableOpacity 
                    onPress={() => handleEditDiary(item)} 
                    style={styles.editButton}
                    disabled={!isAuthenticated} // Disable edit button if not authenticated
                  >
                    <MaterialIcons 
                      name="edit" 
                      size={24} 
                      color={isAuthenticated ? "#007BFF" : "#ccc"} // Change color when disabled
                    />
                  </TouchableOpacity>
                </View>
                {item.image && (
                  <Image source={{ uri: item.image }} style={{ width: 100, height: 100 }} />
                )}
                <Text style={styles.diaryContent} numberOfLines={3}>
                  {item.content || 'No content'}
                </Text>
                <Text style={styles.diaryDate}>
                  {moment(item.date).format('MMM DD, YYYY')}
                </Text>
                <Text style={styles.diaryCategory}>{item.category || 'No Category'}</Text>
              </View>
            </TouchableOpacity>
          )}
          refreshing={false}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>📖</Text>
          <Text style={styles.message}>
            {searchQuery.length > 0 
              ? "No matching entries found" 
              : "No diary entry available\nPress Add button to add"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(tabs)/diary/add_diary")}
      >
        <Text style={styles.addButtonText}>✏️</Text>
      </TouchableOpacity>

      {/* Sidebar Menu */}
      <Modal 
        animationType="none" 
        transparent={true} 
        visible={isMenuVisible}
        onRequestClose={toggleMenu}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <Animated.View 
            style={[
              styles.modalView,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
              <Text style={styles.closeText}>✖</Text>
            </TouchableOpacity>

            <View style={styles.menuHeader}>
              <Entypo name="open-book" size={60} color="white" />
              <Text style={styles.menuHeaderText}>My Diary</Text>
            </View>

            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <FontAwesome5 name="list-alt" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>All Entries</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={navigateToCalendarView}>
              <AntDesign name="calendar" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Calendar View</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <MaterialCommunityIcons name="tag-heart-outline" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Tags</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={handleArchiveEntries}>
              <MaterialIcons name="archive" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Archive Entries</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <SimpleLineIcons name="settings" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Settings</Text>
            </Pressable>
            <Pressable
              onPress={handleViewDiaryEntries}
              style={{
                backgroundColor: "#007BFF",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 5,
              }}
            >
              <Text style={{ color: "white", fontSize: 14 }}>View Diary Entries</Text>
            </Pressable>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <PinModal
        isVisible={isPinModalVisible}
        mode={isPinSet ? 'verify' : 'set'}
        onClose={(verified) => {
          setPinModalVisible(false);
          if (verified) {
            setIsAuthenticated(true);
            fetchDiaries(); // This should be called after authentication is set
          }
        }}
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
    width: '100%',
    backgroundColor: '#007bff',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#fff',
    marginRight: 10,
  },
  searchBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginLeft: 10,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearSearch: {
    padding: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 50,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  diaryItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 2,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  editButton: {
    padding: 5,
  },
  diaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  diaryContent: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    marginBottom: 5,
    lineHeight: 20,
  },
  diaryDate: {
    color: 'gray',
    fontSize: 12,
    marginTop: 5,
  },
  diaryCategory: {
    color: '#007FFF',
    fontSize: 14,
    marginTop: 5,
  },
  centeredView: {
    flex: 1,
    alignItems: "flex-start",
  },
  modalView: {
    backgroundColor: '#007bff',
    padding: 20,
    width: 250,
    height: "100%",
    position: 'absolute',
    left: 0,
    top: 0,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  closeText: {
    color: "white",
    fontSize: 24,
  },
  modalOption: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textStyle: {
    color: "white",
    fontSize: 18,
    marginLeft: 10,
  },
  iconStyle: {
    marginRight: 10,
  },
  menuHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
  },
  menuHeaderText: {
    color: 'white',
    fontSize: 20,
    marginLeft: 0,
    marginTop: 10,
    textAlign: 'center',
  },
  authContainer: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default DiaryScreen;
