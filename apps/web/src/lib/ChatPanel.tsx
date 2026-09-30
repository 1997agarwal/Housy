'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_POLL_MS, MAX_CHAT_TEXT, MAX_VOICE_SECONDS, type ChatMessage, type ChatThread } from './chat-shared';
import { useT } from './i18n';

const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
const timeIST = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const toDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(blob);
});

export function ChatPanel({ projectId, cancelled }: { projectId: string; cancelled: boolean }) {
  const { t, te } = useT();
  const [threads, setThreads] = useState<ChatThread[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [demo, setDemo] = useState(false);
  const [text, setText] = useState('');
  const [crewText, setCrewText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // voice
  const [rec, setRec] = useState<'idle' | 'recording' | 'ready'>('idle');
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastAt = useRef('');
  const canRecord = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const api = `/api/projects/${projectId}/chat`;
  const markRead = useCallback((proId: string) => { fetch(`${api}/read`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proId }) }).catch(() => undefined); }, [api]);

  // Load a thread in full, then keep it fresh by polling for newer messages (only while the tab is visible).
  const load = useCallback(async (proId: string | null) => {
    try {
      const r = await fetch(`${api}${proId ? `?pro=${encodeURIComponent(proId)}` : ''}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setThreads(d.threads); setDemo(!!d.demo);
      if (proId) { setMessages(d.messages); lastAt.current = d.messages.at(-1)?.at ?? ''; if (d.threads.find((x: ChatThread) => x.proId === proId)?.unread) markRead(proId); }
    } catch { setError('Couldn’t load messages — check your connection.'); }
  }, [api, markRead]);

  useEffect(() => { load(null); }, [load]);
  useEffect(() => { if (threads && !active && threads.length) { setActive(threads[0].proId); } }, [threads, active]);
  useEffect(() => { if (active) { stick.current = true; load(active); } }, [active, load]);

  useEffect(() => {
    if (!active) return;
    let stop = false;
    const tick = async () => {
      if (stop || document.hidden) return;
      try {
        const r = await fetch(`${api}?pro=${encodeURIComponent(active)}${lastAt.current ? `&since=${encodeURIComponent(lastAt.current)}` : ''}`);
        if (!r.ok || stop) return;
        const d = await r.json();
        setThreads(d.threads);
        if (d.messages.length) {
          setMessages((cur) => { const seen = new Set(cur.map((m) => m.id)); return [...cur, ...d.messages.filter((m: ChatMessage) => !seen.has(m.id))]; });
          lastAt.current = d.messages.at(-1).at;
          if (d.messages.some((m: ChatMessage) => m.from === 'pro')) markRead(active);
        }
      } catch { /* transient — next tick retries */ }
    };
    const id = setInterval(tick, CHAT_POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [active, api, markRead]);

  useEffect(() => { const el = logRef.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [messages]);
  useEffect(() => () => { if (ticker.current) clearInterval(ticker.current); stream.current?.getTracks().forEach((tr) => tr.stop()); }, []);
  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);

  async function post(url: string, body: object): Promise<ChatMessage | null> {
    setBusy(true); setError('');
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(r.status === 429 ? t('chat.tooFast') : d.error || 'Could not send');
      setMessages((cur) => (cur.some((m) => m.id === d.id) ? cur : [...cur, d])); lastAt.current = d.at; stick.current = true;
      load(null);
      return d;
    } catch (e) { setError((e as Error).message === 'Failed to fetch' ? 'Could not reach Housy — your message was not sent.' : (e as Error).message); return null; }
    finally { setBusy(false); }
  }

  const send = async () => { if (active && text.trim() && (await post(api, { proId: active, text }))) setText(''); };   // keep the text if sending failed
  const sendCrew = async () => { if (active && crewText.trim() && (await post(`${api}/crew`, { proId: active, text: crewText }))) setCrewText(''); };

  async function startRecording() {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch { setError(t('chat.micDenied')); return; }
    const mime = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((m) => MediaRecorder.isTypeSupported?.(m));
    const mr = new MediaRecorder(stream.current, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });   // small files: speech only
    chunks.current = []; recorder.current = mr;
    mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
    mr.onstop = () => {
      if (ticker.current) clearInterval(ticker.current);
      stream.current?.getTracks().forEach((tr) => tr.stop());                                                     // release the microphone
      const blob = new Blob(chunks.current, { type: mr.mimeType || mime || 'audio/webm' });
      const seconds = Math.max(1, Math.round((Date.now() - started.current) / 1000));
      setClip({ blob, url: URL.createObjectURL(blob), seconds: Math.min(seconds, MAX_VOICE_SECONDS) }); setRec('ready');
    };
    started.current = Date.now(); setSecs(0); setRec('recording'); mr.start();
    ticker.current = setInterval(() => {
      const s = Math.round((Date.now() - started.current) / 1000); setSecs(s);
      if (s >= MAX_VOICE_SECONDS && mr.state === 'recording') mr.stop();
    }, 250);
  }
  const stopRecording = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };
  const discard = () => { setClip(null); setRec('idle'); setSecs(0); };
  async function sendClip() {
    if (!clip || !active) return;
    if (clip.blob.size > 1_400_000) { setError('That recording is too large — keep it shorter.'); return; }
    if (await post(api, { proId: active, voice: await toDataUrl(clip.blob), seconds: clip.seconds })) discard();
  }

  if (threads === null) return error ? <p role="alert" className="text-sm text-red-700">{te(error)}</p> : null;
  const totalUnread = threads.reduce((a, x) => a + x.unread, 0);
  const activeThread = threads.find((x) => x.proId === active);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label={t('chat.title')}>
      <div className="flex items-center gap-2">
        <h2 className="font-extrabold">{t('chat.title')}</h2>
        {totalUnread > 0 && <span className="rounded-full bg-[#E05A2B] px-2 py-0.5 text-xs font-bold text-white">{t('chat.unread', { n: totalUnread })}</span>}
      </div>
      <p className="text-sm text-slate-600">{t('chat.sub')}</p>
      {threads.length === 0 ? <p className="mt-3 text-sm text-slate-500">{t('chat.none')}</p> : (
        <>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={t('chat.title')}>
            {threads.map((th) => (
              <button key={th.proId} role="tab" aria-selected={th.proId === active} onClick={() => setActive(th.proId)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left text-sm ${th.proId === active ? 'border-[#E05A2B] bg-orange-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}>
                <span className="block font-bold">{th.name}{th.unread > 0 && <span className="ml-2 rounded-full bg-[#E05A2B] px-1.5 py-0.5 text-[10px] font-bold text-white">{th.unread}</span>}</span>
                <span className="block text-xs text-slate-500">{th.role}</span>
                {th.last && <span className="block max-w-[14rem] truncate text-xs text-slate-600">{th.last.from === 'owner' ? `${t('chat.you')}: ` : ''}{th.last.preview}</span>}
              </button>
            ))}
          </div>

          <div ref={logRef} role="log" aria-live="polite" aria-label={activeThread?.name} tabIndex={0}
            onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}
            className="mt-3 h-72 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
            {messages.length === 0 && <p className="pt-24 text-center text-sm text-slate-500">{t('chat.empty')}</p>}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'owner' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === 'owner' ? 'bg-[#E05A2B] text-white' : 'bg-white text-slate-800 shadow-sm'}`}>
                  {m.kind === 'voice' && m.audio
                    ? <div><audio controls preload="none" src={`${api}/audio/${m.id}`} className="h-9 w-56 max-w-full" aria-label={`${t('chat.voice')} (${m.audio.seconds}s)`} /><span className="text-xs opacity-80">🎤 {m.audio.seconds}s</span></div>
                    : <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                  <p className={`mt-0.5 text-right text-[10px] ${m.from === 'owner' ? 'text-orange-100' : 'text-slate-400'}`}>{timeIST(m.at)}</p>
                </div>
              </div>
            ))}
          </div>

          {cancelled ? <p className="mt-3 text-sm text-slate-500">{t('chat.cancelled')}</p> : (
            <div className="mt-3">
              {rec === 'idle' && (
                <div className="flex items-end gap-2">
                  <textarea rows={1} value={text} maxLength={MAX_CHAT_TEXT} onChange={(e) => setText(e.target.value)} placeholder={t('chat.write')} aria-label={t('chat.write')}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    className="max-h-32 min-h-[2.5rem] flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200" />
                  {canRecord && <button type="button" onClick={startRecording} disabled={busy} title={t('chat.record')} aria-label={t('chat.record')} className="rounded-xl border border-slate-300 px-3 py-2 text-lg hover:border-slate-400 disabled:opacity-50">🎤</button>}
                  <button className={btn} disabled={busy || !text.trim()} onClick={send}>{busy ? t('chat.sending') : t('chat.send')}</button>
                </div>
              )}
              {rec === 'recording' && (
                <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2" role="status">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-red-600" aria-hidden />
                  <span className="flex-1 text-sm font-semibold text-red-900">{t('chat.recording', { s: secs, max: MAX_VOICE_SECONDS })}</span>
                  <button className={btn} onClick={stopRecording}>{t('chat.stop')}</button>
                </div>
              )}
              {rec === 'ready' && clip && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <audio controls src={clip.url} className="h-9 w-56 max-w-full" aria-label={t('chat.voice')} />
                  <span className="text-xs text-slate-500">{clip.seconds}s</span>
                  <button className="ml-auto text-sm font-bold text-slate-600 hover:underline" onClick={discard}>{t('chat.discard')}</button>
                  <button className={btn} disabled={busy} onClick={sendClip}>{busy ? t('chat.sending') : t('chat.sendVoice')}</button>
                </div>
              )}
              {!canRecord && <p className="mt-1 text-xs text-slate-400">{t('chat.noMic')}</p>}
              {text.length > MAX_CHAT_TEXT - 100 && <p className="mt-1 text-right text-xs text-slate-500">{text.length}/{MAX_CHAT_TEXT}</p>}
              {error && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{te(error)}</p>}
            </div>
          )}

          {demo && !cancelled && activeThread && (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">{t('chat.demo')}</p>
              <p className="text-xs text-slate-500">{t('chat.demoHint')}</p>
              <div className="mt-1 flex gap-2">
                <input value={crewText} onChange={(e) => setCrewText(e.target.value)} maxLength={MAX_CHAT_TEXT} aria-label={t('chat.asCrew', { name: activeThread.name })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendCrew(); } }}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder={`${activeThread.name}…`} />
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400 disabled:opacity-50" disabled={busy || !crewText.trim()} onClick={sendCrew}>{t('chat.asCrew', { name: activeThread.name.split(' ')[0] })}</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
