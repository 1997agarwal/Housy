import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAppStore } from '../../store/app.store';
import { COLORS } from '../../lib/utils';
import { LogOut, ChevronRight, Shield, HelpCircle } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAppStore();

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  const menuItems = [
    { icon: Shield, label: 'Verification Status',
      sub: user?.aadhaar_verified ? 'Aadhaar Verified ✓' : 'Pending verification', onPress: () => {} },
    { icon: HelpCircle, label: 'Help & Support',
      sub: 'FAQs, contact us', onPress: () => {} },
    { icon: LogOut, label: 'Sign Out',
      sub: '', onPress: handleSignOut, danger: true },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Avatar + name */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Homeowner'}</Text>
        <Text style={styles.phone}>{user?.phone || ''}</Text>
        <Text style={styles.city}>{user?.city || 'Location not set'}</Text>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {menuItems.map(({ icon: Icon, label, sub, onPress, danger }) => (
          <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress}>
            <Icon size={20} color={danger ? COLORS.error : COLORS.primary} />
            <View style={styles.menuText}>
              <Text style={[styles.menuLabel, danger && { color: COLORS.error }]}>{label}</Text>
              {!!sub && <Text style={styles.menuSub}>{sub}</Text>}
            </View>
            <ChevronRight size={16} color={COLORS.border} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.version}>Housy v1.0.0 • Made with ❤️ for Indian homeowners</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  profileHeader: { alignItems: 'center', paddingTop: 80, paddingBottom: 32,
                   backgroundColor: COLORS.surface, borderBottomWidth: 1,
                   borderColor: COLORS.border },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
                   alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText:    { color: '#fff', fontWeight: '800', fontSize: 30 },
  name:          { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  phone:         { fontSize: 14, color: COLORS.textSecondary, marginBottom: 2 },
  city:          { fontSize: 14, color: COLORS.textSecondary },
  menu:          { paddingHorizontal: 20, paddingTop: 24 },
  menuItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
                   borderBottomWidth: 1, borderColor: COLORS.border, gap: 14 },
  menuText:      { flex: 1 },
  menuLabel:     { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  menuSub:       { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  version:       { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary,
                   marginTop: 40, marginBottom: 32 },
});
