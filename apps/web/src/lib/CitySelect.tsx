'use client';

import { CITIES } from './cities';
import { useCity } from './city-context';

export function CitySelect({ className = '' }: { className?: string }) {
  const { city, setCity } = useCity();
  return (
    <label className={`flex items-center gap-1.5 text-sm font-semibold text-slate-700 ${className}`}>
      <span aria-hidden>📍</span>
      <span className="sr-only">Your property’s city</span>
      <select value={city.id} onChange={(e) => setCity(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white py-1.5 pl-2 pr-7 text-sm font-semibold focus:border-[#E05A2B] focus:outline-none focus:ring-2 focus:ring-orange-200">
        <optgroup label="Live now">
          {CITIES.filter((c) => c.status === 'live').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
        <optgroup label="Coming soon">
          {CITIES.filter((c) => c.status === 'soon').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
      </select>
    </label>
  );
}
