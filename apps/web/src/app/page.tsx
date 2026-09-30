import Link from 'next/link';
import { ServiceGrid } from './ServiceGrid';

const STEPS = [
  ['Tell us the job', 'Pick a project, share size and city. Get an instant phase-wise estimate.'],
  ['Expert visits your home', 'A verified expert measures the site and checks what can go wrong — you don’t need to be there.'],
  ['Fixed-price quote', 'Itemised by phase, with crew, timeline and a 15% contingency shown upfront.'],
  ['We run the job', 'Verified crews work in the right order. You approve each milestone before it is paid.'],
];

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-b from-orange-50 to-[#FAF9F6]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E05A2B]">For homeowners who live far from their home</p>
          <h1 className="mt-3 max-w-3xl text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Build it. Renovate it. Design it. All from one place — even from another city.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Urban Company fixes a tap. Housy plans and delivers the whole job — a new house, a renovation, or complete interiors —
            with verified experts, a fixed price, and milestone payments you approve.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/welcome" className="rounded-xl bg-[#E05A2B] px-6 py-3 font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-[#C44519]">
              Get started
            </Link>
            <Link href="/workers" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:border-slate-400">Find verified crews</Link>
            <a href="#services" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:border-slate-400">See all projects</a>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900">One journey, three stages</h2>
        <ServiceGrid />
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-2xl font-extrabold text-slate-900">How Housy works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-black text-[#E05A2B]">{i + 1}</span>
                <h3 className="mt-3 font-bold text-slate-900">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
