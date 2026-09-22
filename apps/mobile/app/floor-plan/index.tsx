import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ArrowLeft, Camera, Edit3, Compass, Maximize2,
  CheckCircle2, Sparkles, AlertCircle, Layers
} from 'lucide-react-native';
import { COLORS, formatINR } from '../../lib/utils';
import { useAppStore } from '../../store/app.store';
import { SAMPLE_BAREILLY_FLOOR_PLAN } from '../../lib/mockFloorPlan';
import { FloorPlan } from '@housy/shared';

const { width } = Dimensions.get('window');

export default function FloorPlanStudioScreen() {
  const [selectedOption, setSelectedOption] = useState<'camera' | 'wizard'>('camera');
  const [activePlan, setActivePlan] = useState<FloorPlan>(SAMPLE_BAREILLY_FLOOR_PLAN);
  const activeProperty = useAppStore((s) => s.activeProperty);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Navigation */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Floor Plan Studio</Text>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push('/floor-plan/viewer' as any)}
          activeOpacity={0.8}
        >
          <Maximize2 size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.mainTitle}>Create Your Floor Plan</Text>
          <Text style={styles.mainSub}>
            Generate an architectural 2D schematic of your property to plan wall breaking, check drainage feasibility, and briefing contractors.
          </Text>
        </View>

        {/* Two Creation Options (Screen 3.2) */}
        <View style={styles.optionsRow}>
          {/* Option A: Camera Scan */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'camera' && styles.optionCardActive,
            ]}
            onPress={() => setSelectedOption('camera')}
            activeOpacity={0.85}
          >
            <View style={styles.badgeRow}>
              <View style={styles.recommendedBadge}>
                <Sparkles size={11} color="#C2410C" />
                <Text style={styles.recommendedBadgeText}>RECOMMENDED</Text>
              </View>
            </View>
            <View style={[styles.iconCircle, selectedOption === 'camera' && styles.iconCircleActive]}>
              <Camera size={26} color={selectedOption === 'camera' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <Text style={styles.optionTitle}>Scan with Camera</Text>
            <Text style={styles.optionDesc}>
              Take 4 corner photos per room. Gemini AI vision calculates room lengths, doors & structural beams.
            </Text>
            <View style={styles.optionFooter}>
              <Text style={styles.optionTag}>⚡ Takes ~3 mins</Text>
            </View>
          </TouchableOpacity>

          {/* Option B: Manual Wizard */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedOption === 'wizard' && styles.optionCardActive,
            ]}
            onPress={() => setSelectedOption('wizard')}
            activeOpacity={0.85}
          >
            <View style={styles.badgeRow}>
              <View style={[styles.recommendedBadge, { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.recommendedBadgeText, { color: COLORS.textSecondary }]}>STEP-BY-STEP</Text>
              </View>
            </View>
            <View style={[styles.iconCircle, selectedOption === 'wizard' && styles.iconCircleActive]}>
              <Edit3 size={24} color={selectedOption === 'wizard' ? COLORS.primary : COLORS.textSecondary} />
            </View>
            <Text style={styles.optionTitle}>Answer Questions</Text>
            <Text style={styles.optionDesc}>
              Enter dimensions room-by-room (length, width, door/window placement). We build the schematic.
            </Text>
            <View style={styles.optionFooter}>
              <Text style={styles.optionTag}>📐 Manual Precision</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Button for Selected Option */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (selectedOption === 'camera') {
              router.push('/floor-plan/camera-scan' as any);
            } else {
              router.push('/floor-plan/wizard' as any);
            }
          }}
          activeOpacity={0.85}
        >
          {selectedOption === 'camera' ? (
            <>
              <Camera size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Launch Camera Scanner →</Text>
            </>
          ) : (
            <>
              <Edit3 size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Start Guided Wizard →</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 2D Schematic Preview Card (Screen 3.2 Preview) */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewTitle}>Active 2D Floor Plan Preview</Text>
              <Text style={styles.previewSub}>
                {activePlan.rooms.length} Rooms • Total ~{activePlan.total_area_sq_ft} sq ft
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewFullBtn}
              onPress={() => router.push('/floor-plan/viewer' as any)}
            >
              <Text style={styles.viewFullBtnText}>Open Viewer</Text>
              <Maximize2 size={12} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Mini Architectural Blueprint Canvas */}
          <View style={styles.blueprintMiniCanvas}>
            {/* Background Grid Pattern Lines */}
            <View style={styles.gridOverlay} />

            {/* Room Boxes Preview */}
            <View style={styles.roomsGridContainer}>
              <View style={styles.roomRow}>
                <View style={[styles.miniRoomBox, { flex: 1.4, backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
                  <Text style={styles.miniRoomName}>Living Hall</Text>
                  <Text style={styles.miniRoomDim}>20' × 15'</Text>
                </View>
                <View style={[styles.miniRoomBox, { flex: 1.1, backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                  <Text style={styles.miniRoomName}>Master Bed</Text>
                  <Text style={styles.miniRoomDim}>15' × 13'</Text>
                </View>
              </View>

              <View style={styles.roomRow}>
                <View style={[styles.miniRoomBox, { flex: 1.2, backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
                  <View style={styles.renoTargetChip}>
                    <Text style={styles.renoTargetText}>Renovation Zone</Text>
                  </View>
                  <Text style={styles.miniRoomName}>Bedroom 2</Text>
                  <Text style={styles.miniRoomDim}>14' × 12'</Text>
                </View>

                <View style={[styles.miniRoomBox, { flex: 0.7, backgroundColor: '#ECFDF5', borderColor: '#86EFAC' }]}>
                  <Text style={styles.miniRoomName}>Existing Bath</Text>
                  <Text style={styles.miniRoomDim}>8' × 6'</Text>
                  <Text style={styles.miniPlumbingTag}>💧 Drainage</Text>
                </View>

                <View style={[styles.miniRoomBox, { flex: 0.9, backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                  <Text style={styles.miniRoomName}>Kitchen</Text>
                  <Text style={styles.miniRoomDim}>12' × 9'</Text>
                </View>
              </View>

              <View style={styles.roomRow}>
                <View style={[styles.miniRoomBox, { flex: 1.2, backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }]}>
                  <Text style={styles.miniRoomName}>Bedroom 3 (Front)</Text>
                  <Text style={styles.miniRoomDim}>14' × 12'</Text>
                </View>
              </View>
            </View>

            {/* Drainage Pipe Feasibility Callout */}
            <View style={styles.drainageCallout}>
              <View style={styles.drainageDot} />
              <Text style={styles.drainageText}>
                Drainage Outlet located at Existing Bath (North-East). Pipeline extension to Bedroom 2 is ~18 ft.
              </Text>
            </View>
          </View>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why build a floor plan first?</Text>
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: '700' }}>Accurate Material Estimation:</Text> Prevents over-ordering cement and tiles.
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: '700' }}>Drainage & Plumbing Feasibility:</Text> Know if you need to break floors before adding bathrooms.
            </Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle2 size={16} color={COLORS.success} />
            <Text style={styles.benefitText}>
              <Text style={{ fontWeight: '700' }}>Direct Contractor Briefing:</Text> Share the 2D layout with Mistris on WhatsApp.
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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
  header: { marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
  mainSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 20 },

  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF8F5',
  },
  badgeRow: { height: 22, marginBottom: 8 },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendedBadgeText: { fontSize: 9, fontWeight: '800', color: '#C2410C' },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  iconCircleActive: {
    backgroundColor: '#FFF0EB',
    borderColor: '#FFD5C2',
  },
  optionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  optionDesc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, lineHeight: 16 },
  optionFooter: { marginTop: 12 },
  optionTag: { fontSize: 10, fontWeight: '700', color: COLORS.primary },

  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  previewCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  previewSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewFullBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  blueprintMiniCanvas: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: '#0F172A',
  },
  roomsGridContainer: {
    gap: 8,
  },
  roomRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniRoomBox: {
    borderRadius: 8,
    borderWidth: 1.5,
    padding: 10,
    minHeight: 70,
    justifyContent: 'center',
    position: 'relative',
  },
  miniRoomName: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  miniRoomDim: { fontSize: 10, color: '#64748B', marginTop: 2 },
  miniPlumbingTag: { fontSize: 9, fontWeight: '800', color: '#059669', marginTop: 4 },
  renoTargetChip: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  renoTargetText: { fontSize: 8, fontWeight: '800', color: '#C2410C' },

  drainageCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  drainageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  drainageText: { flex: 1, fontSize: 10, color: '#475569', lineHeight: 14 },

  benefitsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 12 },
  benefitItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  benefitText: { flex: 1, fontSize: 12, color: COLORS.textPrimary, lineHeight: 18 },
});
