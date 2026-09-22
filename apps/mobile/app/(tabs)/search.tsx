import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ScrollView, ActivityIndicator,
} from 'react-native';
import { MapPin, Star, Shield, Search as SearchIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { COLORS } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { POCProfile, WorkerSkill } from '@housy/shared';

const SKILLS: { key: WorkerSkill; label: string }[] = [
  { key: 'mason',        label: '🧱 Mason'       },
  { key: 'plumber',      label: '🔧 Plumber'     },
  { key: 'electrician',  label: '⚡ Electrician'  },
  { key: 'tiles_fixer',  label: '🟫 Tiles Fixer'  },
  { key: 'painter',      label: '🖌️ Painter'      },
  { key: 'carpenter',    label: '🪵 Carpenter'    },
];

import { useEffect } from 'react';
import { MOCK_BAREILLY_POCS } from '../../lib/mockData';

export default function SearchScreen() {
  const [selectedSkill, setSelectedSkill] = useState<WorkerSkill | null>(null);
  const [location, setLocation]           = useState('Bareilly');
  const [results, setResults]             = useState<any[]>(MOCK_BAREILLY_POCS);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(true);

  useEffect(() => {
    search();
  }, [selectedSkill]);

  async function search() {
    setLoading(true);
    setSearched(true);
    try {
      let query = supabase
        .from('poc_profiles')
        .select('*, users(name, phone)')
        .eq('is_available', true)
        .order('rating_avg', { ascending: false });

      if (selectedSkill) {
        query = query.contains('skills_available', [selectedSkill]);
      }
      if (location) {
        query = query.contains('areas_served', [location]);
      }

      const { data } = await query.limit(20);
      if (data && data.length > 0) {
        setResults(data);
      } else {
        // Fallback filter over mock data
        let filtered = [...MOCK_BAREILLY_POCS];
        if (selectedSkill) {
          filtered = filtered.filter((p) => p.skills_available.includes(selectedSkill));
        }
        if (location && location.toLowerCase() !== 'bareilly') {
          filtered = filtered.filter((p) =>
            p.areas_served.some((a) => a.toLowerCase().includes(location.toLowerCase()))
          );
        }
        setResults(filtered);
      }
    } catch {
      let filtered = [...MOCK_BAREILLY_POCS];
      if (selectedSkill) {
        filtered = filtered.filter((p) => p.skills_available.includes(selectedSkill));
      }
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Labor</Text>
        <Text style={styles.sub}>Verified POCs & Mistris near you</Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MapPin size={16} color={COLORS.primary} />
          <TextInput
            style={styles.locationInput}
            value={location}
            onChangeText={setLocation}
            placeholder="City or area..."
          />
        </View>

        {/* Skill filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {SKILLS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, selectedSkill === key && styles.chipActive]}
              onPress={() => setSelectedSkill(selectedSkill === key ? null : key)}
            >
              <Text style={[styles.chipText, selectedSkill === key && styles.chipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search button */}
        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <SearchIcon size={18} color="#fff" />
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} size="large" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            searched ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No POCs found</Text>
                <Text style={styles.emptySub}>
                  Try a different skill or area. Our field agents are onboarding more workers daily.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>👷</Text>
                <Text style={styles.emptyTitle}>Find the right worker</Text>
                <Text style={styles.emptySub}>Select a skill and hit Search to see verified POCs near you.</Text>
              </View>
            )
          }
          renderItem={({ item }) => <POCCard poc={item} />}
        />
      )}
    </View>
  );
}

function POCCard({ poc }: { poc: POCProfile & { users?: { name: string } } }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/poc/[id]', params: { id: poc.id } } as any)}
      activeOpacity={0.85}
    >
      {/* Avatar */}
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>
          {((poc as any).users?.name?.[0] || (poc as any).name?.[0] || '?').toUpperCase()}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName}>{(poc as any).users?.name || (poc as any).name || 'POC'}</Text>
          {poc.is_verified && (
            <View style={styles.verifiedBadge}>
              <Shield size={11} color={COLORS.success} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardRole}>
          {poc.primary_skill.replace('_', ' ')} • {poc.years_experience} yr exp •
          Gang of {poc.gang_size}
        </Text>

        <View style={styles.cardBottomRow}>
          <View style={styles.ratingRow}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.rating}>{poc.rating_avg.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({poc.review_count})</Text>
          </View>
          <Text style={styles.rate}>
            ₹{poc.daily_rate_min}–{poc.daily_rate_max}/day
          </Text>
          <View style={[styles.availChip,
            poc.is_available ? styles.availGreen : styles.availGray]}>
            <Text style={[styles.availText,
              { color: poc.is_available ? COLORS.success : COLORS.textSecondary }]}>
              {poc.is_available ? 'Available Now' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  header:        { backgroundColor: COLORS.background, paddingTop: 60, paddingHorizontal: 20,
                   paddingBottom: 12, borderBottomWidth: 1, borderColor: COLORS.border },
  title:         { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  sub:           { fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 },
  locationRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
                   borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
                   borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  locationInput: { flex: 1, marginLeft: 8, fontSize: 15, color: COLORS.textPrimary },
  chips:         { marginBottom: 12 },
  chip:          { backgroundColor: COLORS.surface, borderRadius: 20, paddingHorizontal: 14,
                   paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText:      { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  chipTextActive:{ color: '#fff' },
  searchBtn:     { backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row',
                   alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  list:          { padding: 16 },
  card:          { flexDirection: 'row', backgroundColor: COLORS.background, borderRadius: 14,
                   padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardAvatar:    { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary,
                   alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardAvatarText:{ color: '#fff', fontWeight: '700', fontSize: 20 },
  cardBody:      { flex: 1 },
  cardTopRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 3, gap: 8 },
  cardName:      { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3,
                   backgroundColor: '#EEFAF3', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText:  { fontSize: 11, color: COLORS.success, fontWeight: '700' },
  cardRole:      { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10, textTransform: 'capitalize' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating:        { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  ratingCount:   { fontSize: 12, color: COLORS.textSecondary },
  rate:          { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  availChip:     { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  availGreen:    { backgroundColor: '#EEFAF3' },
  availGray:     { backgroundColor: COLORS.surface },
  availText:     { fontSize: 11, fontWeight: '700' },
  empty:         { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon:     { fontSize: 48, marginBottom: 16 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptySub:      { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
