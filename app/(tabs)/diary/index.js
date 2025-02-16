import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Pressable, Animated } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

const DiaryScreen = () => {
  const [diaries, setDiaries] = useState([]);
  const router = useRouter();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current; // Sidebar animation

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log("No userId found");
        return;
      }
      console.log("Fetching diaries for userId:", userId);
      const response = await axios.get(`http://192.168.1.109:8000/diary/${userId}`);
      console.log("Received diaries:", JSON.stringify(response.data, null, 2));

      // Correct user filtering
      const userDiaries = response.data.diaries.filter(diary => diary.userId === userId);
      setDiaries(userDiaries || []);
    } catch (error) {
      console.error("Error fetching diaries:", error);
      setDiaries([]);
    }
  };

  const onRefresh = React.useCallback(() => {
    fetchDiaries();
  }, []);

  const toggleMenu = () => {
    setMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isMenuVisible ? 0 : -300,
      useNativeDriver: true,
    }).start();
  }, [isMenuVisible]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={toggleMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.searchBarWrapper}>
          <TextInput style={styles.searchBar} placeholder="Search" placeholderTextColor="#666" />
        </View>
      </View>

      {diaries.length > 0 ? (
        <FlatList
          data={diaries}
          keyExtractor={(item) => item._id.toString()}
          renderItem={({ item }) => (
            <View style={styles.diaryItem}>
              <Text style={styles.diaryTitle}>{item.title || 'Untitled'}</Text>
              <Text style={styles.diaryContent} numberOfLines={3}>
                {item.content || 'No content'}
              </Text>
              <Text style={styles.diaryDate}>
                {moment(item.date).format('MMM DD, YYYY')}
              </Text>
              <Text style={styles.diaryCategory}>{item.category || 'No Category'}</Text>
            </View>
          )}
          refreshing={false}
          onRefresh={onRefresh}
        />
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>📖</Text>
          <Text style={styles.message}>
            No diary entry available{'\n'}Press Add button to add
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/diary/add_diary")}
      >
        <Text style={styles.addButtonText}>✏️</Text>
      </TouchableOpacity>

      {/* Sidebar Menu */}
      <Modal animationType="none" transparent={true} visible={isMenuVisible}>
        <View style={styles.centeredView}>
          <Animated.View style={[styles.modalView, { transform: [{ translateX: slideAnim }] }]}>
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
            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <AntDesign name="calendar" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Calendar View</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <MaterialCommunityIcons name="tag-heart-outline" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Tags</Text>
            </Pressable>
            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); }}>
              <SimpleLineIcons name="settings" size={24} color="white" style={styles.iconStyle} />
              <Text style={styles.textStyle}>Settings</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    height: 40,
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    color: '#888',
    marginBottom: 10,
  },
  message: {
    textAlign: 'center',
    fontSize: 18,
    color: '#888',
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
    backgroundColor: '#007bff', // Changed to match the app color
    padding: 20,
    width: 250,
    height: "100%",
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
    flexDirection: 'column', // Changed to column
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
  },
  menuHeaderText: {
    color: 'white',
    fontSize: 20,
    marginLeft: 0, // Remove marginLeft
    marginTop: 10, // Add marginTop for spacing
    textAlign: 'center', // Center the text
  },
});

export default DiaryScreen;
