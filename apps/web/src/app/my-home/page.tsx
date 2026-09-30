'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { LoginForm } from '@/lib/LoginForm';
import { useT } from '@/lib/i18n';
import { planRoomName, roomTypeName } from '@/lib/catalog-hi';
import { checkBathroom, fallInches, type Level } from '@/lib/advisor';
import { localizeVerdict } from '@/lib/advisor-hi';
import {
  ROOM_TYPES, TEMPLATES, addRoom, area, carpetArea, drainRunFt, fromTemplate, gapFt, interiorHandoff, overlappingIds, totalArea,
  type Plan, type Point, type Room, type RoomType,
} from '@/lib/plan-shared';

const DRAFT = 'housy.plan.draft.v2';
// A local draft belongs to whoever was signed in (or 'anon') and is timestamped, so one person's edits are never shown to
// another on a shared device, and a newer unsaved draft is preferred over an older saved plan.
type Draft = { owner: string; plan: Plan; at: string };
const readDraft = (): Draft | null => { try { const d = JSON.parse(localStorage.getItem(DRAFT) ?? 'null'); return d && d.plan && Array.isArray(d.plan.rooms) ? d : null; } catch { return null; } };
const snap = (n: number) => Math.max(0, Math.round(n * 2) / 2);
const field = 'w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
const btn = 'rounded-xl bg-[#E05A2B] px-4 py-2 text-sm font-bold text-white hover:bg-[#C44519] disabled:opacity-60';
// A number input that lets you clear it and retype: it commits valid values while typing, clamps on blur, and reverts if left blank.
function NumField({ label, value, min, max, onCommit }: { label: string; value: number; min: number; max: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const parse = (t: string) => (t.trim() === '' ? NaN : Number(t));
  return (
    <label>{label}
      <input type="number" min={min} max={max} step={0.5} className={field} value={text}
        onChange={(e) => { setText(e.target.value); const n = parse(e.target.value); if (Number.isFinite(n) && n >= min && n <= max) onCommit(snap(n)); }}
        onBlur={() => { const n = parse(text); if (Number.isFinite(n)) onCommit(Math.min(max, Math.max(min, snap(n)))); else setText(String(value)); }} />
    </label>
  );
}
const chipBtn = 'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400';
const LEVEL = { green: ['bg-emerald-600', 'GREEN'], amber: ['bg-amber-500', 'AMBER'], red: ['bg-red-600', 'RED'] } as const;
const FLOOR = { ground: 'mh.ground', upper: 'mh.upper' } as const;

export default function MyHome() {
  const { user } = useAuth();
  const { t, lang, te } = useT();
  const rname = (r: { name: string }) => planRoomName(r.name, lang);
  const rtype = (ty: RoomType) => roomTypeName(ty, ROOM_TYPES[ty].label, lang);
  const [plan, setPlan] = useState<Plan>({ rooms: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);
  const [floor, setFloor] = useState<'ground' | 'upper'>('ground');
  const [window_, setWindow] = useState(true);
  const [bathId, setBathId] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: 'room' | 'septic'; id?: string; dx: number; dy: number } | null>(null);
  const loaded = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  const ownerRef = useRef('anon');
  ownerRef.current = user?.phone ?? 'anon';

  // Load: the saved plan, unless this user has a NEWER unsaved draft on this device (then offer that, marked unsaved).
  // A draft made while signed out is adopted by whoever signs in next, but only if they have no saved plan yet.
  useEffect(() => {
    if (user === undefined || loaded.current) return;
    loaded.current = true;
    (async () => {
      let server: Plan | null = null;
      try {
        if (user) { const r = await fetch('/api/home-plan'); if (!r.ok) throw new Error('load'); server = (await r.json()).plan ?? null; }
      } catch { setError(t('mh.loadFail')); }
      const draft = readDraft();
      const mine = draft && draft.owner === ownerRef.current ? draft : null;
      const anon = user && !server && draft?.owner === 'anon' ? draft : null;
      if (mine && (!server?.updatedAt || mine.at > server.updatedAt)) { setPlan(mine.plan); setDirty(true); }
      else if (server) setPlan(server);
      else if (anon) { setPlan(anon.plan); setDirty(true); }
    })();
  }, [user, t]);

  const update = useCallback((fn: (p: Plan) => Plan) => {
    setPlan((p) => {
      const next = fn(p);
      try { localStorage.setItem(DRAFT, JSON.stringify({ owner: ownerRef.current, plan: next, at: new Date().toISOString() } satisfies Draft)); } catch { /* storage unavailable */ }
      return next;
    });
    setDirty(true); setSaved('');
  }, []);
  const patchRoom = (id: string, patch: Partial<Room>) => update((p) => ({ ...p, rooms: p.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));

  async function save() {
    setError(''); setSaved('');
    if (!user) { setNeedLogin(true); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/home-plan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Could not save — please try again');
      setDirty(false); setSaved(t('mh.savedAcct'));
      try { localStorage.removeItem(DRAFT); } catch { /* ignore */ }
    } catch (e) { setError((e as Error).message === 'Failed to fetch' ? t('mh.offline') : (e as Error).message); }
    finally { setSaving(false); }
  }

  // ── canvas geometry ──
  const bounds = useMemo(() => {
    const xs = plan.rooms.map((r) => r.x + r.w), ys = plan.rooms.map((r) => r.y + r.l);
    if (plan.septic) { xs.push(plan.septic.x + 3); ys.push(plan.septic.y + 3); }
    return { w: Math.max(44, Math.ceil(Math.max(0, ...xs) + 4)), h: Math.max(32, Math.ceil(Math.max(0, ...ys) + 4)) };
  }, [plan]);
  // While dragging, the canvas must not rescale under the cursor (that made items run away), so the view is frozen.
  const frozen = useRef(bounds);
  const view = dragging ? frozen.current : bounds;
  const toFeet = (e: React.PointerEvent): Point => {
    const svg = svgRef.current!, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const m = pt.matrixTransform(svg.getScreenCTM()!.inverse()); return { x: m.x, y: m.y };
  };
  const startDrag = (e: React.PointerEvent, kind: 'room' | 'septic', id?: string) => {
    const p = toFeet(e), base = kind === 'room' ? plan.rooms.find((r) => r.id === id)! : plan.septic!;
    drag.current = { kind, id, dx: p.x - base.x, dy: p.y - base.y };
    frozen.current = bounds; setDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    if (id) setSelected(id);
    e.stopPropagation();
  };
  const endDrag = () => { drag.current = null; setDragging(false); };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const p = toFeet(e), v = frozen.current;
    const x = snap(p.x - d.dx), y = snap(p.y - d.dy);
    if (d.kind === 'room') {
      const r = plan.rooms.find((q) => q.id === d.id); if (!r) return;
      patchRoom(r.id, { x: Math.min(x, Math.max(0, v.w - r.w)), y: Math.min(y, Math.max(0, v.h - r.l)) });   // stay inside the visible canvas
    } else update((pl) => ({ ...pl, septic: { x: Math.min(x, v.w), y: Math.min(y, v.h) } }));
  };
  const onKey = (e: React.KeyboardEvent, r: Room) => {
    const step = e.shiftKey ? 2 : 0.5, k = e.key;
    const d = k === 'ArrowLeft' ? [-step, 0] : k === 'ArrowRight' ? [step, 0] : k === 'ArrowUp' ? [0, -step] : k === 'ArrowDown' ? [0, step] : null;
    if (d) { e.preventDefault(); patchRoom(r.id, { x: snap(r.x + d[0]), y: snap(r.y + d[1]) }); }
  };

  const overlaps = useMemo(() => overlappingIds(plan.rooms), [plan.rooms]);
  const sel = plan.rooms.find((r) => r.id === selected) ?? null;
  const baths = plan.rooms.filter((r) => r.type === 'bathroom');
  const target = plan.rooms.find((r) => r.id === bathId) ?? baths[0] ?? null;

  const analysis = useMemo(() => {
    if (!target || !plan.septic) return null;
    const drainFt = drainRunFt(target, plan.septic);
    const others = plan.rooms.filter((r) => r.id !== target.id && (r.type === 'bathroom' || r.type === 'kitchen'));
    const shaft = others.some((r) => gapFt(r, target) <= 10) ? 'yes' : 'no';
    return { drainFt, verdict: checkBathroom({ floor, drainFt, below: 'unsure', shaft, ventilation: window_ ? 'window' : 'none' }) };
  }, [target, plan.septic, plan.rooms, floor, window_]);

  const localized = useMemo(() => (analysis ? localizeVerdict(analysis.verdict, lang) : null), [analysis, lang]);
  const handoff = useMemo(() => interiorHandoff(plan.rooms), [plan.rooms]);
  const interiorIds = handoff.rooms;
  const setRoomsUrl = `/plan/interiors-full?area=${handoff.area}&rooms=${interiorIds.join(',')}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('mh.title')}</h1>
      <p className="mt-1 text-slate-600">{t('mh.desc')}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase text-slate-500">{t('mh.startFrom')}</span>
        {Object.entries(TEMPLATES).map(([k, tp]) => <button key={k} className={chipBtn} onClick={() => { if (plan.rooms.length === 0 || window.confirm(t('mh.confirmTemplate'))) { update(() => fromTemplate(k)); setSelected(null); } }}>{t('mh.template', { label: tp.label })}</button>)}
        <span className="ml-3 text-xs font-bold uppercase text-slate-500">{t('mh.add')}</span>
        {(Object.keys(ROOM_TYPES) as RoomType[]).map((ty) => <button key={ty} className={chipBtn} onClick={() => update((p) => ({ ...p, rooms: addRoom(p.rooms, ty) }))} disabled={plan.rooms.length >= 30}>+ {rtype(ty)}</button>)}
        {!plan.septic && <button className={`${chipBtn} border-cyan-600 text-cyan-800`} onClick={() => update((p) => ({ ...p, septic: { x: bounds.w - 6, y: 4 } }))}>{t('mh.addSeptic')}</button>}
        {plan.rooms.length > 0 && <button className="ml-auto text-xs font-bold text-red-700 hover:underline" onClick={() => { if (window.confirm(t('mh.confirmClear'))) { update(() => ({ rooms: [] })); setSelected(null); } }}>{t('mh.clear')}</button>}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <svg ref={svgRef} viewBox={`0 0 ${view.w} ${view.h}`} className="block w-full touch-none select-none" style={{ aspectRatio: `${view.w} / ${view.h}` }}
              role="application" aria-label={t('mh.canvas')} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag} onPointerDown={() => setSelected(null)}>
              <defs><pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0H0V1" fill="none" stroke="#EEF0F3" strokeWidth="0.05" /></pattern>
                <pattern id="grid5" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M5 0H0V5" fill="none" stroke="#D9DEE5" strokeWidth="0.08" /></pattern></defs>
              <rect width={view.w} height={view.h} fill="url(#grid)" /><rect width={view.w} height={view.h} fill="url(#grid5)" />
              {plan.septic && target && analysis && (
                <polyline fill="none" stroke="#0891B2" strokeWidth="0.25" strokeDasharray="0.7 0.5"
                  points={`${Math.min(Math.max(plan.septic.x, target.x), target.x + target.w)},${Math.min(Math.max(target.y + target.l / 2, target.y), target.y + target.l)} ${plan.septic.x},${Math.min(Math.max(target.y + target.l / 2, target.y), target.y + target.l)} ${plan.septic.x},${plan.septic.y}`} />
              )}
              {plan.rooms.map((r) => {
                const bad = overlaps.has(r.id), on = r.id === selected;
                return (
                  <g key={r.id} tabIndex={0} role="button" aria-label={`${t('mh.roomAria', { name: rname(r), w: r.w, l: r.l })}${bad ? t('mh.overlapAria') : ''}`} aria-pressed={on}
                    onPointerDown={(e) => startDrag(e, 'room', r.id)} onFocus={() => setSelected(r.id)} onKeyDown={(e) => onKey(e, r)} style={{ cursor: 'grab', outline: 'none' }}>
                    <rect x={r.x} y={r.y} width={r.w} height={r.l} fill={ROOM_TYPES[r.type].color} fillOpacity={0.9} stroke={bad ? '#DC2626' : on ? '#E05A2B' : '#64748B'} strokeWidth={on || bad ? 0.35 : 0.18} />
                    {/* Labels shrink to fit small rooms instead of spilling over their walls. */}
                    <text x={r.x + r.w / 2} y={r.y + r.l / 2 - 0.2} textAnchor="middle" fontSize={Math.max(0.8, Math.min(1.5, r.w / (rname(r).length * 0.62)))} fontWeight="700" fill="#1E293B" pointerEvents="none">{rname(r)}</text>
                    <text x={r.x + r.w / 2} y={r.y + r.l / 2 + 1.3} textAnchor="middle" fontSize={Math.max(0.7, Math.min(1.2, r.w / 6))} fill="#475569" pointerEvents="none">{r.w}′ × {r.l}′</text>
                  </g>
                );
              })}
              {plan.septic && (
                <g onPointerDown={(e) => startDrag(e, 'septic')} style={{ cursor: 'grab' }} role="img" aria-label={t('mh.septicAria')}>
                  <circle cx={plan.septic.x} cy={plan.septic.y} r="1.6" fill="#0891B2" stroke="#fff" strokeWidth="0.3" />
                  <text x={plan.septic.x} y={plan.septic.y + 3.4} textAnchor="middle" fontSize="1.2" fontWeight="700" fill="#0E7490" pointerEvents="none">{t('mh.septic')}</text>
                </g>
              )}
            </svg>
          </div>
          {plan.rooms.length === 0 && <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-600">{t('mh.empty')}</p>}
          {overlaps.size > 0 && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{t('mh.overlap')}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className={btn} onClick={save} disabled={plan.rooms.length === 0 || saving}>{saving ? t('mh.saving') : t('mh.save')}</button>
            {dirty && !saved && <span className="text-sm text-slate-500">{t('mh.unsaved')}</span>}
            {saved && <span role="status" className="text-sm font-bold text-emerald-700">✔ {saved}</span>}
            {error && <span role="alert" className="text-sm font-bold text-red-700">{te(error)}</span>}
          </div>
          {needLogin && !user && <div className="mt-3 max-w-md rounded-2xl border border-slate-200 bg-white p-4"><p className="mb-2 text-sm font-bold">{t('mh.verify')}</p><LoginForm onDone={() => setNeedLogin(false)} /></div>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-extrabold">{t('mh.totals')}</h2>
            <p className="text-sm text-slate-700">{t('mh.totalsLine', { n: plan.rooms.length, total: totalArea(plan.rooms), carpet: carpetArea(plan.rooms) })}</p>
          </div>

          {sel ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-extrabold">{t('mh.editRoom')}</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                <label className="col-span-2">{t('mh.name')}<input className={field} maxLength={30} value={sel.name} onChange={(e) => patchRoom(sel.id, { name: e.target.value })} /></label>
                <label className="col-span-2">{t('mh.type')}<select className={field} value={sel.type} onChange={(e) => patchRoom(sel.id, { type: e.target.value as RoomType })}>{(Object.keys(ROOM_TYPES) as RoomType[]).map((ty) => <option key={ty} value={ty}>{rtype(ty)}</option>)}</select></label>
                {([['w', 'mh.width', 3, 60], ['l', 'mh.length', 3, 60], ['x', 'mh.left', 0, 200], ['y', 'mh.top', 0, 200]] as const).map(([k, label, min, max]) => (
                  <NumField key={k} label={t(label)} value={sel[k]} min={min} max={max} onCommit={(n) => patchRoom(sel.id, { [k]: n })} />
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-700">{t('mh.sqft', { n: area(sel) })}</p>
              <button className="mt-2 text-sm font-bold text-red-700 hover:underline" onClick={() => { update((p) => ({ ...p, rooms: p.rooms.filter((r) => r.id !== sel.id) })); setSelected(null); }}>{t('mh.delete')}</button>
            </div>
          ) : plan.rooms.length > 0 && <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">{t('mh.clickHint')}</p>}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-extrabold">{t('mh.bathCheck')}</h2>
            {!plan.septic ? <p className="mt-1 text-sm text-slate-600">{t('mh.needSeptic')}</p>
              : baths.length === 0 ? <p className="mt-1 text-sm text-slate-600">{t('mh.needBath')}</p>
              : analysis && target && localized && (
                <div className="mt-2 space-y-2 text-sm">
                  {baths.length > 1 && <label className="block text-xs font-semibold text-slate-600">{t('mh.whichBath')}<select className={field} value={target.id} onChange={(e) => setBathId(e.target.value)}>{baths.map((b) => <option key={b.id} value={b.id}>{rname(b)}</option>)}</select></label>}
                  <p>{t('mh.pipeRun', { ft: analysis.drainFt, in: fallInches(analysis.drainFt) })}</p>
                  <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
                    <label className="flex items-center gap-1">{t('mh.floor')} <select className="rounded border border-slate-300 px-1 py-0.5" value={floor} onChange={(e) => setFloor(e.target.value as 'ground' | 'upper')}><option value="ground">{t(FLOOR.ground)}</option><option value="upper">{t(FLOOR.upper)}</option></select></label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={window_} onChange={(e) => setWindow(e.target.checked)} /> {t('mh.hasWindow')}</label>
                  </div>
                  <div className="rounded-lg border p-2" role="status">
                    <span className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-black tracking-widest text-white ${LEVEL[analysis.verdict.level as Level][0]}`}>{LEVEL[analysis.verdict.level as Level][1]}</span>
                    <b>{localized.headline}</b>
                    <p className="mt-1 text-slate-700">{localized.reasons[0]?.text}</p>
                  </div>
                  <Link href={`/plan/new-bathroom?drain=${Math.round(analysis.drainFt)}&area=${Math.round(area(target))}`} className="inline-block font-bold text-[#E05A2B]">{t('mh.planBath')}</Link>
                </div>
              )}
          </div>

          {interiorIds.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="font-extrabold">{t('mh.interiors')}</h2>
              <p className="mt-1 text-sm text-slate-700">{t('mh.interiorsLine', { n: interiorIds.length })}</p>
              {(handoff.unpricedBedrooms > 0 || handoff.unpricedOther > 0) && <p className="mt-1 text-xs text-amber-800">{t('mh.interiorsNote', { what: `${handoff.unpricedBedrooms > 0 ? t('mh.extraBeds', { n: handoff.unpricedBedrooms }) : ''}${handoff.unpricedBedrooms > 0 && handoff.unpricedOther > 0 ? t('mh.and') : ''}${handoff.unpricedOther > 0 ? t('mh.otherRooms', { n: handoff.unpricedOther }) : ''}` })}</p>}
              <Link href={setRoomsUrl} className="mt-2 inline-block font-bold text-[#E05A2B]">{t('mh.startInteriors')}</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
