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
            <View style={styles.diaryItem}>
              <Text style={styles.diaryTitle}>{item.title}</Text>
              <Text style={styles.diaryContent} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.diaryDate}>
                {moment(item.date).format('MMM DD, YYYY')}
              </Text>
              <Text style={styles.diaryCategory}>{item.category}</Text>
            </View>
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