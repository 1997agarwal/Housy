'use client';

import { useState } from 'react';
import type { Photo } from './projects';

// Shrinks photos in the browser (max 1280px, JPEG) so uploads stay small on slow connections.
async function toDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

export function PhotoStrip({ projectId, photos }: { projectId: string; photos: Photo[] }) {
  if (!photos.length) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Site photos">
      {photos.map((ph) => (
        <li key={ph.id}>
          <a href={`/api/projects/${projectId}/photos/${ph.id}`} target="_blank" rel="noreferrer" title={ph.caption || 'Site photo'}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/projects/${projectId}/photos/${ph.id}`} alt={ph.caption || 'Site photo'} className="h-20 w-20 rounded-lg border border-slate-200 object-cover" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function PhotoUploader({ projectId, milestoneId, count, max, onAdded }: { projectId: string; milestoneId: string; count: number; max: number; onAdded: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try {
      const image = await toDataUrl(file);
      const r = await fetch(`/api/projects/${projectId}/photos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ milestoneId, image }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      onAdded();
    } catch (err) { setError(err instanceof Error && err.message ? err.message : 'Could not read that image'); } finally { setBusy(false); }
  }
  return (
    <div className="mt-2">
      <label className={`inline-block cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 hover:border-slate-400 ${busy || count >= max ? 'pointer-events-none opacity-50' : ''}`}>
        {busy ? 'Uploading…' : `📷 Add site photo (${count}/${max})`}
        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={pick} disabled={busy || count >= max} />
      </label>
      {error && <p role="alert" className="mt-1 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
