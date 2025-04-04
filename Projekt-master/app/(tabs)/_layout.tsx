import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { useAuth } from '@/providers/FirebaseAuthProvider'; // Adjust the import path accordingly

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();

  // Show loading indicator while authentication state is being determined
  if (loading) {
    return <Text>Loading...</Text>; // Optionally replace with a custom loading component
  }

  // Redirect unauthenticated users to the sign-in page
  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/home.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatBot"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/chat.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scaning"
        options={{
          title: 'Scan Code',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/camera.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locations',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/location.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="addLocations"
        options={{
          title: 'Add Locations',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/location.png')}
              style={[styles.icon, { tintColor: color, width: size, height: size }]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
});
