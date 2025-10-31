import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeartRateMonitor } from '../services/HeartRateService';
import { WorkoutType } from '../services/WorkoutStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  StartWorkout: undefined;
  ActiveWorkout: { age?: number; maxHeartRate: number; workoutType: WorkoutType };
};

const WORKOUT_TYPES: WorkoutType[] = [
  'Weightlifting',
  'Cardio',
  'HIIT',
  'Other'
];

const MAX_HEART_RATE_KEY = '@hundred_max_heart_rate';
const AGE_KEY = '@hundred_age';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = (SCREEN_WIDTH - 60) / 2; // Screen width minus padding and gap, divided by 2

export default function StartWorkoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [age, setAge] = useState('');
  const [maxHeartRate, setMaxHeartRate] = useState('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('Other');
  const [isCheckingSensor, setIsCheckingSensor] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState<boolean | null>(null);
  const monitor = new HeartRateMonitor();

  useEffect(() => {
    loadSavedSettings();
    checkSensorAvailability();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedAge = await AsyncStorage.getItem(AGE_KEY);
      const savedMaxHR = await AsyncStorage.getItem(MAX_HEART_RATE_KEY);
      if (savedAge) setAge(savedAge);
      if (savedMaxHR) setMaxHeartRate(savedMaxHR);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkSensorAvailability = async () => {
    setIsCheckingSensor(true);
    try {
      const available = await monitor.isAvailable();
      setSensorAvailable(available);
    } catch (error) {
      console.error('Error checking sensor:', error);
      setSensorAvailable(false);
    }
    setIsCheckingSensor(false);
  };

  const calculateMaxHeartRate = (ageValue: number): number => {
    // Standard formula: 220 - age
    return Math.round(220 - ageValue);
  };

  const getWorkoutTypeDescription = (type: WorkoutType): string => {
    switch (type) {
      case 'Weightlifting':
        return 'Effort measured by peak HR spikes, variability, and recovery efficiency';
      case 'Cardio':
      case 'Running':
      case 'Cycling':
        return 'Effort measured by sustained aerobic zones and duration';
      case 'HIIT':
      case 'CrossFit':
        return 'Effort measured by zone transitions, high intensity time, and variability';
      default:
        return 'Balanced effort calculation across all metrics';
    }
  };

  const handleStartWorkout = async () => {
    let finalMaxHR: number;
    let finalAge: number | undefined;

    if (maxHeartRate) {
      const hr = parseInt(maxHeartRate);
      if (isNaN(hr) || hr < 100 || hr > 220) {
        Alert.alert('Invalid Input', 'Max heart rate must be between 100 and 220 bpm');
        return;
      }
      finalMaxHR = hr;
    } else if (age) {
      const ageValue = parseInt(age);
      if (isNaN(ageValue) || ageValue < 10 || ageValue > 120) {
        Alert.alert('Invalid Input', 'Age must be between 10 and 120');
        return;
      }
      finalAge = ageValue;
      finalMaxHR = calculateMaxHeartRate(ageValue);
    } else {
      Alert.alert('Missing Information', 'Please enter either your age or max heart rate');
      return;
    }

    // Save settings for next time
    try {
      if (age) await AsyncStorage.setItem(AGE_KEY, age);
      if (maxHeartRate) await AsyncStorage.setItem(MAX_HEART_RATE_KEY, maxHeartRate);
    } catch (error) {
      console.error('Error saving settings:', error);
    }

    navigation.navigate('ActiveWorkout', {
      age: finalAge,
      maxHeartRate: finalMaxHR,
      workoutType: workoutType
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Configure Workout</Text>
        <Text style={styles.description}>
          Select your workout type and enter your age or max heart rate. Effort is calculated differently based on workout type to provide accurate quality scores.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Workout Type</Text>
          <View style={styles.workoutTypeGrid}>
            {WORKOUT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.workoutTypeButton,
                  workoutType === type && styles.workoutTypeButtonSelected
                ]}
                onPress={() => setWorkoutType(type)}
              >
                <Text style={[
                  styles.workoutTypeText,
                  workoutType === type && styles.workoutTypeTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hintText}>
            {getWorkoutTypeDescription(workoutType)}
          </Text>
        </View>

        <View style={styles.sensorStatus}>
          <Text style={styles.sensorLabel}>Heart Rate Sensor:</Text>
          {isCheckingSensor ? (
            <Text style={styles.sensorStatusText}>Checking...</Text>
          ) : sensorAvailable === true ? (
            <Text style={[styles.sensorStatusText, styles.sensorAvailable]}>✓ Available</Text>
          ) : sensorAvailable === false ? (
            <Text style={[styles.sensorStatusText, styles.sensorUnavailable]}>✗ Not Available</Text>
          ) : (
            <Text style={styles.sensorStatusText}>Unknown</Text>
          )}
        </View>

        {sensorAvailable === false && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠ Heart rate sensor not available. You can still track workouts manually, but real-time heart rate monitoring won't be available.
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Age (optional)</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="e.g., 25"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={3}
          />
          {age && (
            <Text style={styles.hintText}>
              Estimated max heart rate: {calculateMaxHeartRate(parseInt(age) || 0)} bpm
            </Text>
          )}
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Max Heart Rate (optional)</Text>
          <TextInput
            style={styles.input}
            value={maxHeartRate}
            onChangeText={setMaxHeartRate}
            placeholder="e.g., 195"
            placeholderTextColor="#666"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.hintText}>
            Typical range: 100-220 bpm
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.startButton, (!age && !maxHeartRate) && styles.startButtonDisabled]}
          onPress={handleStartWorkout}
          disabled={!age && !maxHeartRate}
        >
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  workoutTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
    justifyContent: 'space-between',
  },
  workoutTypeButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: BUTTON_WIDTH,
    alignItems: 'center',
  },
  workoutTypeButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  workoutTypeText: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  workoutTypeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 22,
    marginBottom: 24,
  },
  sensorStatus: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sensorLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  sensorStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sensorAvailable: {
    color: '#4CAF50',
  },
  sensorUnavailable: {
    color: '#FF9800',
  },
  warningBox: {
    backgroundColor: '#3a2816',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#FF9800',
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a3a3a',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#3a3a3a',
    opacity: 0.5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

