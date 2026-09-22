import { Tabs } from 'expo-router';
import { Home, Search, MessageCircle, FolderOpen, User } from 'lucide-react-native';
import { COLORS } from '../../lib/utils';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Find Labor', tabBarIcon: ({ color }) => <Search size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="advisor"
        options={{ title: 'Ask Housy', tabBarIcon: ({ color }) => <MessageCircle size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="project"
        options={{ title: 'Project', tabBarIcon: ({ color }) => <FolderOpen size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <User size={22} color={color} /> }}
      />
    </Tabs>
  );
}
