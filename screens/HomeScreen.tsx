import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutStorage, Workout } from '../services/WorkoutStorage';
import { format } from 'date-fns';

const AppIcon = require('./Images/Icon.png');

type RootStackParamList = {
  Home: undefined;
  StartWorkout: undefined;
  ActiveWorkout: undefined;
  WorkoutHistory: undefined;
  WorkoutDetail: { workoutId: string };
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadRecentWorkouts();
    }, [])
  );

  const loadRecentWorkouts = async () => {
    try {
      const workouts = await WorkoutStorage.getAllWorkouts();
      setTotalWorkouts(workouts.length);
      setRecentWorkouts(workouts.slice(0, 5)); // Show 5 most recent
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <View style={styles.workoutHeaderLeft}>
          <Text style={styles.workoutType}>{item.workoutType}</Text>
          <Text style={styles.workoutDate}>
            {format(new Date(item.startTime), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
        {item.effortLevel && (
          <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(item.effortLevel.quality) }]}>
            <Text style={styles.qualityText}>{item.effortLevel.quality}</Text>
          </View>
        )}
      </View>
      <View style={styles.workoutStats}>
        <Text style={styles.workoutStat}>
          Duration: {formatDuration(item.duration)}
        </Text>
        {item.averageHeartRate && (
          <Text style={styles.workoutStat}>
            Avg HR: {item.averageHeartRate} bpm
          </Text>
        )}
        {item.effortLevel && (
          <Text style={styles.workoutStat}>
            Intensity: {item.effortLevel.averageIntensity}%
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image source={AppIcon} style={styles.icon} resizeMode="contain" />
          <Text style={styles.title}>Track Your Effort</Text>
        </View>
        <Text style={styles.subtitle}>
          Measure workout quality by heart rate, not just weight
        </Text>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('StartWorkout')}
      >
        <Text style={styles.startButtonText}>Start New Workout</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Total Workouts</Text>
        </View>
        {recentWorkouts.length > 0 && recentWorkouts[0].effortLevel && (
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{recentWorkouts[0].effortLevel.score}</Text>
            <Text style={styles.statLabel}>Last Score</Text>
          </View>
        )}
      </View>

      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {recentWorkouts.length > 5 && (
            <TouchableOpacity onPress={() => navigation.navigate('WorkoutHistory')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {recentWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No workouts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start your first workout to begin tracking your effort!
            </Text>
          </View>
        ) : (
          <FlatList
            data={recentWorkouts}
            renderItem={renderWorkoutItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    padding: 20,
    paddingTop: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  recentSection: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  workoutItem: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutHeaderLeft: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#aaa',
  },
  qualityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 16,
  },
  workoutStat: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

