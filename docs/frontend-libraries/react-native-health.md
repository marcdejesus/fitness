# React Native Health & Wearable Integration

## Overview
React Native Health provides a bridge between React Native apps and Apple HealthKit/Google Fit, allowing our fitness app to read from and write to the health databases on users' devices.

## Features Used in Our Fitness App
- **Step Counting**: Tracking daily steps and activity levels
- **Workout Sync**: Syncing workouts between our app and health platforms
- **Heart Rate Monitoring**: Capturing and analyzing heart rate during workouts
- **Sleep Tracking**: Importing sleep data for recovery analysis
- **Weight & Body Metrics**: Recording weight, body fat percentage, and other metrics
- **Calorie Tracking**: Correlating burned calories with nutritional intake

## Implementation Examples

### Setting Up HealthKit Integration
```jsx
import AppleHealthKit from 'react-native-health';
import { Platform } from 'react-native';

const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.Sleep,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.Workout,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.Weight,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.Workout,
    ],
  },
};

function setupHealthIntegration() {
  if (Platform.OS !== 'ios') return Promise.resolve(false);
  
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error) => {
      if (error) {
        console.log('Error initializing HealthKit: ', error);
        reject(error);
        return;
      }
      
      console.log('HealthKit initialized successfully');
      resolve(true);
    });
  });
}
```

### Fetching Activity Data
```jsx
function fetchDailySteps(date) {
  return new Promise((resolve, reject) => {
    const options = {
      date: date.toISOString(),
    };
    
    AppleHealthKit.getStepCount(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve(results);
    });
  });
}

function fetchHeartRateData(startDate, endDate) {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: true,
      limit: 100,
    };
    
    AppleHealthKit.getHeartRateSamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve(results);
    });
  });
}
```

### Recording Workouts to Health Platforms
```jsx
function saveWorkoutToHealthKit(workout) {
  return new Promise((resolve, reject) => {
    // Map our app's workout type to HealthKit's workout type
    const healthKitWorkoutType = mapWorkoutType(workout.type);
    
    const options = {
      type: healthKitWorkoutType,
      startDate: workout.startTime.toISOString(),
      endDate: workout.endTime.toISOString(),
      energyBurned: workout.calories,
      distance: workout.distance,
      metadata: {
        'app.fitness.workout.id': workout.id,
        'app.fitness.workout.name': workout.name,
      }
    };
    
    AppleHealthKit.saveWorkout(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve(result);
    });
  });
}

// Helper function to map our workout types to HealthKit types
function mapWorkoutType(appWorkoutType) {
  const typeMap = {
    'strength': AppleHealthKit.Constants.Activities.Strength,
    'running': AppleHealthKit.Constants.Activities.Running,
    'cycling': AppleHealthKit.Constants.Activities.Cycling,
    'yoga': AppleHealthKit.Constants.Activities.Yoga,
    // Add more mappings as needed
  };
  
  return typeMap[appWorkoutType] || AppleHealthKit.Constants.Activities.Other;
}
```

### Sleep and Recovery Data
```jsx
function fetchSleepAnalysis(startDate, endDate) {
  return new Promise((resolve, reject) => {
    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    
    AppleHealthKit.getSleepSamples(options, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      
      // Process and analyze sleep data
      const processedData = processSleepData(results);
      resolve(processedData);
    });
  });
}

function processSleepData(sleepSamples) {
  // Calculate total sleep time
  let totalSleepTime = 0;
  let deepSleepTime = 0;
  let remSleepTime = 0;
  
  sleepSamples.forEach(sample => {
    const start = new Date(sample.startDate);
    const end = new Date(sample.endDate);
    const durationMs = end - start;
    const durationMinutes = durationMs / (1000 * 60);
    
    totalSleepTime += durationMinutes;
    
    // Analyze sleep quality based on type
    if (sample.value === 'DEEP') {
      deepSleepTime += durationMinutes;
    } else if (sample.value === 'REM') {
      remSleepTime += durationMinutes;
    }
  });
  
  return {
    totalSleepHours: totalSleepTime / 60,
    deepSleepPercentage: (deepSleepTime / totalSleepTime) * 100,
    remSleepPercentage: (remSleepTime / totalSleepTime) * 100,
    qualityScore: calculateSleepQualityScore(totalSleepTime, deepSleepTime, remSleepTime),
    samples: sleepSamples,
  };
}
```

## Google Fit Integration
```jsx
import GoogleFit, { Scopes } from 'react-native-google-fit';

function initGoogleFit() {
  if (Platform.OS !== 'android') return Promise.resolve(false);
  
  const options = {
    scopes: [
      Scopes.FITNESS_ACTIVITY_READ,
      Scopes.FITNESS_ACTIVITY_WRITE,
      Scopes.FITNESS_BODY_READ,
      Scopes.FITNESS_BODY_WRITE,
      Scopes.FITNESS_HEART_RATE_READ,
      Scopes.FITNESS_SLEEP_READ,
    ],
  };
  
  return GoogleFit.authorize(options)
    .then((authResult) => {
      if (authResult.success) {
        console.log('Google Fit authorization successful');
        return true;
      } else {
        console.log('Google Fit authorization denied', authResult.message);
        return false;
      }
    })
    .catch((error) => {
      console.log('Google Fit authorization error', error);
      return false;
    });
}
```

## Universal Health Data Hook
```jsx
function useHealthData() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize appropriate health service based on platform
  useEffect(() => {
    async function initialize() {
      try {
        let authorized = false;
        
        if (Platform.OS === 'ios') {
          authorized = await setupHealthIntegration();
        } else if (Platform.OS === 'android') {
          authorized = await initGoogleFit();
        }
        
        setIsAuthorized(authorized);
      } catch (error) {
        console.error('Health integration setup failed', error);
        setIsAuthorized(false);
      }
    }
    
    initialize();
  }, []);
  
  // Generic function to fetch daily activity summary
  const fetchDailyActivity = async (date = new Date()) => {
    if (!isAuthorized) return null;
    
    setIsLoading(true);
    try {
      let activityData = {};
      
      if (Platform.OS === 'ios') {
        const steps = await fetchDailySteps(date);
        const calories = await fetchActiveEnergyBurned(date);
        // Add more metrics as needed
        
        activityData = { steps, calories };
      } else if (Platform.OS === 'android') {
        // Similar implementation for Google Fit
      }
      
      return activityData;
    } catch (error) {
      console.error('Error fetching health data', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { isAuthorized, isLoading, fetchDailyActivity };
}
```