import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutStorage, Workout } from '../services/WorkoutStorage';
import { format } from 'date-fns';

type RootStackParamList = {
  WorkoutDetail: { workoutId: string };
  WorkoutHistory: undefined;
};

export default function WorkoutDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { workoutId } = route.params as { workoutId: string };
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkout();
  }, [workoutId]);

  const loadWorkout = async () => {
    try {
      setLoading(true);
      const workoutData = await WorkoutStorage.getWorkout(workoutId);
      setWorkout(workoutData);
    } catch (error) {
      console.error('Error loading workout:', error);
      Alert.alert('Error', 'Failed to load workout details');
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
      return `${hours}h ${mins}m ${secs}s`;
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

  const handleDelete = () => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await WorkoutStorage.deleteWorkout(workoutId);
              navigation.navigate('WorkoutHistory');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Quality Score */}
      {workout.effortLevel && (
        <View style={styles.qualityCard}>
          <Text style={styles.qualityLabel}>Workout Quality</Text>
          <View style={[styles.qualityBadge, { backgroundColor: getQualityColor(workout.effortLevel.quality) }]}>
            <Text style={styles.qualityTitle}>{workout.effortLevel.quality}</Text>
            <Text style={styles.qualityScore}>{workout.effortLevel.score}/100</Text>
          </View>
          <Text style={styles.qualityDescription}>
            This {workout.workoutType.toLowerCase()} workout was rated using type-specific metrics for accurate effort assessment.
          </Text>
        </View>
      )}

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workout Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type</Text>
          <Text style={[styles.infoValue, styles.workoutTypeValue]}>{workout.workoutType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>
            {format(new Date(workout.startTime), 'MMM d, yyyy')}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>
            {format(new Date(workout.startTime), 'h:mm a')} -{' '}
            {workout.endTime ? format(new Date(workout.endTime), 'h:mm a') : 'N/A'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Duration</Text>
          <Text style={styles.infoValue}>{formatDuration(workout.duration)}</Text>
        </View>
      </View>

      {/* Heart Rate Stats */}
      {(workout.averageHeartRate || workout.maxHeartRate || workout.minHeartRate) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate</Text>
          {workout.averageHeartRate && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{workout.averageHeartRate} bpm</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            {workout.maxHeartRate && (
              <View style={styles.statCardSmall}>
                <Text style={styles.statLabel}>Max</Text>
                <Text style={styles.statValueSmall}>{workout.maxHeartRate} bpm</Text>
              </View>
            )}
            {workout.minHeartRate && (
              <View style={styles.statCardSmall}>
                <Text style={styles.statLabel}>Min</Text>
                <Text style={styles.statValueSmall}>{workout.minHeartRate} bpm</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Effort Level */}
      {workout.effortLevel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effort Analysis</Text>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Average Intensity</Text>
            <Text style={styles.statValue}>{workout.effortLevel.averageIntensity}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Peak Intensity</Text>
            <Text style={styles.statValue}>{workout.effortLevel.maxIntensity}%</Text>
          </View>
          
          {workout.effortLevel.timeInZones && (
            <View style={styles.zonesContainer}>
              <Text style={styles.zonesTitle}>Time in Heart Rate Zones</Text>
              {Object.entries(workout.effortLevel.timeInZones).map(([zone, percentage]) => (
                <View key={zone} style={styles.zoneRow}>
                  <Text style={styles.zoneLabel}>{zone.charAt(0).toUpperCase() + zone.slice(1)}</Text>
                  <View style={styles.zoneBarContainer}>
                    <View 
                      style={[
                        styles.zoneBar,
                        { width: `${percentage}%`, backgroundColor: getZoneColor(zone) }
                      ]}
                    />
                  </View>
                  <Text style={styles.zonePercentage}>{percentage}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Workout-Specific Metrics */}
      {workout.effortLevel?.workoutSpecific && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type-Specific Metrics</Text>
          {workout.workoutType === 'Weightlifting' && (
            <>
              {workout.effortLevel.workoutSpecific.hrVariability && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>HR Variability</Text>
                  <Text style={styles.infoValue}>{workout.effortLevel.workoutSpecific.hrVariability} bpm</Text>
                </View>
              )}
              {workout.effortLevel.workoutSpecific.peakSpikes !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Peak Spikes</Text>
                  <Text style={styles.infoValue}>{workout.effortLevel.workoutSpecific.peakSpikes}</Text>
                </View>
              )}
            </>
          )}
          {(workout.workoutType === 'Cardio' || workout.workoutType === 'Running' || workout.workoutType === 'Cycling') && (
            workout.effortLevel.workoutSpecific.sustainedAerobic !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sustained Aerobic</Text>
                <Text style={styles.infoValue}>{workout.effortLevel.workoutSpecific.sustainedAerobic}%</Text>
              </View>
            )
          )}
          {(workout.workoutType === 'HIIT' || workout.workoutType === 'CrossFit') && (
            workout.effortLevel.workoutSpecific.zoneTransitions !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Zone Transitions</Text>
                <Text style={styles.infoValue}>{workout.effortLevel.workoutSpecific.zoneTransitions}</Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Heart Rate Data Points */}
      {workout.heartRateData && workout.heartRateData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate Data Points</Text>
          <Text style={styles.dataPointsText}>
            {workout.heartRateData.filter(d => d.heartRate !== null).length} measurements recorded
          </Text>
        </View>
      )}

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Workout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getZoneColor = (zone: string): string => {
  switch (zone.toLowerCase()) {
    case 'recovery': return '#4CAF50';
    case 'fatburn': return '#8BC34A';
    case 'aerobic': return '#FFC107';
    case 'anaerobic': return '#FF9800';
    case 'max': return '#FF5722';
    default: return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    color: '#FF5722',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  qualityCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  qualityLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  qualityBadge: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    minWidth: 150,
  },
  qualityTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  qualityScore: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  qualityDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  workoutTypeValue: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statCardSmall: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  zonesContainer: {
    marginTop: 16,
  },
  zonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneLabel: {
    fontSize: 14,
    color: '#aaa',
    width: 100,
  },
  zoneBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  zoneBar: {
    height: '100%',
    borderRadius: 4,
  },
  zonePercentage: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    width: 50,
    textAlign: 'right',
  },
  dataPointsText: {
    fontSize: 14,
    color: '#aaa',
  },
  deleteButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#FF5722',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  deleteButtonText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
  },
});

