import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../store/app.store';
import { COLORS, formatINR, formatDate } from '../../lib/utils';
import { CheckCircle, Circle, Camera, PlusCircle, DollarSign, Compass } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { ProjectTask, Expense } from '@housy/shared';

export default function ProjectScreen() {
  const project  = useAppStore((s) => s.activeProject);
  const [tasks, setTasks]     = useState<ProjectTask[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  if (!project) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No active project</Text>
        <Text style={styles.emptySub}>Set up your property to start a renovation project.</Text>
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={() => router.push('/(onboarding)/property' as any)}
        >
          <Text style={styles.emptyBtnText}>Set up Property →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doneTasks  = tasks.filter((t) => t.status === 'done').length;
  const progress   = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{project.title}</Text>
        <View style={[styles.statusChip,
          project.status === 'active' ? styles.statusActive : styles.statusPlanning]}>
          <Text style={styles.statusText}>{project.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      {/* Progress ring (simplified as bar) */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressSub}>{doneTasks} of {tasks.length} tasks complete</Text>
      </View>

      {/* Budget Tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Tracker</Text>
        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Spent</Text>
            <Text style={styles.budgetSpent}>{formatINR(totalSpent)}</Text>
          </View>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>Estimated</Text>
            <Text style={styles.budgetEst}>{formatINR(project.budget_estimate)}</Text>
          </View>
          <View style={styles.budgetTrack}>
            <View style={[styles.budgetFill, {
              width: project.budget_estimate
                ? `${Math.min((totalSpent / project.budget_estimate) * 100, 100)}%`
                : '0%',
            }]} />
          </View>
          <TouchableOpacity style={styles.addExpenseBtn}>
            <DollarSign size={14} color={COLORS.primary} />
            <Text style={styles.addExpenseBtnText}>Log Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floor Plan & Renovation Zones */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Floor Plan & Renovation Zones</Text>
          <TouchableOpacity onPress={() => router.push('/floor-plan' as any)}>
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>Studio ➔</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.fpCard}
          onPress={() => router.push('/floor-plan/viewer' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.fpCardTop}>
            <Compass size={20} color={COLORS.primary} />
            <Text style={styles.fpTitle}>2D Architectural Blueprint</Text>
            <View style={styles.activePlanBadge}>
              <Text style={styles.activePlanText}>6 ROOMS</Text>
            </View>
          </View>
          <Text style={styles.fpSub}>
            Includes 1 active renovation zone ("Bedroom 2 Attached Washroom") with plumbing feasibility analysis.
          </Text>
          <View style={styles.fpCardBottom}>
            <Text style={styles.fpActionText}>Open Interactive Blueprint Viewer ➔</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Contractors & Bookings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contractor Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search' as any)}>
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>+ Book Contractor</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.bookingCard}
          onPress={() => router.push({ pathname: '/booking/[id]/status', params: { id: 'HSY-BK-260901' } } as any)}
          activeOpacity={0.85}
        >
          <View style={styles.bookingCardTop}>
            <View style={styles.bookingAvatar}>
              <Text style={styles.bookingAvatarText}>S</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingName}>Suresh Mistri & Gang</Text>
              <Text style={styles.bookingMeta}>Lead Mason • Gang of 12</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
          </View>
          <View style={styles.bookingCardBottom}>
            <Text style={styles.bookingDates}>📅 Sep 24 to 26 (3 days)</Text>
            <Text style={styles.bookingTotal}>₹2,688</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tasks */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TouchableOpacity>
            <PlusCircle size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {tasks.length === 0 ? (
          <TouchableOpacity style={styles.addTaskPrompt}>
            <Text style={styles.addTaskText}>+ Add your first task (e.g. "Break bedroom wall")</Text>
          </TouchableOpacity>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskRow}>
              {task.status === 'done'
                ? <CheckCircle size={20} color={COLORS.success} />
                : <Circle size={20} color={COLORS.border} />}
              <Text style={[styles.taskTitle,
                task.status === 'done' && styles.taskDone]}>
                {task.title}
              </Text>
              <View style={[styles.taskChip,
                task.status === 'in_progress' ? styles.chipInProgress
                : task.status === 'done' ? styles.chipDone : styles.chipNotStarted]}>
                <Text style={styles.taskChipText}>
                  {task.status.replace('_', ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Photo Journal */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Photo Journal</Text>
          <TouchableOpacity>
            <Camera size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.photoPlaceholder}>
          <Camera size={32} color={COLORS.border} />
          <Text style={styles.photoPlaceholderText}>
            Tap the camera icon to add today's site photos
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:       { fontSize: 48, marginBottom: 16 },
  emptyTitle:      { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub:        { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24 },
  emptyBtn:        { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },

  header:          { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
                     flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title:           { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  statusChip:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusActive:    { backgroundColor: '#EEFAF3' },
  statusPlanning:  { backgroundColor: '#FFF8EE' },
  statusText:      { fontSize: 10, fontWeight: '800', color: COLORS.success, letterSpacing: 0.5 },

  progressCard:    { marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: 14,
                     padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border },
  progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel:   { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  progressPct:     { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  progressTrack:   { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:    { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressSub:     { fontSize: 12, color: COLORS.textSecondary },

  section:         { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between',
                     alignItems: 'center', marginBottom: 12 },
  sectionTitle:    { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  budgetCard:      { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
                     borderWidth: 1, borderColor: COLORS.border },
  budgetRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetLabel:     { fontSize: 13, color: COLORS.textSecondary },
  budgetSpent:     { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  budgetEst:       { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  budgetTrack:     { height: 6, backgroundColor: COLORS.border, borderRadius: 3,
                     overflow: 'hidden', marginVertical: 12 },
  budgetFill:      { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  addExpenseBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6,
                     alignSelf: 'flex-start' },
  addExpenseBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },

  addTaskPrompt:   { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
                     borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
  addTaskText:     { color: COLORS.textSecondary, fontSize: 14 },
  taskRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12,
                     borderBottomWidth: 1, borderColor: COLORS.border },
  taskTitle:       { flex: 1, fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
  taskDone:        { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  taskChip:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipInProgress:  { backgroundColor: '#FFF8EE' },
  chipDone:        { backgroundColor: '#EEFAF3' },
  chipNotStarted:  { backgroundColor: COLORS.surface },
  taskChipText:    { fontSize: 10, fontWeight: '700', textTransform: 'capitalize',
                     color: COLORS.textSecondary },

  photoPlaceholder:{ backgroundColor: COLORS.surface, borderRadius: 14, padding: 32,
                     alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
                     borderStyle: 'dashed' },
  photoPlaceholderText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 10,
                          textAlign: 'center' },

  bookingCard:     { backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
                     borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  bookingCardTop:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingAvatar:   { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary,
                     alignItems: 'center', justifyContent: 'center' },
  bookingAvatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  bookingName:     { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  bookingMeta:     { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  pendingBadge:    { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pendingBadgeText:{ fontSize: 10, fontWeight: '800', color: '#92400E' },
  bookingCardBottom:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10,
                     paddingTop: 10, borderTopWidth: 1, borderColor: COLORS.border },
  bookingDates:    { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  bookingTotal:    { fontSize: 14, fontWeight: '800', color: COLORS.primary },

  fpCard:          { backgroundColor: '#FFF8F0', borderRadius: 14, padding: 14,
                     borderWidth: 1.5, borderColor: '#FED7AA', marginBottom: 16 },
  fpCardTop:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fpTitle:         { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
  activePlanBadge: { backgroundColor: '#FFEDD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activePlanText:  { fontSize: 10, fontWeight: '800', color: '#C2410C' },
  fpSub:           { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, lineHeight: 18 },
  fpCardBottom:    { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderColor: '#FED7AA' },
  fpActionText:    { fontSize: 12, fontWeight: '700', color: COLORS.primary },
});
