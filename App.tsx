import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import StartWorkoutScreen from './screens/StartWorkoutScreen';
import ActiveWorkoutScreen from './screens/ActiveWorkoutScreen';
import WorkoutHistoryScreen from './screens/WorkoutHistoryScreen';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen';

const AppIcon = require('./screens/Images/Icon.png');

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerTitle: () => (
              <View style={styles.headerTitle}>
                <Image source={AppIcon} style={styles.headerIcon} resizeMode="contain" />
                <Text style={styles.headerTitleText}>100%</Text>
              </View>
            ),
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="StartWorkout" 
          component={StartWorkoutScreen} 
          options={{ 
            title: 'New Workout',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff'
          }} 
        />
        <Stack.Screen 
          name="ActiveWorkout" 
          component={ActiveWorkoutScreen} 
          options={{ 
            title: 'Workout in Progress',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff',
            headerLeft: () => null,
            gestureEnabled: false
          }} 
        />
        <Stack.Screen 
          name="WorkoutHistory" 
          component={WorkoutHistoryScreen} 
          options={{ 
            title: 'Workout History',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff'
          }} 
        />
        <Stack.Screen 
          name="WorkoutDetail" 
          component={WorkoutDetailScreen} 
          options={{ 
            title: 'Workout Details',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#fff'
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});

