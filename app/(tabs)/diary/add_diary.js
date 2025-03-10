import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Modal,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import moment from "moment";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const AddDiary = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(moment().format("MMMM D, YYYY"));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState(["Personal", "Work", "Travel"]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const router = useRouter();
  const { isEditing, diaryId, initialTitle, initialContent, initialCategory } =
    useLocalSearchParams();
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    if (isEditing) {
      setTitle(initialTitle || "");
      setContent(initialContent || "");
      setSelectedCategory(initialCategory || "");
      // Load images from the diary entry
      const loadDiary = async () => {
        try {
          const response = await axios.get(`http://192.168.1.110:8000/diary/${diaryId}`);
          if (response.data.diary && response.data.diary.images) {
            setSelectedImages(response.data.diary.images);
          }
        } catch (error) {
          console.log("Error loading diary images:", error);
        }
      };
      loadDiary();
    }
  }, [isEditing, initialTitle, initialContent, initialCategory, diaryId]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryModalVisible(false);
  };

  const toggleCategoryModal = () => {
    setCategoryModalVisible(!isCategoryModalVisible);
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,  // Use MediaTypeOptions instead of MediaType
        allowsMultipleSelection: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
        setSelectedImages(prevImages => [...prevImages, ...newImages]);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        Alert.alert("Error", "Title is required");
        return;
      }
      if (!content.trim()) {
        Alert.alert("Error", "Content is required");
        return;
      }
      if (!selectedCategory) {
        Alert.alert("Error", "Please select a category");
        return;
      }

      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const diaryData = {
        userId: userId,
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        date: moment().format("YYYY-MM-DD"),
        images: selectedImages || [], // Make sure images is always an array
      };

      console.log("Sending diary data:", {
        ...diaryData,
        images: `${diaryData.images.length} images`
      });

      if (isEditing) {
        await axios.put(
          `http://192.168.1.110:8000/diary/${diaryId}`,
          diaryData
        );
      } else {
        await axios.post("http://192.168.1.110:8000/diary", diaryData);
      }

      router.back();
    } catch (error) {
      console.log("Error saving diary:", error.response?.data || error);
      Alert.alert("Error", "Failed to save diary entry");
    }
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages(selectedImages.filter((_, index) => index !== indexToRemove));
  };

  const handleImagePress = (uri) => {
    setSelectedImage(uri);
  };

  const addNewCategory = () => {
    if (newCategory.trim()) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const deleteCategory = (categoryToDelete) => {
    setCategories(categories.filter(cat => cat !== categoryToDelete));
  };

  const handleLongPressCategory = (category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => deleteCategory(category),
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Entry" : "Add New Entry"}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <ScrollView style={styles.scrollView}>
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
              <Text style={styles.categoryText}>
                {selectedCategory || "Category"}
              </Text>
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

          {/* Image Grid */}
          <View style={styles.imageGrid}>
            {selectedImages.map((uri, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.imageContainer}
                onPress={() => handleImagePress(uri)}
              >
                <Image source={{ uri }} style={styles.thumbnailImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <AntDesign name="closecircle" size={20} color="red" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Image Picker */}
        <TouchableOpacity style={styles.bottomImagePicker} onPress={pickImage}>
          <Ionicons name="images-outline" size={24} color="black" />
          <Text style={styles.imagePickerText}>Add Images</Text>
        </TouchableOpacity>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.imagePreviewContainer}>
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setSelectedImage(null)}
          >
            <AntDesign name="close" size={24} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
          )}
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={isCategoryModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Categories</Text>
            
            <View style={styles.addCategoryContainer}>
              <TextInput
                style={styles.categoryInput}
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="Add new category"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={[styles.addButton, !newCategory.trim() && styles.addButtonDisabled]}
                onPress={addNewCategory}
                disabled={!newCategory.trim()}
              >
                <AntDesign name="plus" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryScrollView}>
              {categories.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryItemContainer,
                    selectedCategory === item && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleCategorySelect(item)}
                  onLongPress={() => handleLongPressCategory(item)}
                  delayLongPress={500}
                >
                  <Text style={[
                    styles.categoryItemText,
                    selectedCategory === item && styles.selectedCategoryText
                  ]}>
                    {item}
                  </Text>
                  <Text style={styles.longPressHint}>Long press to delete</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={toggleCategoryModal}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
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
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007FFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "500",
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  titleInput: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    marginBottom: 16,
  },
  contentInput: {
    minHeight: 200,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  imageIconContainer: {
    alignItems: "center",
    marginTop: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    borderStyle: 'dashed',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%', // Limit modal height
  },
  categoryScrollView: {
    maxHeight: 200, // Fixed height for scroll view
  },
  categoryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    width: "100%",
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#007FFF",
    padding: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "500",
  },
  imageContainer: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.66%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  removeImageButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  bottomImagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: 'black',
  },
  imageScrollView: {
    marginVertical: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 20,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreviewButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  previewImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  addCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  categoryItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  deleteButton: {
    padding: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#007FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007FFF',
    width: 45,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  selectedCategoryItem: {
    backgroundColor: '#e6f3ff',
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#007FFF',
    fontWeight: 'bold',
  },
  longPressHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  closeModalButton: {
    backgroundColor: '#007FFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  closeModalButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  }
});
