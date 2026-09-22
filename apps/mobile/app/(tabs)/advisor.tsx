import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Send, Mic } from 'lucide-react-native';
import { COLORS, feasibilityColor, formatINR } from '../../lib/utils';
import { supabase } from '../../lib/supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feasibility?: { level: string; cost_min: number; cost_max: number; next_steps: string[] };
};

const SUGGESTIONS = [
  'Can I add a second bathroom?',
  'Is it safe to break this wall?',
  'Estimate cost of flooring 500 sq ft',
  'What materials do I need for tiling?',
];

export default function AdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm Housy AI — your renovation advisor. Ask me anything about your renovation: feasibility, costs, materials, or what to do next. 🏗️",
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    listRef.current?.scrollToEnd({ animated: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_BASE}/ai-advisor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: msg,
          history: newMessages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const responseText = await res.text();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect right now. Please check your internet connection and try again.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask Housy</Text>
        <Text style={styles.headerSub}>AI Renovation Advisor</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {item.role === 'assistant' && (
              <Text style={styles.aiLabel}>🏠 Housy AI</Text>
            )}
            <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>
              {item.content}
            </Text>
          </View>
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      {/* Suggestion chips — only show at start */}
      {messages.length === 1 && (
        <View style={styles.suggestions}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={SUGGESTIONS}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chip}
                onPress={() => sendMessage(item)}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Ask anything about your renovation..."
          placeholderTextColor={COLORS.textSecondary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  header:       { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20,
                  borderBottomWidth: 1, borderColor: COLORS.border },
  headerTitle:  { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:    { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  messageList:  { padding: 16, paddingBottom: 8 },
  bubble:       { maxWidth: '85%', borderRadius: 16, padding: 14, marginBottom: 12 },
  aiBubble:     { backgroundColor: COLORS.surface, alignSelf: 'flex-start',
                  borderBottomLeftRadius: 4 },
  userBubble:   { backgroundColor: COLORS.primary, alignSelf: 'flex-end',
                  borderBottomRightRadius: 4 },
  aiLabel:      { fontSize: 11, fontWeight: '700', color: COLORS.primary,
                  marginBottom: 4, letterSpacing: 0.5 },
  bubbleText:   { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
  userBubbleText: { color: '#fff' },
  loadingBubble:{ flexDirection: 'row', alignItems: 'center', padding: 12,
                  backgroundColor: COLORS.surface, borderRadius: 16,
                  alignSelf: 'flex-start', marginBottom: 12 },
  loadingText:  { marginLeft: 8, color: COLORS.textSecondary, fontSize: 14 },
  suggestions:  { paddingVertical: 12, borderTopWidth: 1, borderColor: COLORS.border },
  chip:         { backgroundColor: '#FFF3EE', borderWidth: 1, borderColor: '#FFD5C2',
                  borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  chipText:     { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  inputBar:     { flexDirection: 'row', alignItems: 'flex-end', padding: 12,
                  borderTopWidth: 1, borderColor: COLORS.border,
                  backgroundColor: COLORS.background },
  inputField:   { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12,
                  paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
                  maxHeight: 100, color: COLORS.textPrimary,
                  borderWidth: 1, borderColor: COLORS.border, marginRight: 8 },
  sendBtn:      { backgroundColor: COLORS.primary, width: 42, height: 42,
                  borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});
