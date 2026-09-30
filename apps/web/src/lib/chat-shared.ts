// Browser-safe chat types and limits (server logic lives in chat.ts).
export type AudioExt = 'webm' | 'ogg' | 'm4a' | 'mp3' | 'wav';
export const MAX_CHAT_TEXT = 1000;
export const MAX_VOICE_SECONDS = 60;
export const MAX_MESSAGES_PER_PROJECT = 1000;
export const CHAT_POLL_MS = 5000;

export interface ChatMessage {
  id: string;
  proId: string;                    // which thread: the expert / crew member the owner is talking to
  from: 'owner' | 'pro';
  kind: 'text' | 'voice';
  text?: string;
  audio?: { id: string; ext: AudioExt; seconds: number };
  at: string;
}
export interface ChatThread {
  proId: string; name: string; role: string; trade: string;
  unread: number;                   // messages from the pro that the owner has not opened yet
  last?: { at: string; from: 'owner' | 'pro'; preview: string };
}
