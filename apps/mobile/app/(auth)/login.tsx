import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/utils';
import { normalizePhone } from '../../lib/utils';

export default function LoginScreen() {
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [step, setStep]       = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (phone.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStep('otp');
    }
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP you received.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: otp,
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Invalid OTP', 'The code you entered is incorrect or expired. Please try again.');
    } else {
      router.replace('/(tabs)/home');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        {/* Logo */}
        <Text style={styles.logo}>🏠 Housy</Text>
        <Text style={styles.tagline}>Your renovation, simplified.</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Enter your mobile number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>
            <Text style={styles.hint}>
              We'll send a one-time password to this number.
            </Text>
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={sendOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send OTP →</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter the OTP sent to +91 {phone}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="• • • • • •"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={verifyOtp}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Continue →</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')} style={styles.backBtn}>
              <Text style={styles.backText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  inner:      { flex: 1, padding: 28, justifyContent: 'center' },
  logo:       { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginBottom: 6 },
  tagline:    { fontSize: 16, color: COLORS.textSecondary, marginBottom: 48 },
  label:      { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  phoneRow:   { flexDirection: 'row', marginBottom: 8 },
  countryCode:{ backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 14,
                justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  countryCodeText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  input:      { flex: 1, backgroundColor: COLORS.surface, borderRadius: 10, paddingHorizontal: 16,
                paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
                color: COLORS.textPrimary },
  otpInput:   { flex: 0, letterSpacing: 8, textAlign: 'center', fontSize: 24 },
  hint:       { fontSize: 13, color: COLORS.textSecondary, marginBottom: 24 },
  btn:        { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16,
                alignItems: 'center', marginTop: 8 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn:    { marginTop: 16, alignItems: 'center' },
  backText:   { color: COLORS.primary, fontSize: 14 },
});
