import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/app.store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';

const queryClient = new QueryClient();

export default function RootLayout() {
  const setSession = useAppStore((s) => s.setSession);

  useEffect(() => {
    // Restore session on app start safely without throwing
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setSession(data.session);
        }
      }).catch(() => {});
    } catch {}

    // Listen for auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setSession(session);
        }
      });
      return () => {
        data?.subscription?.unsubscribe();
      };
    } catch {}
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <View style={styles.container}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="floor-plan/index" />
            <Stack.Screen name="floor-plan/camera-scan" />
            <Stack.Screen name="floor-plan/wizard" />
            <Stack.Screen name="floor-plan/viewer" />
            <Stack.Screen name="poc/[id]" />
            <Stack.Screen name="booking/[pocId]" />
            <Stack.Screen name="booking/[id]/status" />
          </Stack>
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FAF9F6',
  },
});
