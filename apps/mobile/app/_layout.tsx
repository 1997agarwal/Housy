import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/app.store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Platform } from 'react-native';

const queryClient = new QueryClient();
const isWeb = Platform.OS === 'web';

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
    <GestureHandlerRootView style={styles.rootWrapper}>
      <QueryClientProvider client={queryClient}>
        <View style={styles.webOuter}>
          <View style={styles.mobileFrame}>
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
        </View>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: isWeb ? '#ECEAE4' : '#FAF9F6',
  },
  webOuter: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isWeb ? '#ECEAE4' : '#FAF9F6',
  },
  mobileFrame: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 460 : '100%',
    height: '100%',
    backgroundColor: '#FAF9F6',
    ...(isWeb
      ? ({
          boxShadow: '0 10px 40px rgba(0,0,0,0.10)',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: '#E2DFD8',
          overflow: 'hidden',
        } as any)
      : {}),
  },
});
