import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import moment from 'moment';
import { Ionicons } from '@expo/vector-icons';

const ViewDiary = () => {
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { diaryId } = useLocalSearchParams();
  const router = useRouter();

  const fetchDiary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://192.168.1.110:8000/diary/${diaryId}`
      );
      setDiary(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching diary:", error);
      Alert.alert("Error", "Failed to fetch diary details");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary();
  }, [diaryId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Archive Entry</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
        </View>
      ) : diary ? (
        <ScrollView style={styles.content}>
          <View style={styles.diaryContainer}>
            <Text style={styles.title}>{diary.title}</Text>
            <View style={styles.metaInfo}>
              <Text style={styles.date}>
                {moment(diary.date).format('MMMM DD, YYYY')}
              </Text>
              <Text style={styles.category}>{diary.category}</Text>
            </View>
            <Text style={styles.contentText}>{diary.content}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Diary entry not found</Text>
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
    elevation: 3,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  diaryContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metaInfo: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  category: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '500',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  }
});

export default ViewDiary;