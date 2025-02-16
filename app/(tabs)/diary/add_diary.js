import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Modal, FlatList } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AddDiary = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString());
  const [categories, setCategories] = useState(["Work", "Personal", "Health", "Finance", "Others"]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  // Function to toggle the category modal
  const toggleCategoryModal = () => {
    setCategoryModalVisible(!isCategoryModalVisible);
  };

  // Function to handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    toggleCategoryModal();
  };
  const handleSave = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const diaryData = {
        userId,
        title,
        content,
        category: selectedCategory || 'Others'
      };

      const response = await axios.post('http://192.168.1.109:8000/diary', diaryData);
      
      if (response.data) {
        router.back(); // Go back to diary list
      }
    } catch (error) {
      console.log("Error saving diary:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Entry</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
  <Text style={styles.saveButtonText}>Save</Text>
</TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Date and Category Row */}
        <View style={styles.row}>
          {/* Calendar Icon and Date */}
          <View style={styles.rowItem}>
            <AntDesign name="calendar" size={24} color="black" />
            <Text style={styles.dateText}>{date}</Text>
          </View>
          {/* Tags Icon and Dropdown */}
          <TouchableOpacity style={styles.rowItem} onPress={toggleCategoryModal}>
            <AntDesign name="tags" size={24} color="black" />
            <Text style={styles.categoryText}>{selectedCategory || "Category"}</Text>
            <AntDesign name="caretdown" size={16} color="black" />
          </TouchableOpacity>
        </View>

        {/* Title Input */}
        <TextInput
          style={styles.titleInput}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />

        {/* Content Input */}
        <TextInput
          style={styles.contentInput}
          placeholder="Write your thoughts..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />


        {/* Image Icon */}
        <TouchableOpacity style={styles.imageIconContainer}>
          <Ionicons name="images-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(item)}
                >
                  <Text style={styles.categoryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={toggleCategoryModal}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddDiary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  form: {
    padding: 16,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  titleInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
  },
  imageIconContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  categoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#007FFF',
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});
