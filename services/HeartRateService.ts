import type { WorkoutType } from './WorkoutStorage';

export interface HeartRateData {
  heartRate: number | null;
  timestamp: number;
}

export class HeartRateMonitor {
  private intervalId: NodeJS.Timeout | null = null;
  private onHeartRateUpdate: ((data: HeartRateData) => void) | null = null;
  private manualMode: boolean = false;

  async isAvailable(): Promise<boolean> {
    // TODO: Integrate with HealthKit (iOS) or Health Connect (Android) for real sensor data
    // For now, we'll use manual mode as a fallback
    // This allows users to still track workouts even without sensor access
    try {
      // Future: Check HealthKit/Health Connect availability
      // const available = await HealthKit.isAvailable();
      return false; // Return false to use manual mode
    } catch (error) {
      console.log('Heart rate sensor not available, using manual mode:', error);
      return false;
    }
  }

  async startMonitoring(onUpdate: (data: HeartRateData) => void): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      
      if (!available) {
        // Manual mode - user will enter heart rate values
        this.manualMode = true;
        this.onHeartRateUpdate = onUpdate;
        
        // In manual mode, we'll prompt user to enter heart rate periodically
        // Or they can use the manual entry button
        console.log('Using manual heart rate entry mode');
        return true; // Return true so workout can continue in manual mode
      }

      // Future: Real sensor integration
      // this.onHeartRateUpdate = onUpdate;
      // HeartRateSensor.setUpdateInterval(1000);
      // this.subscription = HeartRateSensor.addListener(({ heartRate }) => {
      //   if (this.onHeartRateUpdate && heartRate) {
      //     this.onHeartRateUpdate({
      //       heartRate: Math.round(heartRate),
      //       timestamp: Date.now()
      //     });
      //   }
      // });

      return true;
    } catch (error) {
      console.error('Error starting heart rate monitoring:', error);
      return false;
    }
  }

  // Method to manually add heart rate reading
  addManualReading(heartRate: number): void {
    if (this.onHeartRateUpdate && this.manualMode) {
      this.onHeartRateUpdate({
        heartRate: Math.round(heartRate),
        timestamp: Date.now()
      });
    }
  }

  // Future: Integrate with HealthKit (iOS)
  // async startHealthKitMonitoring(onUpdate: (data: HeartRateData) => void): Promise<boolean> {
  //   try {
  //     const { HealthKit } = await import('expo-health-kit');
  //     const authorized = await HealthKit.requestAuthorization(['heartRate']);
  //     if (authorized) {
  //       HealthKit.startHeartRateUpdates((data) => {
  //         onUpdate({ heartRate: data.heartRate, timestamp: Date.now() });
  //       });
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error('HealthKit error:', error);
  //     return false;
  //   }
  // }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onHeartRateUpdate = null;
    this.manualMode = false;
  }

  isManualMode(): boolean {
    return this.manualMode;
  }
}

// Helper function to calculate heart rate zones based on max heart rate
export function calculateHeartRateZones(maxHeartRate: number) {
  return {
    recovery: { min: 0, max: Math.round(maxHeartRate * 0.5) },
    fatBurn: { min: Math.round(maxHeartRate * 0.5), max: Math.round(maxHeartRate * 0.6) },
    aerobic: { min: Math.round(maxHeartRate * 0.6), max: Math.round(maxHeartRate * 0.7) },
    anaerobic: { min: Math.round(maxHeartRate * 0.7), max: Math.round(maxHeartRate * 0.85) },
    max: { min: Math.round(maxHeartRate * 0.85), max: maxHeartRate }
  };
}

// Calculate effort level based on current heart rate and zones
export function getEffortLevel(heartRate: number, maxHeartRate: number): {
  zone: string;
  intensity: number; // 0-100
  description: string;
} {
  const zones = calculateHeartRateZones(maxHeartRate);
  
  if (heartRate <= zones.recovery.max) {
    return {
      zone: 'Recovery',
      intensity: Math.round((heartRate / zones.recovery.max) * 20),
      description: 'Very Light'
    };
  } else if (heartRate <= zones.fatBurn.max) {
    return {
      zone: 'Fat Burn',
      intensity: Math.round(20 + ((heartRate - zones.fatBurn.min) / (zones.fatBurn.max - zones.fatBurn.min)) * 20),
      description: 'Light'
    };
  } else if (heartRate <= zones.aerobic.max) {
    return {
      zone: 'Aerobic',
      intensity: Math.round(40 + ((heartRate - zones.aerobic.min) / (zones.aerobic.max - zones.aerobic.min)) * 20),
      description: 'Moderate'
    };
  } else if (heartRate <= zones.anaerobic.max) {
    return {
      zone: 'Anaerobic',
      intensity: Math.round(60 + ((heartRate - zones.anaerobic.min) / (zones.anaerobic.max - zones.anaerobic.min)) * 20),
      description: 'Hard'
    };
  } else {
    return {
      zone: 'Max',
      intensity: Math.round(80 + ((heartRate - zones.max.min) / (zones.max.max - zones.max.min)) * 20),
      description: 'Maximum'
    };
  }
}

// Import WorkoutType
import type { WorkoutType } from './WorkoutStorage';

// Calculate workout quality based on heart rate data and workout type
export function calculateWorkoutQuality(
  heartRateData: HeartRateData[],
  maxHeartRate: number,
  duration: number,
  workoutType: WorkoutType = 'Other'
): {
  averageIntensity: number;
  maxIntensity: number;
  timeInZones: { [zone: string]: number };
  quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  score: number; // 0-100
  workoutSpecific?: {
    hrVariability?: number;
    peakSpikes?: number;
    recoveryEfficiency?: number;
    sustainedAerobic?: number;
    zoneTransitions?: number;
  };
} {
  if (heartRateData.length === 0) {
    return {
      averageIntensity: 0,
      maxIntensity: 0,
      timeInZones: {},
      quality: 'Poor',
      score: 0
    };
  }

  const intensities = heartRateData.map(data => {
    if (!data.heartRate) return 0;
    return getEffortLevel(data.heartRate, maxHeartRate).intensity;
  });

  const averageIntensity = intensities.reduce((sum, i) => sum + i, 0) / intensities.length;
  const maxIntensity = Math.max(...intensities);

  // Calculate time in each zone
  const zones = calculateHeartRateZones(maxHeartRate);
  const timeInZones: { [zone: string]: number } = {
    recovery: 0,
    fatBurn: 0,
    aerobic: 0,
    anaerobic: 0,
    max: 0
  };

  heartRateData.forEach(data => {
    if (!data.heartRate) return;
    if (data.heartRate <= zones.recovery.max) timeInZones.recovery += 1;
    else if (data.heartRate <= zones.fatBurn.max) timeInZones.fatBurn += 1;
    else if (data.heartRate <= zones.aerobic.max) timeInZones.aerobic += 1;
    else if (data.heartRate <= zones.anaerobic.max) timeInZones.anaerobic += 1;
    else timeInZones.max += 1;
  });

  // Convert seconds to percentage
  const total = heartRateData.length;
  Object.keys(timeInZones).forEach(zone => {
    timeInZones[zone] = Math.round((timeInZones[zone] / total) * 100);
  });

  // Calculate workout-specific metrics
  const validHRs = heartRateData.filter(d => d.heartRate !== null).map(d => d.heartRate!);
  const workoutSpecific: {
    hrVariability?: number;
    peakSpikes?: number;
    recoveryEfficiency?: number;
    sustainedAerobic?: number;
    zoneTransitions?: number;
  } = {};

  // Calculate HR variability (std deviation) - useful for weightlifting
  if (validHRs.length > 1) {
    const mean = validHRs.reduce((sum, hr) => sum + hr, 0) / validHRs.length;
    const variance = validHRs.reduce((sum, hr) => sum + Math.pow(hr - mean, 2), 0) / validHRs.length;
    workoutSpecific.hrVariability = Math.round(Math.sqrt(variance));
  }

  // Count peak spikes (HR > 85% max) - important for weightlifting
  const anaerobicThreshold = Math.round(maxHeartRate * 0.85);
  workoutSpecific.peakSpikes = heartRateData.filter(d => d.heartRate && d.heartRate > anaerobicThreshold).length;

  // Calculate sustained aerobic time (consecutive readings in aerobic zone) - important for cardio
  let maxSustainedAerobic = 0;
  let currentSustained = 0;
  const aerobicMin = Math.round(maxHeartRate * 0.6);
  const aerobicMax = Math.round(maxHeartRate * 0.7);
  heartRateData.forEach(data => {
    if (data.heartRate && data.heartRate >= aerobicMin && data.heartRate <= aerobicMax) {
      currentSustained++;
      maxSustainedAerobic = Math.max(maxSustainedAerobic, currentSustained);
    } else {
      currentSustained = 0;
    }
  });
  workoutSpecific.sustainedAerobic = Math.round((maxSustainedAerobic / heartRateData.length) * 100);

  // Count zone transitions - important for HIIT
  let zoneTransitions = 0;
  let previousZone = '';
  heartRateData.forEach(data => {
    if (!data.heartRate) return;
    let currentZone = '';
    if (data.heartRate <= zones.recovery.max) currentZone = 'recovery';
    else if (data.heartRate <= zones.fatBurn.max) currentZone = 'fatBurn';
    else if (data.heartRate <= zones.aerobic.max) currentZone = 'aerobic';
    else if (data.heartRate <= zones.anaerobic.max) currentZone = 'anaerobic';
    else currentZone = 'max';
    
    if (previousZone && previousZone !== currentZone) {
      zoneTransitions++;
    }
    previousZone = currentZone;
  });
  workoutSpecific.zoneTransitions = zoneTransitions;

  // Calculate quality score based on workout type
  let score: number;
  const timeInHighIntensity = timeInZones.anaerobic + timeInZones.max;
  const durationScore = Math.min(duration / 3600 * 100, 100);

  switch (workoutType) {
    case 'Weightlifting':
      // Weightlifting: Focus on peak intensity, HR variability, and recovery
      // 30% max intensity, 25% peak spikes, 25% HR variability, 10% duration, 10% average intensity
      const variabilityScore = workoutSpecific.hrVariability ? 
        Math.min((workoutSpecific.hrVariability / 30) * 100, 100) : 50; // Good variability is 15-30 bpm
      const spikesScore = Math.min((workoutSpecific.peakSpikes! / Math.max(heartRateData.length / 10, 1)) * 100, 100);
      score = Math.round(
        maxIntensity * 0.30 +
        spikesScore * 0.25 +
        variabilityScore * 0.25 +
        durationScore * 0.10 +
        averageIntensity * 0.10
      );
      break;

    case 'Cardio':
    case 'Running':
    case 'Cycling':
      // Cardio: Focus on sustained aerobic zones and duration
      // 35% sustained aerobic, 30% average intensity, 20% duration, 15% time in aerobic zone
      score = Math.round(
        (workoutSpecific.sustainedAerobic || 0) * 0.35 +
        averageIntensity * 0.30 +
        durationScore * 0.20 +
        timeInZones.aerobic * 0.15
      );
      break;

    case 'HIIT':
    case 'CrossFit':
      // HIIT/CrossFit: Focus on zone transitions, high intensity time, and variability
      // 30% time in high intensity, 25% zone transitions, 25% max intensity, 20% average intensity
      const transitionsScore = Math.min((workoutSpecific.zoneTransitions! / Math.max(heartRateData.length / 5, 1)) * 100, 100);
      score = Math.round(
        timeInHighIntensity * 0.30 +
        transitionsScore * 0.25 +
        maxIntensity * 0.25 +
        averageIntensity * 0.20
      );
      break;

    default:
      // Generic: Balanced approach
      score = Math.round(
        averageIntensity * 0.35 +
        maxIntensity * 0.30 +
        timeInHighIntensity * 0.20 +
        durationScore * 0.15
      );
  }

  let quality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  if (score >= 80) quality = 'Excellent';
  else if (score >= 60) quality = 'Good';
  else if (score >= 40) quality = 'Fair';
  else quality = 'Poor';

  return {
    averageIntensity: Math.round(averageIntensity),
    maxIntensity,
    timeInZones,
    quality,
    score,
    workoutSpecific
  };
}

