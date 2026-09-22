import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  ArrowLeft, Star, Shield, Users, Award, MapPin,
  CheckCircle, Phone, Calendar, Image as ImageIcon
} from 'lucide-react-native';
import { COLORS, formatINR } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { MOCK_BAREILLY_POCS, EnrichedPOCProfile } from '../../lib/mockData';

const { width } = Dimensions.get('window');

export default function POCProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [poc, setPoc] = useState<EnrichedPOCProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        // Try fetching from Supabase first
        const { data, error } = await supabase
          .from('poc_profiles')
          .select('*, users!inner(name, phone, city)')
          .eq('id', id)
          .single();

        if (data && !error) {
          const formatted: EnrichedPOCProfile = {
            ...data,
            name: data.users?.name || 'Contractor',
            phone: data.users?.phone || '',
            city: data.users?.city || 'Bareilly',
            reviews_list: [],
          };
          setPoc(formatted);
        } else {
          // Fallback to local mock data
          const found = MOCK_BAREILLY_POCS.find((p) => p.id === id) || MOCK_BAREILLY_POCS[0];
          setPoc(found);
        }
      } catch {
        const found = MOCK_BAREILLY_POCS.find((p) => p.id === id) || MOCK_BAREILLY_POCS[0];
        setPoc(found);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadProfile();
  }, [id]);

  if (loading || !poc) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading verified profile...</Text>
      </View>
    );
  }

  const primarySkillFormatted = poc.primary_skill.replace('_', ' ');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Contractor Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{poc.name[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{poc.name}</Text>
              </View>
              <Text style={styles.roleTitle}>Lead {primarySkillFormatted} Contractor</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color={COLORS.textSecondary} />
                <Text style={styles.locationText}>
                  {poc.areas_served.slice(0, 2).join(', ')}, {poc.city}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.statVal}>{poc.rating_avg.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>{poc.review_count} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Award size={16} color={COLORS.primary} />
                <Text style={styles.statVal}>{poc.years_experience} yrs</Text>
              </View>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statIconRow}>
                <Users size={16} color={COLORS.info} />
                <Text style={styles.statVal}>Gang of {poc.gang_size}</Text>
              </View>
              <Text style={styles.statLabel}>Workers</Text>
            </View>
          </View>
        </View>

        {/* Housy Verified Trust Badge */}
        {poc.is_verified && (
          <View style={styles.trustBanner}>
            <View style={styles.shieldIcon}>
              <Shield size={22} color={COLORS.success} />
            </View>
            <View style={styles.trustInfo}>
              <View style={styles.trustTop}>
                <Text style={styles.trustTitle}>Housy Verified Partner</Text>
                <View style={styles.idChip}>
                  <Text style={styles.idChipText}>ID: {poc.housy_id_card_number || 'HSY-BLY-001'}</Text>
                </View>
              </View>
              <Text style={styles.trustDesc}>
                Aadhaar verified • Physically verified at Bareilly chowk • Physical ID card holder
              </Text>
            </View>
          </View>
        )}

        {/* Available Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Skills & Gang Capabilities</Text>
          <View style={styles.skillChipsWrap}>
            {poc.skills_available.map((skill) => (
              <View
                key={skill}
                style={[
                  styles.skillChip,
                  skill === poc.primary_skill && styles.skillChipPrimary,
                ]}
              >
                <CheckCircle
                  size={14}
                  color={skill === poc.primary_skill ? '#fff' : COLORS.primary}
                />
                <Text
                  style={[
                    styles.skillChipText,
                    skill === poc.primary_skill && styles.skillChipTextPrimary,
                  ]}
                >
                  {skill.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.bioText}>{poc.bio}</Text>
        </View>

        {/* Areas Served */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Areas Served in {poc.city}</Text>
          <View style={styles.areasRow}>
            {poc.areas_served.map((area) => (
              <View key={area} style={styles.areaChip}>
                <Text style={styles.areaChipText}>📍 {area}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Work Gallery */}
        {poc.work_photos && poc.work_photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Past Work Photos</Text>
              <Text style={styles.sectionMeta}>{poc.work_photos.length} photos</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {poc.work_photos.map((photoUrl, index) => (
                <View key={index} style={styles.photoCard}>
                  <Image source={{ uri: photoUrl }} style={styles.workImg} resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Verified Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingBadgeText}>{poc.rating_avg.toFixed(1)} / 5</Text>
            </View>
          </View>

          {poc.reviews_list && poc.reviews_list.length > 0 ? (
            poc.reviews_list.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.revTop}>
                  <Text style={styles.revAuthor}>{rev.reviewer_name}</Text>
                  <Text style={styles.revDate}>{rev.date}</Text>
                </View>
                <View style={styles.revStars}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      color="#F59E0B"
                      fill={i < Math.floor(rev.rating) ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                  <Text style={styles.workTag}>{rev.work_tag}</Text>
                </View>
                <Text style={styles.revText}>{rev.text}</Text>
              </View>
            ))
          ) : (
            <View style={styles.reviewCard}>
              <Text style={styles.revText}>
                "Experienced team, delivered the job on schedule with proper cleanup."
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Booking Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.rateLabel}>Daily Gang Rate</Text>
          <Text style={styles.rateValue}>
            ₹{poc.daily_rate_min}–{poc.daily_rate_max}
            <Text style={styles.perDay}>/day</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bookNowBtn}
          onPress={() => router.push({ pathname: '/booking/[pocId]', params: { pocId: poc.id } } as any)}
          activeOpacity={0.85}
        >
          <Calendar size={18} color="#fff" />
          <Text style={styles.bookNowBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },

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
  scrollContent: { paddingBottom: 24 },

  headerCard: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  roleTitle: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationText: { fontSize: 13, color: COLORS.textSecondary },

  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statVal: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  statDivider: { width: 1, height: '70%', backgroundColor: COLORS.border, alignSelf: 'center' },

  trustBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    gap: 12,
  },
  shieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustInfo: { flex: 1 },
  trustTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trustTitle: { fontSize: 14, fontWeight: '800', color: '#166534' },
  idChip: { backgroundColor: '#BBF7D0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  idChipText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  trustDesc: { fontSize: 12, color: '#15803D', marginTop: 4, lineHeight: 16 },

  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  sectionMeta: { fontSize: 12, color: COLORS.textSecondary },

  skillChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillChipPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  skillChipText: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  skillChipTextPrimary: { color: '#fff' },
  bioText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },

  areasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  areaChipText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },

  photoScroll: { flexDirection: 'row' },
  photoCard: {
    width: width * 0.65,
    height: 160,
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workImg: { width: '100%', height: '100%' },

  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingBadgeText: { fontSize: 12, fontWeight: '800', color: '#92400E' },

  reviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  revTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revAuthor: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  revDate: { fontSize: 12, color: COLORS.textSecondary },
  revStars: { flexDirection: 'row', alignItems: 'center', gap: 3, marginVertical: 8 },
  workTag: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#FFF0EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  revText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  priceContainer: { flex: 1 },
  rateLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  rateValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  perDay: { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
  bookNowBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookNowBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
