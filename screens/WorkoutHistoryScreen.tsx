import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutStorage, Workout } from '../services/WorkoutStorage';
import { format } from 'date-fns';

type RootStackParamList = {
  WorkoutHistory: undefined;
  WorkoutDetail: { workoutId: string };
};

export default function WorkoutHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const allWorkouts = await WorkoutStorage.getAllWorkouts();
      setWorkouts(allWorkouts);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  const getQualityColor = (quality?: string) => {
    switch (quality) {
      case 'Excellent': return '#4CAF50';
      case 'Good': return '#8BC34A';
      case 'Fair': return '#FFC107';
      case 'Poor': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
    >
      <View style={styles.workoutHeader}>
        <View style={styles.workoutDateContainer}>
          <Text style={styles.workoutType}>{item.workoutType}</Text>
          <Text style={styles.workoutDate}>
            {format(new Date(item.startTime), 'MMM d, yyyy')}
          </Text>
          <Text style={styles.workoutTime}>
            {format(new Date(item.startTime), 'h:mm a')}
          </Text>
        </View>
        {item.effortLevel && (
          <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(item.effortLevel.quality) }]}>
            <Text style={styles.qualityText}>{item.effortLevel.quality}</Text>
            <Text style={styles.qualityScore}>{item.effortLevel.score}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Duration</Text>
          <Text style={styles.statValue}>{formatDuration(item.duration)}</Text>
        </View>
        {item.averageHeartRate && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg HR</Text>
            <Text style={styles.statValue}>{item.averageHeartRate} bpm</Text>
          </View>
        )}
        {item.effortLevel && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Intensity</Text>
            <Text style={styles.statValue}>{item.effortLevel.averageIntensity}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Workouts Yet</Text>
          <Text style={styles.emptyText}>
            Start your first workout to begin tracking your effort!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  listContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  workoutItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutDateContainer: {
    flex: 1,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  workoutTime: {
    fontSize: 14,
    color: '#aaa',
  },
  qualityBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  qualityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  qualityScore: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
  },
});

