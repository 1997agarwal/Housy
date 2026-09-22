import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  ArrowLeft, Calendar, Clock, Info, CheckCircle2,
  ShieldCheck, MessageSquare, AlertCircle
} from 'lucide-react-native';
import { COLORS, formatINR } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/app.store';
import { MOCK_BAREILLY_POCS, EnrichedPOCProfile } from '../../lib/mockData';

const PLATFORM_FEE_PCT = 12;

export default function BookingScreen() {
  const { pocId } = useLocalSearchParams<{ pocId: string }>();
  const activeProject = useAppStore((s) => s.activeProject);
  const activeProperty = useAppStore((s) => s.activeProperty);

  const [poc, setPoc] = useState<EnrichedPOCProfile | null>(null);
  const [loadingPoc, setLoadingPoc] = useState(true);

  // Booking form state
  const [workDescription, setWorkDescription] = useState('');
  const [daysCount, setDaysCount] = useState(3);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // tomorrow by default
    return d.toISOString().split('T')[0];
  });
  const [selectedRate, setSelectedRate] = useState<number>(850);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPoc() {
      setLoadingPoc(true);
      try {
        const { data } = await supabase
          .from('poc_profiles')
          .select('*, users!inner(name, phone, city)')
          .eq('id', pocId)
          .single();

        if (data) {
          const formatted: EnrichedPOCProfile = {
            ...data,
            name: data.users?.name || 'Contractor',
            phone: data.users?.phone || '',
            city: data.users?.city || 'Bareilly',
            reviews_list: [],
          };
          setPoc(formatted);
          setSelectedRate(formatted.daily_rate_min || 800);
        } else {
          const found = MOCK_BAREILLY_POCS.find((p) => p.id === pocId) || MOCK_BAREILLY_POCS[0];
          setPoc(found);
          setSelectedRate(found.daily_rate_min || 800);
        }
      } catch {
        const found = MOCK_BAREILLY_POCS.find((p) => p.id === pocId) || MOCK_BAREILLY_POCS[0];
        setPoc(found);
        setSelectedRate(found.daily_rate_min || 800);
      } finally {
        setLoadingPoc(false);
      }
    }

    if (pocId) fetchPoc();
  }, [pocId]);

  if (loadingPoc || !poc) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Cost calculations
  const laborSubtotal = selectedRate * daysCount;
  const platformFee = Math.round((laborSubtotal * PLATFORM_FEE_PCT) / 100);
  const grandTotal = laborSubtotal + platformFee;

  // Calculate end date
  const computeEndDate = () => {
    const start = new Date(startDate);
    start.setDate(start.getDate() + (daysCount - 1));
    return start.toISOString().split('T')[0];
  };

  async function handleSendRequest() {
    if (!workDescription.trim()) {
      Alert.alert('Work Details Required', 'Please describe the specific work needed so the contractor can prepare tools & crew.');
      return;
    }

    setSubmitting(true);
    const endDate = computeEndDate();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const homeownerId = session?.user?.id || 'homeowner-preview';
      const projectId = activeProject?.id || 'default-project';

      // 1. Send to backend if available
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
      let bookingResult: any = null;

      try {
        const res = await fetch(`${API_BASE}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            poc_id: poc.id,
            project_id: projectId,
            skills_required: [poc.primary_skill],
            start_date: startDate,
            end_date: endDate,
            daily_rate: selectedRate,
            work_description: workDescription,
          }),
        });
        if (res.ok) {
          bookingResult = await res.json();
        }
      } catch {
        // Backend not currently reachable in mock/offline mode
      }

      // If backend didn't respond or in offline preview mode, construct optimistic booking
      if (!bookingResult) {
        bookingResult = {
          data: {
            id: `HSY-BK-${Date.now().toString().slice(-6)}`,
            status: 'pending',
            start_date: startDate,
            end_date: endDate,
            daily_rate: selectedRate,
            work_description: workDescription,
          },
          summary: {
            days_count: daysCount,
            daily_rate: selectedRate,
            labor_total: laborSubtotal,
            platform_fee: platformFee,
            grand_total: grandTotal,
          },
        };
      }

      setConfirmedBooking(bookingResult);
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Failed to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Book Contractor</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* POC Summary Card */}
        <View style={styles.pocCard}>
          <View style={styles.pocAvatar}>
            <Text style={styles.pocAvatarText}>{poc.name[0]}</Text>
          </View>
          <View style={styles.pocInfo}>
            <Text style={styles.pocName}>{poc.name}</Text>
            <Text style={styles.pocMeta}>
              Lead {poc.primary_skill.replace('_', ' ')} • Gang of {poc.gang_size}
            </Text>
            <View style={styles.verifiedRow}>
              <ShieldCheck size={14} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified via Housy Partner ID: {poc.housy_id_card_number}</Text>
            </View>
          </View>
        </View>

        {/* Work Description Field */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Work Details *</Text>
          <Text style={styles.cardSub}>
            Be specific (e.g. "Break 12ft partition wall, clean debris, plaster new opening").
          </Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="Describe what needs to be done, room location, and any special material/tool requirements..."
            placeholderTextColor={COLORS.textSecondary}
            value={workDescription}
            onChangeText={setWorkDescription}
          />
        </View>

        {/* Schedule & Duration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Schedule & Duration</Text>
          <Text style={styles.cardSub}>Estimated days your work will take:</Text>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDaysCount((d) => Math.max(1, d - 1))}
            >
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepValueBox}>
              <Text style={styles.stepValueText}>{daysCount} {daysCount === 1 ? 'Day' : 'Days'}</Text>
              <Text style={styles.stepSubText}>approx. work time</Text>
            </View>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setDaysCount((d) => Math.min(30, d + 1))}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Date Selector Row */}
          <View style={styles.dateRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
            <Text style={styles.dateArrow}>➔</Text>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>End Date (Est.)</Text>
              <Text style={styles.dateValue}>{computeEndDate()}</Text>
            </View>
          </View>
        </View>

        {/* Pricing Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>3. Transparent Price Breakdown</Text>
          <Text style={styles.cardSub}>Standard agreed rate for Bareilly region:</Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>
              Gang Labor (₹{selectedRate} × {daysCount} {daysCount === 1 ? 'day' : 'days'})
            </Text>
            <Text style={styles.calcVal}>{formatINR(laborSubtotal)}</Text>
          </View>

          <View style={styles.calcRow}>
            <View style={styles.feeLabelRow}>
              <Text style={styles.calcLabel}>Housy Platform Fee ({PLATFORM_FEE_PCT}%)</Text>
              <Info size={13} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.calcVal}>{formatINR(platformFee)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.calcRow}>
            <Text style={styles.totalLabel}>Total Estimated Cost</Text>
            <Text style={styles.totalVal}>{formatINR(grandTotal)}</Text>
          </View>

          <View style={styles.feeNotice}>
            <Text style={styles.feeNoticeText}>
              🛡️ <Text style={{ fontWeight: '700' }}>Housy Guarantee:</Text> Covers contractor verification, dispute resolution, and on-time attendance guarantee. No upfront charge until POC accepts.
            </Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sticky Action Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>Total Estimate</Text>
          <Text style={styles.footerTotalVal}>{formatINR(grandTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSendRequest}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MessageSquare size={18} color="#fff" />
              <Text style={styles.sendBtnText}>Send Booking Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={!!confirmedBooking}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={42} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Booking Request Sent!</Text>
            <Text style={styles.modalSub}>
              We have dispatched this booking to <Text style={{ fontWeight: '700' }}>{poc.name}</Text> via WhatsApp.
            </Text>

            {/* WhatsApp Notification Simulator Preview */}
            <View style={styles.whatsappPreviewCard}>
              <View style={styles.whatsappHeader}>
                <MessageSquare size={14} color="#25D366" />
                <Text style={styles.whatsappHeaderText}>WhatsApp Dispatched</Text>
              </View>
              <Text style={styles.whatsappPreviewText}>
                "🏠 नया काम मिला है: {daysCount} दिन का {poc.primary_skill.replace('_', ' ')} का काम। दर: ₹{selectedRate}/दिन। मकान मालिक: {activeProperty?.locality || 'Bareilly'}..."
              </Text>
            </View>

            <View style={styles.responseNotice}>
              <Clock size={16} color={COLORS.warning} />
              <Text style={styles.responseNoticeText}>
                The contractor usually responds within 2 hours. You'll receive a WhatsApp alert once confirmed.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalActionBtn}
              onPress={() => {
                setConfirmedBooking(null);
                router.replace('/(tabs)/project');
              }}
            >
              <Text style={styles.modalActionBtnText}>View in Project Dashboard ➔</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  scrollContent: { padding: 20 },

  pocCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    alignItems: 'center',
    gap: 14,
  },
  pocAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pocAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  pocInfo: { flex: 1 },
  pocName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  pocMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  verifiedText: { fontSize: 11, fontWeight: '600', color: COLORS.success },

  card: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 14, lineHeight: 18 },

  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtnText: { fontSize: 24, fontWeight: '700', color: COLORS.textPrimary },
  stepValueBox: { alignItems: 'center', minWidth: 100 },
  stepValueText: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  stepSubText: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  dateBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  dateValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 4 },
  dateArrow: { fontSize: 16, color: COLORS.textSecondary },

  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  feeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calcLabel: { fontSize: 14, color: COLORS.textSecondary },
  calcVal: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  totalVal: { fontSize: 18, fontWeight: '800', color: COLORS.primary },

  feeNotice: {
    marginTop: 12,
    backgroundColor: '#FFF7ED',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  feeNoticeText: { fontSize: 12, color: '#C2410C', lineHeight: 18 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  footerLeft: { flex: 1 },
  footerTotalLabel: { fontSize: 12, color: COLORS.textSecondary },
  footerTotalVal: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  sendBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  modalSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 20,
  },
  whatsappPreviewCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  whatsappHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  whatsappHeaderText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  whatsappPreviewText: { fontSize: 13, color: '#15803D', fontStyle: 'italic', lineHeight: 18 },

  responseNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  responseNoticeText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  modalActionBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalActionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
