import Link from 'next/link';
import { listProjects } from '@/lib/projects';
import { getType, inr } from '@/lib/catalog';
import { cityOrDefault } from '@/lib/cities';

export const dynamic = 'force-dynamic';
const STATUS = { visit_scheduled: 'Visit scheduled', quote_ready: 'Quote ready', active: 'In progress', completed: 'Completed' } as const;

export default async function Projects() {
  const projects = await listProjects();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tight text-slate-900">My projects</h1>
      {projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">No projects yet.</p>
          <Link href="/#services" className="mt-3 inline-block font-bold text-[#E05A2B]">Plan your first project →</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((p) => {
            const t = getType(p.typeId)!;
            return (
              <li key={p.id}>
                <Link href={`/projects/${p.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-orange-300">
                  <div>
                    <p className="font-bold text-slate-900">{t.emoji} {t.title} · {cityOrDefault(p.city).name}</p>
                    <p className="text-sm text-slate-600">{p.id} · {p.contact.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#E05A2B]">{STATUS[p.status]}</p>
                    <p className="text-sm text-slate-600">{inr(p.quote?.total ?? p.estimate.total)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
