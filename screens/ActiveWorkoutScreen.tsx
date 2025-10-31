import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, StatusBar, ScrollView, TextInput, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeartRateMonitor, HeartRateData, getEffortLevel, calculateWorkoutQuality } from '../services/HeartRateService';
import { WorkoutStorage, Workout, WorkoutType } from '../services/WorkoutStorage';

type RootStackParamList = {
  ActiveWorkout: { age?: number; maxHeartRate: number; workoutType: WorkoutType };
  Home: undefined;
};

export default function ActiveWorkoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { maxHeartRate, age, workoutType } = route.params as { age?: number; maxHeartRate: number; workoutType: WorkoutType };
  
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [heartRateHistory, setHeartRateHistory] = useState<HeartRateData[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualHRInput, setManualHRInput] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [duration, setDuration] = useState(0);
  const [workoutId, setWorkoutId] = useState<string>('');
  const monitorRef = useRef<HeartRateMonitor | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startWorkout();
    return () => {
      stopMonitoring();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Update duration every second
    intervalRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime]);

  const startWorkout = async () => {
    const id = `workout_${Date.now()}`;
    setWorkoutId(id);
    setStartTime(Date.now());

    const monitor = new HeartRateMonitor();
    monitorRef.current = monitor;

    const available = await monitor.isAvailable();
    if (!available) {
      Alert.alert(
        'Heart Rate Sensor Not Available',
        'The heart rate sensor is not available on this device. You can still track your workout manually.',
        [{ text: 'OK' }]
      );
      setIsMonitoring(false);
      return;
    }

    const started = await monitor.startMonitoring((data: HeartRateData) => {
      setHeartRate(data.heartRate);
      setHeartRateHistory(prev => [...prev, data]);
    });

    if (started) {
      setIsMonitoring(true);
      if (monitor.isManualMode()) {
        setIsManualMode(true);
      }
    } else {
      Alert.alert(
        'Monitoring Failed',
        'Could not start heart rate monitoring. You can still track your workout manually.',
        [{ text: 'OK' }]
      );
      setIsManualMode(true);
    }
  };

  const stopMonitoring = () => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
      monitorRef.current = null;
    }
    setIsMonitoring(false);
  };

  const handleEndWorkout = async () => {
    stopMonitoring();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const endTime = Date.now();
    const finalDuration = Math.floor((endTime - startTime) / 1000);

    // Calculate workout statistics
    const validHRData = heartRateHistory.filter(d => d.heartRate !== null);
    const heartRates = validHRData.map(d => d.heartRate!);
    
    const averageHR = heartRates.length > 0
      ? Math.round(heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length)
      : undefined;
    const maxHR = heartRates.length > 0 ? Math.max(...heartRates) : undefined;
    const minHR = heartRates.length > 0 ? Math.min(...heartRates) : undefined;

    // Calculate effort level and quality (type-specific)
    const effortLevel = validHRData.length > 0
      ? calculateWorkoutQuality(validHRData, maxHeartRate, finalDuration, workoutType)
      : undefined;

    const workout: Workout = {
      id: workoutId,
      workoutType,
      startTime,
      endTime,
      duration: finalDuration,
      heartRateData: heartRateHistory,
      averageHeartRate: averageHR,
      maxHeartRate: maxHR,
      minHeartRate: minHR,
      effortLevel,
    };

    try {
      await WorkoutStorage.saveWorkout(workout);
      Alert.alert(
        'Workout Saved!',
        `Workout completed!\n\n${effortLevel ? `Quality: ${effortLevel.quality}\nScore: ${effortLevel.score}/100` : 'No heart rate data recorded'}`,
        [
          {
            text: 'View Details',
            onPress: () => navigation.navigate('Home'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const effort = heartRate ? getEffortLevel(heartRate, maxHeartRate) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Heart Rate Display */}
        <View style={styles.heartRateCard}>
          <Text style={styles.heartRateLabel}>Heart Rate</Text>
          <Text style={styles.heartRateValue}>
            {heartRate ? `${heartRate}` : '--'}
            {heartRate && <Text style={styles.heartRateUnit}> bpm</Text>}
          </Text>
          {!isMonitoring && (
            <Text style={styles.monitoringStatus}>Sensor not available</Text>
          )}
        </View>

        {/* Effort Level */}
        {effort && (
          <View style={styles.effortCard}>
            <Text style={styles.effortLabel}>Current Effort</Text>
            <Text style={styles.effortZone}>{effort.zone}</Text>
            <View style={styles.intensityBar}>
              <View 
                style={[
                  styles.intensityFill,
                  { width: `${effort.intensity}%`, backgroundColor: getIntensityColor(effort.intensity) }
                ]}
              />
            </View>
            <Text style={styles.intensityText}>
              {effort.intensity}% Intensity - {effort.description}
            </Text>
          </View>
        )}

        {/* Duration */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>
          {heartRate && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Avg Heart Rate</Text>
                <Text style={styles.statValue}>
                  {Math.round(
                    heartRateHistory
                      .filter(d => d.heartRate !== null)
                      .map(d => d.heartRate!)
                      .reduce((sum, hr, _, arr) => sum + hr / arr.length, 0)
                  ) || '--'}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Heart Rate Zones Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Heart Rate Zones</Text>
          <Text style={styles.infoText}>
            Max HR: {maxHeartRate} bpm{age ? ` (Age: ${age})` : ''}
          </Text>
          <Text style={styles.infoSubtext}>
            Current zone: {effort ? effort.zone : 'N/A'}
          </Text>
        </View>

        {/* Manual Entry Button */}
        {isManualMode && (
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Text style={styles.manualButtonText}>+ Add Heart Rate Reading</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Heart Rate</Text>
            <Text style={styles.modalDescription}>
              Enter your current heart rate in bpm (beats per minute)
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualHRInput}
              onChangeText={setManualHRInput}
              placeholder="e.g., 150"
              placeholderTextColor="#666"
              keyboardType="numeric"
              maxLength={3}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowManualEntry(false);
                  setManualHRInput('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={() => {
                  const hr = parseInt(manualHRInput);
                  if (!isNaN(hr) && hr > 40 && hr < 250) {
                    if (monitorRef.current) {
                      monitorRef.current.addManualReading(hr);
                    }
                    setHeartRate(hr);
                    setHeartRateHistory(prev => [...prev, {
                      heartRate: hr,
                      timestamp: Date.now()
                    }]);
                    setShowManualEntry(false);
                    setManualHRInput('');
                  } else {
                    Alert.alert('Invalid Input', 'Please enter a heart rate between 40 and 250 bpm');
                  }
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Workout Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndWorkout}
        >
          <Text style={styles.endButtonText}>End Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getIntensityColor = (intensity: number): string => {
  if (intensity < 40) return '#4CAF50'; // Green - Low
  if (intensity < 60) return '#8BC34A'; // Light Green - Moderate
  if (intensity < 80) return '#FFC107'; // Yellow - Hard
  return '#FF5722'; // Red - Maximum
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  heartRateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heartRateLabel: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  heartRateValue: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  heartRateUnit: {
    fontSize: 32,
    fontWeight: 'normal',
  },
  monitoringStatus: {
    fontSize: 14,
    color: '#FF9800',
    marginTop: 8,
  },
  effortCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  effortLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  effortZone: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  intensityBar: {
    height: 8,
    backgroundColor: '#3a3a3a',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  intensityFill: {
    height: '100%',
    borderRadius: 4,
  },
  intensityText: {
    fontSize: 14,
    color: '#aaa',
  },
  statsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#3a3a3a',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  endButton: {
    backgroundColor: '#FF5722',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#3a3a3a',
  },
  modalButtonSave: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

