import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/app.store';
import { COLORS } from '../../lib/utils';
import { RenovationScope, PropertyType } from '@housy/shared';

const TOTAL_STEPS = 4;

const SCOPE_OPTIONS: { key: RenovationScope; label: string; icon: string }[] = [
  { key: 'bathroom_addition',   label: 'Add Bathroom',      icon: '🚿' },
  { key: 'bathroom_renovation', label: 'Redo Bathroom',     icon: '🛁' },
  { key: 'kitchen_renovation',  label: 'Kitchen',           icon: '🍳' },
  { key: 'wall_demolition',     label: 'Break Walls',       icon: '🧱' },
  { key: 'flooring',            label: 'Flooring',          icon: '🟫' },
  { key: 'electrical',          label: 'Electrical',        icon: '⚡' },
  { key: 'plumbing',            label: 'Plumbing',          icon: '🔧' },
  { key: 'waterproofing',       label: 'Waterproofing',     icon: '💧' },
  { key: 'painting',            label: 'Painting',          icon: '🖌️' },
  { key: 'doors_windows',       label: 'Doors & Windows',   icon: '🚪' },
  { key: 'structural_repair',   label: 'Structural Repair', icon: '🏗️' },
];

export default function PropertyOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const setActiveProject = useAppStore((s) => s.setActiveProject);
  const setActiveProperty = useAppStore((s) => s.setActiveProperty);

  // Form state
  const [city, setCity]           = useState('Bareilly');
  const [locality, setLocality]   = useState('');
  const [pincode, setPincode]     = useState('');
  const [type, setType]           = useState<PropertyType>('house');
  const [ageYears, setAgeYears]   = useState('');
  const [sqFt, setSqFt]           = useState('');
  const [bhk, setBhk]             = useState('5');
  const [bathrooms, setBathrooms] = useState('1');
  const [scopes, setScopes]       = useState<RenovationScope[]>([]);

  function toggleScope(key: RenovationScope) {
    setScopes((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  }

  async function submit() {
    if (scopes.length === 0) {
      Alert.alert('Select scope', 'Please select at least one renovation task.');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/(auth)/login'); return; }

      // Create property
      const { data: property, error: propErr } = await supabase
        .from('properties')
        .insert({
          owner_id: session.user.id,
          city, locality, pincode, type,
          age_years: parseInt(ageYears) || 30,
          sq_ft: parseInt(sqFt) || 2000,
          bhk: parseInt(bhk) || 5,
          bathrooms: parseInt(bathrooms) || 1,
          renovation_scope: scopes,
        })
        .select()
        .single();

      if (propErr) throw propErr;
      setActiveProperty(property as any);

      // Create project
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          property_id: property.id,
          homeowner_id: session.user.id,
          title: `${city} Home Renovation`,
          status: 'planning',
          budget_estimate: 0,
          budget_spent: 0,
        })
        .select()
        .single();

      if (projErr) throw projErr;
      setActiveProject(project as any);

      router.replace('/(tabs)/home');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.stepIndicator}>Step {step} of {TOTAL_STEPS}</Text>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Where is your property?</Text>
            <Text style={styles.stepSub}>We'll find verified workers and accurate prices for your area.</Text>
            <Text style={styles.label}>City *</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Bareilly" />
            <Text style={styles.label}>Locality / Area *</Text>
            <TextInput style={styles.input} value={locality} onChangeText={setLocality} placeholder="e.g. Civil Lines" />
            <Text style={styles.label}>Pincode</Text>
            <TextInput style={styles.input} value={pincode} onChangeText={setPincode}
              placeholder="243001" keyboardType="number-pad" maxLength={6} />
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Tell us about your property</Text>
            <Text style={styles.stepSub}>This helps us estimate costs and match the right workers.</Text>
            <Text style={styles.label}>Property Type *</Text>
            <View style={styles.typeRow}>
              {(['house', 'apartment', 'plot'] as PropertyType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                    {t === 'house' ? '🏠' : t === 'apartment' ? '🏢' : '🏗️'} {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Property Age (years)</Text>
            <TextInput style={styles.input} value={ageYears} onChangeText={setAgeYears}
              placeholder="30" keyboardType="number-pad" />
            <Text style={styles.label}>Built-up Area (sq ft)</Text>
            <TextInput style={styles.input} value={sqFt} onChangeText={setSqFt}
              placeholder="2000" keyboardType="number-pad" />
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Rooms & bathrooms</Text>
            <Text style={styles.stepSub}>How is your property currently configured?</Text>
            <Text style={styles.label}>Bedrooms (BHK)</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn}
                onPress={() => setBhk((v) => String(Math.max(1, parseInt(v) - 1)))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{bhk}</Text>
              <TouchableOpacity style={styles.stepperBtn}
                onPress={() => setBhk((v) => String(Math.min(20, parseInt(v) + 1)))}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Current Bathrooms</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity style={styles.stepperBtn}
                onPress={() => setBathrooms((v) => String(Math.max(0, parseInt(v) - 1)))}>
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{bathrooms}</Text>
              <TouchableOpacity style={styles.stepperBtn}
                onPress={() => setBathrooms((v) => String(parseInt(v) + 1))}>
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>What do you want to renovate?</Text>
            <Text style={styles.stepSub}>Select everything you're planning. You can change this later.</Text>
            <View style={styles.scopeGrid}>
              {SCOPE_OPTIONS.map(({ key, label, icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.scopeItem, scopes.includes(key) && styles.scopeItemActive]}
                  onPress={() => toggleScope(key)}
                >
                  <Text style={styles.scopeIcon}>{icon}</Text>
                  <Text style={[styles.scopeLabel, scopes.includes(key) && styles.scopeLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer nav */}
      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step < TOTAL_STEPS ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep((s) => s + 1)}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, loading && styles.btnDisabled]}
            onPress={submit} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.nextBtnText}>Create My Project →</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  progressBar:    { height: 4, backgroundColor: COLORS.border },
  progressFill:   { height: '100%', backgroundColor: COLORS.primary },
  stepIndicator:  { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary,
                    paddingTop: 12, paddingBottom: 4 },
  scroll:         { padding: 24, paddingBottom: 40 },
  stepTitle:      { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  stepSub:        { fontSize: 14, color: COLORS.textSecondary, marginBottom: 28, lineHeight: 20 },
  label:          { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary,
                    marginBottom: 6, marginTop: 16 },
  input:          { backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 16,
                    paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
                    color: COLORS.textPrimary },
  typeRow:        { flexDirection: 'row', gap: 8 },
  typeBtn:        { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, paddingVertical: 12,
                    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive:  { backgroundColor: '#FFF0EB', borderColor: COLORS.primary },
  typeBtnText:    { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'capitalize' },
  typeBtnTextActive: { color: COLORS.primary },
  stepperRow:     { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
  stepperBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: COLORS.border },
  stepperBtnText: { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary },
  stepperValue:   { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, minWidth: 40, textAlign: 'center' },
  scopeGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scopeItem:      { width: '30%', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
                    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  scopeItemActive:{ backgroundColor: '#FFF0EB', borderColor: COLORS.primary },
  scopeIcon:      { fontSize: 24, marginBottom: 6 },
  scopeLabel:     { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  scopeLabelActive: { color: COLORS.primary },
  footer:         { flexDirection: 'row', padding: 20, gap: 12,
                    borderTopWidth: 1, borderColor: COLORS.border },
  backBtn:        { flex: 1, paddingVertical: 16, alignItems: 'center',
                    backgroundColor: COLORS.surface, borderRadius: 12,
                    borderWidth: 1, borderColor: COLORS.border },
  backBtnText:    { fontWeight: '700', color: COLORS.textSecondary, fontSize: 15 },
  nextBtn:        { flex: 2, paddingVertical: 16, alignItems: 'center',
                    backgroundColor: COLORS.primary, borderRadius: 12 },
  nextBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled:    { opacity: 0.6 },
});
