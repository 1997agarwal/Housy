import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Alert, Share,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ArrowLeft, Share2, Save, Droplets, Hammer,
  CheckCircle2, AlertTriangle, Layers, Info, Sparkles
} from 'lucide-react-native';
import { COLORS, formatINR } from '../../lib/utils';
import { SAMPLE_BAREILLY_FLOOR_PLAN, calculateDrainageDistance } from '../../lib/mockFloorPlan';
import { RoomLayout, FloorPlan } from '@housy/shared';

const { width } = Dimensions.get('window');

export default function FloorPlanViewerScreen() {
  const [plan, setPlan] = useState<FloorPlan>(SAMPLE_BAREILLY_FLOOR_PLAN);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('room-bed-2');
  const [showDrainageOverlay, setShowDrainageOverlay] = useState(true);

  const selectedRoom = plan.rooms.find((r) => r.id === selectedRoomId) || plan.rooms[0];
  const existingBathRoom = plan.rooms.find((r) => r.id === plan.existing_drainage_room_id) || plan.rooms[3];

  // Compute drainage feasibility
  const drainageAnalysis = calculateDrainageDistance(existingBathRoom, selectedRoom);

  function toggleRenovationTarget(roomId: string) {
    setPlan((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              is_renovation_target: !r.is_renovation_target,
              renovation_type: !r.is_renovation_target ? 'new_bathroom' : undefined,
              renovation_notes: !r.is_renovation_target ? 'Carving out attached second bathroom partition.' : undefined,
            }
          : r
      ),
    }));
  }

  async function handleShare() {
    const summary = `🏠 HOUSY 2D Floor Plan — Bareilly Property\nTotal Area: ${plan.total_area_sq_ft} sq ft\nRooms: ${plan.rooms.map(r => `${r.name} (${r.length_ft}'x${r.width_ft}')`).join(', ')}`;
    try {
      await Share.share({ message: summary });
    } catch {
      // Ignored
    }
  }

  function handleSave() {
    Alert.alert('Floor Plan Saved', '2D Blueprint successfully saved to your property profile.');
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.topBarTitle}>2D Blueprint Studio</Text>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Share2 size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Blueprint Canvas Header */}
        <View style={styles.canvasHeader}>
          <View>
            <Text style={styles.canvasTitle}>Architectural Schematic</Text>
            <Text style={styles.canvasSub}>Tap any room to inspect or mark renovation zones</Text>
          </View>
          <TouchableOpacity
            style={[styles.drainageToggle, showDrainageOverlay && styles.drainageToggleActive]}
            onPress={() => setShowDrainageOverlay(!showDrainageOverlay)}
          >
            <Droplets size={14} color={showDrainageOverlay ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.drainageToggleText, showDrainageOverlay && styles.drainageToggleTextActive]}>
              Drainage Overlay
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2D Architectural Blueprint Canvas */}
        <View style={styles.blueprintFrame}>
          {/* Blueprint Grid Lines */}
          <View style={styles.blueprintGrid} />

          {/* North Indicator */}
          <View style={styles.compassIndicator}>
            <Text style={styles.compassText}>▲ N</Text>
          </View>

          {/* Exterior Wall Boundary Container */}
          <View style={styles.wallsContainer}>
            {/* ROW 1: Living Hall (Left) & Master Bed (Right) */}
            <View style={styles.layoutRow}>
              {/* Living Room */}
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 1.4 },
                  selectedRoomId === 'room-living' && styles.roomBlockSelected,
                ]}
                onPress={() => setSelectedRoomId('room-living')}
                activeOpacity={0.8}
              >
                <Text style={styles.roomNameBadge}>Living Hall & Courtyard</Text>
                <Text style={styles.roomDimBadge}>20'0" × 15'0"</Text>
                <Text style={styles.roomSqFtBadge}>300 sq ft</Text>
                <View style={styles.doorIndicatorSouth}>
                  <Text style={styles.doorText}>[ Main Door ]</Text>
                </View>
              </TouchableOpacity>

              {/* Master Bedroom */}
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 1.1 },
                  selectedRoomId === 'room-bed-1' && styles.roomBlockSelected,
                ]}
                onPress={() => setSelectedRoomId('room-bed-1')}
                activeOpacity={0.8}
              >
                <Text style={styles.roomNameBadge}>Master Bedroom</Text>
                <Text style={styles.roomDimBadge}>15'0" × 13'0"</Text>
                <Text style={styles.roomSqFtBadge}>195 sq ft</Text>
                <View style={styles.windowIndicatorEast}>
                  <Text style={styles.windowText}>Window</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ROW 2: Bedroom 2, Existing Bathroom & Kitchen */}
            <View style={styles.layoutRow}>
              {/* Bedroom 2 (Proposed Renovation Target) */}
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 1.2, backgroundColor: '#FFF7ED' },
                  selectedRoomId === 'room-bed-2' && styles.roomBlockSelected,
                  plan.rooms.find(r => r.id === 'room-bed-2')?.is_renovation_target && styles.roomRenovationBorder,
                ]}
                onPress={() => setSelectedRoomId('room-bed-2')}
                activeOpacity={0.8}
              >
                <View style={styles.targetFlag}>
                  <Hammer size={10} color="#C2410C" />
                  <Text style={styles.targetFlagText}>RENO TARGET</Text>
                </View>
                <Text style={[styles.roomNameBadge, { color: '#C2410C' }]}>Bedroom 2</Text>
                <Text style={styles.roomDimBadge}>14'0" × 12'0"</Text>
                <Text style={styles.roomSqFtBadge}>168 sq ft</Text>

                {/* Proposed 2nd Bathroom Partition Outline */}
                {plan.rooms.find(r => r.id === 'room-bed-2')?.is_renovation_target && (
                  <View style={styles.proposedBathBox}>
                    <Text style={styles.proposedBathText}>Proposed 2nd Bath (6'×7')</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Existing Bathroom (Septic line connection) */}
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 0.8, backgroundColor: '#ECFDF5' },
                  selectedRoomId === 'room-bath-1' && styles.roomBlockSelected,
                ]}
                onPress={() => setSelectedRoomId('room-bath-1')}
                activeOpacity={0.8}
              >
                <View style={styles.septicBadge}>
                  <Droplets size={10} color="#059669" />
                  <Text style={styles.septicBadgeText}>SEPTIC TRAP</Text>
                </View>
                <Text style={[styles.roomNameBadge, { color: '#065F46' }]}>Existing Bath</Text>
                <Text style={styles.roomDimBadge}>8'0" × 6'0"</Text>
                <Text style={styles.roomSqFtBadge}>48 sq ft</Text>
              </TouchableOpacity>

              {/* Kitchen */}
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 0.9 },
                  selectedRoomId === 'room-kitchen' && styles.roomBlockSelected,
                ]}
                onPress={() => setSelectedRoomId('room-kitchen')}
                activeOpacity={0.8}
              >
                <Text style={styles.roomNameBadge}>Kitchen</Text>
                <Text style={styles.roomDimBadge}>12'0" × 9'0"</Text>
                <Text style={styles.roomSqFtBadge}>108 sq ft</Text>
              </TouchableOpacity>
            </View>

            {/* ROW 3: Bedroom 3 (Front) */}
            <View style={styles.layoutRow}>
              <TouchableOpacity
                style={[
                  styles.roomCanvasBlock,
                  { flex: 1.3 },
                  selectedRoomId === 'room-bed-3' && styles.roomBlockSelected,
                ]}
                onPress={() => setSelectedRoomId('room-bed-3')}
                activeOpacity={0.8}
              >
                <Text style={styles.roomNameBadge}>Bedroom 3 (Front)</Text>
                <Text style={styles.roomDimBadge}>14'0" × 12'0"</Text>
                <Text style={styles.roomSqFtBadge}>168 sq ft</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Drainage Route Overlay Line (Visual connection between Bath 1 and selected room) */}
          {showDrainageOverlay && selectedRoom.id !== 'room-bath-1' && (
            <View style={styles.drainageRouteOverlay}>
              <View style={styles.pipeLineDashed} />
              <View style={styles.pipePill}>
                <Droplets size={12} color="#059669" />
                <Text style={styles.pipePillText}>
                  Drainage run: ~{drainageAnalysis.distance_ft} ft to Existing Septic Trap
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Selected Room Inspector & Renovation Zone Details */}
        <View style={styles.inspectorCard}>
          <View style={styles.inspectorTop}>
            <View>
              <Text style={styles.inspectorRoomName}>{selectedRoom.name}</Text>
              <Text style={styles.inspectorMeta}>
                {selectedRoom.length_ft}' × {selectedRoom.width_ft}' ({selectedRoom.area_sq_ft} sq ft) • Type: {selectedRoom.type.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.renoToggleBtn,
                selectedRoom.is_renovation_target && styles.renoToggleBtnActive,
              ]}
              onPress={() => toggleRenovationTarget(selectedRoom.id)}
            >
              <Hammer size={14} color={selectedRoom.is_renovation_target ? '#fff' : COLORS.primary} />
              <Text
                style={[
                  styles.renoToggleText,
                  selectedRoom.is_renovation_target && styles.renoToggleTextActive,
                ]}
              >
                {selectedRoom.is_renovation_target ? 'Renovation Zone ✓' : '+ Mark for Renovation'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drainage Feasibility Analysis for this Room */}
          <View style={styles.drainageAnalysisBox}>
            <View style={styles.analysisHeader}>
              <Droplets size={16} color="#0284C7" />
              <Text style={styles.analysisTitle}>Drainage & Plumbing Feasibility</Text>
            </View>

            {selectedRoom.id === 'room-bath-1' ? (
              <Text style={styles.analysisText}>
                This is your primary existing bathroom with the main ground-floor soil pipe and drainage outlet connected to the city sewer / septic tank.
              </Text>
            ) : (
              <View>
                <Text style={styles.analysisText}>
                  Distance to Existing Septic Outlet: <Text style={{ fontWeight: '800' }}>~{drainageAnalysis.distance_ft} feet</Text>
                </Text>
                <Text style={[styles.analysisText, { marginTop: 4 }]}>
                  Estimated PVC/CPVC Pipe & Trenching: <Text style={{ fontWeight: '800' }}>{formatINR(drainageAnalysis.est_pipe_cost)}</Text>
                </Text>

                {drainageAnalysis.trenching_required && (
                  <View style={styles.warningNote}>
                    <AlertTriangle size={15} color="#D97706" />
                    <Text style={styles.warningNoteText}>
                      <Text style={{ fontWeight: '700' }}>Architectural Recommendation:</Text> To add a bathroom in this room, place it on the shared wall with Existing Bath (North side) to cut floor trenching down to 4 ft and save ~₹15,000 in tile breakage!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Save & Action Buttons */}
        <View style={styles.actionsFooter}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Save size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Floor Plan to Property</Text>
          </TouchableOpacity>
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

  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  canvasTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  canvasSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  drainageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  drainageToggleActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  drainageToggleText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  drainageToggleTextActive: { color: '#fff' },

  blueprintFrame: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#334155',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    minHeight: 340,
  },
  blueprintGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  compassIndicator: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compassText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },

  wallsContainer: { gap: 10, marginTop: 14 },
  layoutRow: { flexDirection: 'row', gap: 10 },

  roomCanvasBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    padding: 12,
    minHeight: 95,
    justifyContent: 'center',
    position: 'relative',
  },
  roomBlockSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#334155',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  roomRenovationBorder: {
    borderColor: '#EA580C',
    borderStyle: 'dashed',
  },

  roomNameBadge: { fontSize: 12, fontWeight: '800', color: '#F8FAFC' },
  roomDimBadge: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  roomSqFtBadge: { fontSize: 10, color: '#64748B', marginTop: 2 },

  doorIndicatorSouth: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  doorText: { fontSize: 8, color: '#F1F5F9', fontWeight: '700' },

  windowIndicatorEast: {
    position: 'absolute',
    right: -2,
    alignSelf: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  windowText: { fontSize: 8, color: '#fff', fontWeight: '700' },

  targetFlag: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  targetFlagText: { fontSize: 8, fontWeight: '800', color: '#C2410C' },

  proposedBathBox: {
    marginTop: 8,
    backgroundColor: '#FED7AA',
    borderWidth: 1,
    borderColor: '#EA580C',
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
  },
  proposedBathText: { fontSize: 9, fontWeight: '800', color: '#9A3412' },

  septicBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  septicBadgeText: { fontSize: 8, fontWeight: '800', color: '#065F46' },

  drainageRouteOverlay: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  pipeLineDashed: {
    width: '90%',
    height: 2,
    borderWidth: 1,
    borderColor: '#059669',
    borderStyle: 'dashed',
    marginBottom: 6,
  },
  pipePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pipePillText: { fontSize: 11, fontWeight: '700', color: '#A7F3D0' },

  inspectorCard: {
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inspectorTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inspectorRoomName: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  inspectorMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  renoToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD5C2',
  },
  renoToggleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  renoToggleText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  renoToggleTextActive: { color: '#fff' },

  drainageAnalysisBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  analysisTitle: { fontSize: 13, fontWeight: '800', color: '#0369A1' },
  analysisText: { fontSize: 12, color: '#0C4A6E', lineHeight: 18 },

  warningNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningNoteText: { flex: 1, fontSize: 11, color: '#92400E', lineHeight: 16 },

  actionsFooter: { gap: 10 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
