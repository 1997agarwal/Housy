import { ScrollView, View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Search, MessageCircle, FolderOpen, ChevronRight, Hammer, Compass, Sparkles } from 'lucide-react-native';
import { useAppStore } from '../../store/app.store';
import { COLORS, formatINR, calcProgress } from '../../lib/utils';

const QUICK_ACTIONS = [
  { icon: Compass,       label: 'Floor Plan Studio', route: '/floor-plan',     bg: '#FFF8F0' },
  { icon: Search,        label: 'Find Labor',        route: '/(tabs)/search',  bg: '#FFF3EE' },
  { icon: MessageCircle, label: 'Ask Housy AI',      route: '/(tabs)/advisor', bg: '#EEF4FF' },
  { icon: FolderOpen,    label: 'My Project',        route: '/(tabs)/project', bg: '#EEFAF3' },
] as const;

export default function HomeScreen() {
  const user    = useAppStore((s) => s.user);
  const project = useAppStore((s) => s.activeProject);

  const progress   = project ? calcProgress(10, 4) : 0; // placeholder
  const firstName  = user?.name?.split(' ')[0] || 'there';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, {firstName} 👋</Text>
          <Text style={styles.subGreeting}>Let's make progress today.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Active Project Card */}
      {project ? (
        <TouchableOpacity
          style={styles.projectCard}
          onPress={() => router.push('/(tabs)/project')}
          activeOpacity={0.85}
        >
          <Text style={styles.projectLabel}>YOUR RENOVATION</Text>
          <Text style={styles.projectTitle}>{project.title}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
          <View style={styles.projectMeta}>
            <Text style={styles.projectMetaText}>3 tasks today</Text>
            <Text style={styles.projectMetaText}>
              {formatINR(project.budget_spent)} spent
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.startCard}
          onPress={() => router.push('/(onboarding)/property')}
          activeOpacity={0.85}
        >
          <Text style={styles.startIcon}>🏗️</Text>
          <Text style={styles.startTitle}>Start your renovation</Text>
          <Text style={styles.startSub}>Tell us about your property to get started.</Text>
          <View style={styles.startBtn}>
            <Text style={styles.startBtnText}>Get Started →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.grid}>
        {QUICK_ACTIONS.map(({ icon: Icon, label, route, bg }) => (
          <TouchableOpacity
            key={label}
            style={[styles.tile, { backgroundColor: bg }]}
            onPress={() => route && router.push(route as any)}
            activeOpacity={0.8}
          >
            <Icon size={28} color={COLORS.primary} />
            <Text style={styles.tileLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Education nudge */}
      <TouchableOpacity style={styles.learnBanner} activeOpacity={0.8}>
        <View style={styles.learnLeft}>
          <Text style={styles.learnTitle}>📚 Learn renovation basics</Text>
          <Text style={styles.learnSub}>10 essential guides for first-time renovators</Text>
        </View>
        <ChevronRight size={18} color={COLORS.primary} />
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting:        { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  subGreeting:     { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  avatar:          { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary,
                     alignItems: 'center', justifyContent: 'center' },
  avatarText:      { color: '#fff', fontWeight: '700', fontSize: 18 },

  projectCard:     { marginHorizontal: 20, borderRadius: 16, backgroundColor: COLORS.primary,
                     padding: 20, marginBottom: 24 },
  projectLabel:    { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)',
                     letterSpacing: 1.5, marginBottom: 4 },
  projectTitle:    { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 16 },
  progressRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressTrack:   { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.3)',
                     borderRadius: 3, marginRight: 10, overflow: 'hidden' },
  progressFill:    { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  projectMeta:     { flexDirection: 'row', justifyContent: 'space-between' },
  projectMetaText: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },

  startCard:       { marginHorizontal: 20, borderRadius: 16, backgroundColor: COLORS.surface,
                     padding: 24, marginBottom: 24, alignItems: 'center', borderWidth: 1,
                     borderColor: COLORS.border, borderStyle: 'dashed' },
  startIcon:       { fontSize: 40, marginBottom: 12 },
  startTitle:      { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  startSub:        { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  startBtn:        { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 24,
                     paddingVertical: 12 },
  startBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },

  sectionTitle:    { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary,
                     paddingHorizontal: 20, marginBottom: 12 },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12,
                     marginBottom: 24 },
  tile:            { width: '44%', margin: '3%', borderRadius: 14, padding: 18,
                     alignItems: 'flex-start' },
  tileLabel:       { marginTop: 12, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

  learnBanner:     { marginHorizontal: 20, backgroundColor: '#FFF8F5', borderRadius: 12,
                     padding: 16, flexDirection: 'row', alignItems: 'center',
                     borderWidth: 1, borderColor: '#FFE4D6' },
  learnLeft:       { flex: 1 },
  learnTitle:      { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  learnSub:        { fontSize: 12, color: COLORS.textSecondary },
});
