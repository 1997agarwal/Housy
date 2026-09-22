import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, FlatList,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ArrowLeft, Plus, CheckCircle2, Trash2,
  Compass, Droplets, Zap, Layers, ArrowRight
} from 'lucide-react-native';
import { COLORS } from '../../lib/utils';
import { RoomType, RoomLayout } from '@housy/shared';

const ROOM_TYPES: { type: RoomType; label: string; icon: string; defaultPlumbing: boolean }[] = [
  { type: 'bedroom',  label: 'Bedroom',   icon: '🛏️', defaultPlumbing: false },
  { type: 'bathroom', label: 'Bathroom',  icon: '🚿', defaultPlumbing: true  },
  { type: 'kitchen',  label: 'Kitchen',   icon: '🍳', defaultPlumbing: true  },
  { type: 'living',   label: 'Living',    icon: '🛋️', defaultPlumbing: false },
  { type: 'dining',   label: 'Dining',    icon: '🍽️', defaultPlumbing: false },
  { type: 'balcony',  label: 'Balcony',   icon: '🪴', defaultPlumbing: true  },
  { type: 'utility',  label: 'Utility',   icon: '🧺', defaultPlumbing: true  },
];

const WALL_DIRECTIONS = ['north', 'south', 'east', 'west'] as const;

export default function FloorPlanWizardScreen() {
  const [rooms, setRooms] = useState<RoomLayout[]>([
    {
      id: 'room-1',
      name: 'Living Hall',
      type: 'living',
      length_ft: 20,
      width_ft: 15,
      area_sq_ft: 300,
      doors: [{ wall: 'south', position_pct: 50 }],
      windows: [{ wall: 'north', position_pct: 50 }],
      has_plumbing: false,
      has_electrical: true,
    },
    {
      id: 'room-2',
      name: 'Master Bedroom',
      type: 'bedroom',
      length_ft: 15,
      width_ft: 13,
      area_sq_ft: 195,
      doors: [{ wall: 'west', position_pct: 20 }],
      windows: [{ wall: 'east', position_pct: 50 }],
      has_plumbing: false,
      has_electrical: true,
    },
    {
      id: 'room-3',
      name: 'Existing Washroom',
      type: 'bathroom',
      length_ft: 8,
      width_ft: 6,
      area_sq_ft: 48,
      doors: [{ wall: 'north', position_pct: 50 }],
      windows: [{ wall: 'south', position_pct: 50 }],
      has_plumbing: true,
      has_electrical: true,
    },
  ]);

  // Current new room form
  const [selectedType, setSelectedType] = useState<RoomType>('bedroom');
  const [customName, setCustomName] = useState('');
  const [lengthFt, setLengthFt] = useState(14);
  const [widthFt, setWidthFt] = useState(12);
  const [doorWall, setDoorWall] = useState<'north' | 'south' | 'east' | 'west'>('south');
  const [hasPlumbing, setHasPlumbing] = useState(false);

  const totalCalculatedArea = rooms.reduce((sum, r) => sum + r.area_sq_ft, 0);

  function handleAddRoom() {
    const defaultLabel = ROOM_TYPES.find((r) => r.type === selectedType)?.label || 'Room';
    const finalName = customName.trim() || `${defaultLabel} ${rooms.filter((r) => r.type === selectedType).length + 1}`;

    const newRoom: RoomLayout = {
      id: `room-${Date.now().toString().slice(-4)}`,
      name: finalName,
      type: selectedType,
      length_ft: lengthFt,
      width_ft: widthFt,
      area_sq_ft: lengthFt * widthFt,
      doors: [{ wall: doorWall, position_pct: 50 }],
      has_plumbing: hasPlumbing,
      has_electrical: true,
    };

    setRooms((prev) => [...prev, newRoom]);
    setCustomName('');
    Alert.alert('Room Added', `Added "${finalName}" (${lengthFt}' × ${widthFt}').`);
  }

  function handleDeleteRoom(id: string) {
    setRooms((prev) => prev.filter((r) => r.id !== id));
  }

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
        <Text style={styles.topBarTitle}>Manual Room Wizard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Room Builder Form */}
        <View style={styles.formCard}>
          <Text style={styles.formCardTitle}>Add Room to Floor Plan</Text>

          {/* Room Type Selector */}
          <Text style={styles.fieldLabel}>1. Room Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {ROOM_TYPES.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={[
                  styles.typeBtn,
                  selectedType === item.type && styles.typeBtnActive,
                ]}
                onPress={() => {
                  setSelectedType(item.type);
                  setHasPlumbing(item.defaultPlumbing);
                }}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.typeText,
                    selectedType === item.type && styles.typeTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Custom Room Name */}
          <Text style={styles.fieldLabel}>2. Room Label (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Bedroom 3, Puja Room, Attached Bath..."
            placeholderTextColor={COLORS.textSecondary}
            value={customName}
            onChangeText={setCustomName}
          />

          {/* Dimension Steppers */}
          <Text style={styles.fieldLabel}>3. Dimensions (Feet)</Text>
          <View style={styles.steppersRow}>
            {/* Length */}
            <View style={styles.stepperCol}>
              <Text style={styles.stepLabel}>Length (ft)</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setLengthFt((l) => Math.max(4, l - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValText}>{lengthFt} ft</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setLengthFt((l) => l + 1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Width */}
            <View style={styles.stepperCol}>
              <Text style={styles.stepLabel}>Width (ft)</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWidthFt((w) => Math.max(4, w - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValText}>{widthFt} ft</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setWidthFt((w) => w + 1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Door Wall Position */}
          <Text style={styles.fieldLabel}>4. Door Location Wall</Text>
          <View style={styles.wallsRow}>
            {WALL_DIRECTIONS.map((dir) => (
              <TouchableOpacity
                key={dir}
                style={[
                  styles.wallBtn,
                  doorWall === dir && styles.wallBtnActive,
                ]}
                onPress={() => setDoorWall(dir)}
              >
                <Text
                  style={[
                    styles.wallBtnText,
                    doorWall === dir && styles.wallBtnTextActive,
                  ]}
                >
                  {dir.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plumbing toggle */}
          <TouchableOpacity
            style={[styles.plumbingToggle, hasPlumbing && styles.plumbingToggleActive]}
            onPress={() => setHasPlumbing(!hasPlumbing)}
          >
            <Droplets size={16} color={hasPlumbing ? '#059669' : COLORS.textSecondary} />
            <Text style={[styles.plumbingText, hasPlumbing && styles.plumbingTextActive]}>
              This room has water / drainage pipeline (Plumbing connection)
            </Text>
          </TouchableOpacity>

          {/* Add Room Button */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAddRoom}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add Room ({lengthFt * widthFt} sq ft)</Text>
          </TouchableOpacity>
        </View>

        {/* List of Configured Rooms */}
        <View style={styles.configuredSection}>
          <View style={styles.configuredHeader}>
            <Text style={styles.configuredTitle}>Configured Rooms ({rooms.length})</Text>
            <Text style={styles.totalAreaBadge}>Total: ~{totalCalculatedArea} sq ft</Text>
          </View>

          {rooms.map((room) => (
            <View key={room.id} style={styles.roomItemCard}>
              <View style={styles.roomItemLeft}>
                <View style={styles.roomItemIconBox}>
                  <Text style={styles.roomItemIcon}>
                    {ROOM_TYPES.find((r) => r.type === room.type)?.icon || '🚪'}
                  </Text>
                </View>
                <View>
                  <Text style={styles.roomItemName}>{room.name}</Text>
                  <Text style={styles.roomItemMeta}>
                    {room.length_ft}' × {room.width_ft}' ({room.area_sq_ft} sq ft) • Door on {room.doors?.[0]?.wall}
                  </Text>
                  {room.has_plumbing && (
                    <Text style={styles.plumbingIndicator}>💧 Has Drainage Connection</Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteRoom(room.id)}
              >
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Button: Generate 2D Blueprint */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={() => router.push('/floor-plan/viewer' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.generateBtnText}>Generate 2D Blueprint ➔</Text>
        </TouchableOpacity>

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

  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  formCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: 10 },

  typeScroll: { flexDirection: 'row', marginBottom: 10 },
  typeBtn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 70,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#FFF0EB' },
  typeIcon: { fontSize: 18, marginBottom: 4 },
  typeText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  typeTextActive: { color: COLORS.primary, fontWeight: '700' },

  textInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  steppersRow: { flexDirection: 'row', gap: 12 },
  stepperCol: { flex: 1 },
  stepLabel: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  stepValText: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },

  wallsRow: { flexDirection: 'row', gap: 8 },
  wallBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wallBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  wallBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  wallBtnTextActive: { color: '#fff' },

  plumbingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plumbingToggleActive: { backgroundColor: '#ECFDF5', borderColor: '#86EFAC' },
  plumbingText: { flex: 1, fontSize: 12, color: COLORS.textSecondary },
  plumbingTextActive: { color: '#065F46', fontWeight: '600' },

  addBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  configuredSection: { marginBottom: 24 },
  configuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  configuredTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  totalAreaBadge: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  roomItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roomItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  roomItemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomItemIcon: { fontSize: 20 },
  roomItemName: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  roomItemMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  plumbingIndicator: { fontSize: 10, color: '#059669', fontWeight: '700', marginTop: 2 },
  deleteBtn: { padding: 8 },

  generateBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
