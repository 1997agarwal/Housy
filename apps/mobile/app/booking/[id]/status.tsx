import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  ArrowLeft, CheckCircle2, Clock, Phone, MessageSquare,
  Shield, Calendar, AlertCircle, HardHat
} from 'lucide-react-native';
import { COLORS, formatINR } from '../../../lib/utils';
import { supabase } from '../../../lib/supabase';
import { MOCK_BAREILLY_POCS } from '../../../lib/mockData';

export default function BookingStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('bookings')
          .select('*, poc_profiles(*, users!inner(name, phone))')
          .eq('id', id)
          .single();

        if (data) {
          setBooking(data);
        } else {
          // Fallback demo booking
          const poc = MOCK_BAREILLY_POCS[0];
          setBooking({
            id: id || 'HSY-BK-260901',
            status: 'pending',
            start_date: '2026-09-24',
            end_date: '2026-09-26',
            daily_rate: 800,
            work_description: 'Need to break drawing room wall partition and construct bathroom arch.',
            poc_profiles: {
              ...poc,
              users: { name: poc.name, phone: poc.phone },
            },
          });
        }
      } catch {
        const poc = MOCK_BAREILLY_POCS[0];
        setBooking({
          id: id || 'HSY-BK-260901',
          status: 'pending',
          start_date: '2026-09-24',
          end_date: '2026-09-26',
          daily_rate: 800,
          work_description: 'Need to break drawing room wall partition and construct bathroom arch.',
          poc_profiles: {
            ...poc,
            users: { name: poc.name, phone: poc.phone },
          },
        });
      } finally {
        setLoading(false);
      }
    }

    loadBooking();
  }, [id]);

  if (loading || !booking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const pocName = booking.poc_profiles?.users?.name || 'Suresh Mistri';
  const pocPhone = booking.poc_profiles?.users?.phone || '+919837012345';
  const status = booking.status; // 'pending' | 'accepted' | 'active' | 'completed'

  const steps = [
    { key: 'pending', title: 'Request Sent', desc: 'Dispatched to POC on WhatsApp', done: true },
    { key: 'accepted', title: 'Confirmed by POC', desc: 'Crew and dates locked in', done: status === 'accepted' || status === 'active' || status === 'completed' },
    { key: 'active', title: 'Work In Progress', desc: 'Team on site', done: status === 'active' || status === 'completed' },
    { key: 'completed', title: 'Work Completed', desc: 'Final inspection & sign-off', done: status === 'completed' },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Booking Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status Highlight Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBadge}>
            <Clock size={16} color="#D97706" />
            <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
          </View>
          <Text style={styles.bannerTitle}>
            {status === 'pending'
              ? 'Awaiting Contractor Response'
              : status === 'accepted'
              ? 'Contractor Confirmed!'
              : 'Work In Progress'}
          </Text>
          <Text style={styles.bannerSub}>
            Booking Ref: <Text style={{ fontWeight: '700' }}>{booking.id}</Text>
          </Text>
        </View>

        {/* POC Summary */}
        <View style={styles.pocCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{pocName[0]}</Text>
          </View>
          <View style={styles.pocInfo}>
            <Text style={styles.pocName}>{pocName}</Text>
            <Text style={styles.pocRole}>Lead Contractor • Bareilly</Text>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => Linking.openURL(`tel:${pocPhone}`)}
            >
              <Phone size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, { backgroundColor: '#F0FDF4' }]}
              onPress={() => Linking.openURL(`https://wa.me/${pocPhone.replace(/\+/g, '')}`)}
            >
              <MessageSquare size={18} color="#25D366" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timeline Stepper */}
        <View style={styles.stepperCard}>
          <Text style={styles.cardTitle}>Booking Progress</Text>
          <View style={styles.stepperWrap}>
            {steps.map((step, idx) => (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                    {step.done ? (
                      <CheckCircle2 size={16} color="#fff" />
                    ) : (
                      <View style={styles.stepDotInner} />
                    )}
                  </View>
                  {idx < steps.length - 1 && (
                    <View style={[styles.stepLine, step.done && styles.stepLineDone]} />
                  )}
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepTitle, step.done && styles.stepTitleDone]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Work Details Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work Summary</Text>
          <Text style={styles.workDescText}>{booking.work_description}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Calendar size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Dates: <Text style={{ fontWeight: '700' }}>{booking.start_date} to {booking.end_date}</Text>
            </Text>
          </View>
          <View style={[styles.infoRow, { marginTop: 8 }]}>
            <HardHat size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>
              Agreed Rate: <Text style={{ fontWeight: '700' }}>₹{booking.daily_rate}/day</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  scroll: { padding: 20 },

  statusBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#78350F' },
  bannerSub: { fontSize: 12, color: '#92400E', marginTop: 4 },

  pocCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  pocInfo: { flex: 1 },
  pocName: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  pocRole: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepperCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  stepperWrap: { paddingLeft: 6 },
  stepRow: { flexDirection: 'row', minHeight: 56 },
  stepIndicatorCol: { alignItems: 'center', width: 28 },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotDone: { backgroundColor: COLORS.success },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  stepLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  stepLineDone: { backgroundColor: COLORS.success },
  stepTextCol: { flex: 1, paddingLeft: 12, paddingBottom: 14 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  stepTitleDone: { color: COLORS.textPrimary, fontWeight: '700' },
  stepDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workDescText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: COLORS.textPrimary },
});
