import { Redirect } from 'expo-router';
import { useAppStore } from '../store/app.store';

export default function Index() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return isAuthenticated
    ? <Redirect href="/(tabs)/home" />
    : <Redirect href="/(auth)/login" />;
}
