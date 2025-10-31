import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeartRateData } from './HeartRateService';

export type WorkoutType = 
  | 'Weightlifting'
  | 'Cardio'
  | 'HIIT'
  | 'CrossFit'
  | 'Running'
  | 'Cycling'
  | 'Yoga'
  | 'Other';

export interface Workout {
  id: string;
  workoutType: WorkoutType;
  startTime: number;
  endTime?: number;
  duration?: number; // in seconds
  heartRateData: HeartRateData[];
  averageHeartRate?: number;
  maxHeartRate?: number;
  minHeartRate?: number;
  effortLevel?: {
    averageIntensity: number;
    maxIntensity: number;
    timeInZones: { [zone: string]: number };
    quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    score: number;
    workoutSpecific?: {
      // Weightlifting: peak spikes, recovery variability
      hrVariability?: number; // Standard deviation of HR
      peakSpikes?: number; // Number of times HR spiked above threshold
      recoveryEfficiency?: number; // How quickly HR returns to baseline
      // Cardio: sustained zones
      sustainedAerobic?: number; // Percentage of time in sustained aerobic zone
      // HIIT: alternating patterns
      zoneTransitions?: number; // Number of transitions between zones
    };
  };
  notes?: string;
}

const WORKOUTS_KEY = '@hundred_workouts';

export class WorkoutStorage {
  static async saveWorkout(workout: Workout): Promise<void> {
    try {
      const workouts = await this.getAllWorkouts();
      workouts.push(workout);
      // Sort by start time, newest first
      workouts.sort((a, b) => b.startTime - a.startTime);
      await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  static async getAllWorkouts(): Promise<Workout[]> {
    try {
      const data = await AsyncStorage.getItem(WORKOUTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting workouts:', error);
      return [];
    }
  }

  static async getWorkout(id: string): Promise<Workout | null> {
    try {
      const workouts = await this.getAllWorkouts();
      return workouts.find(w => w.id === id) || null;
    } catch (error) {
      console.error('Error getting workout:', error);
      return null;
    }
  }

  static async updateWorkout(id: string, updates: Partial<Workout>): Promise<void> {
    try {
      const workouts = await this.getAllWorkouts();
      const index = workouts.findIndex(w => w.id === id);
      if (index !== -1) {
        workouts[index] = { ...workouts[index], ...updates };
        await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
      }
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  static async deleteWorkout(id: string): Promise<void> {
    try {
      const workouts = await this.getAllWorkouts();
      const filtered = workouts.filter(w => w.id !== id);
      await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  static async clearAllWorkouts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WORKOUTS_KEY);
    } catch (error) {
      console.error('Error clearing workouts:', error);
      throw error;
    }
  }
}

