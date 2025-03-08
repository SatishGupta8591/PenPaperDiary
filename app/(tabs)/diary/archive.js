import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';

const ArchiveScreen = () => {
  const [archivedDiaries, setArchivedDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchArchivedDiaries();
  }, []);

  const fetchArchivedDiaries = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const response = await axios.get(
        `http://192.168.1.110:8000/diary/${userId}/archived`
      );

      if (response.data.diaries) {
        setArchivedDiaries(response.data.diaries);
      }
    } catch (error) {
      console.error("Error fetching archived diaries:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to fetch archived diaries"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (diaryId) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      await axios.patch(`http://192.168.1.110:8000/diary/${diaryId}/unarchive`, {
        userId: userId
      });

      Alert.alert("Success", "Diary unarchived successfully");
      fetchArchivedDiaries(); // Refresh the list
    } catch (error) {
      console.error("Error unarchiving diary:", error);
      Alert.alert("Error", "Failed to unarchive diary");
    }
  };

  const viewDiaryDetail = (diary) => {
    router.push({
      pathname: "/diary/diarydetails",
      params: { diaryId: diary._id }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archived Entries</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" style={styles.loader} />
      ) : archivedDiaries.length > 0 ? (
        <FlatList
          data={archivedDiaries}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.diaryItem} 
              onPress={() => viewDiaryDetail(item)}
            >
              <View style={styles.diaryHeader}>
                <Text style={styles.diaryTitle}>{item.title}</Text>
                <TouchableOpacity 
                  onPress={() => handleUnarchive(item._id)}
                  style={styles.unarchiveButton}
                >
                  <Ionicons name="archive-outline" size={24} color="#007BFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.diaryContent} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.diaryDate}>
                {moment(item.date).format('MMM DD, YYYY')}
              </Text>
              <Text style={styles.diaryCategory}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No archived entries found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  diaryItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    elevation: 2,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  diaryContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  diaryDate: {
    fontSize: 12,
    color: '#888',
  },
  diaryCategory: {
    color: '#007BFF',
    fontSize: 12,
    marginTop: 5,
  },
  unarchiveButton: {
    padding: 5,
  },
  viewDetailButton: {
    color: '#007BFF',
    fontSize: 14,
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ArchiveScreen;