import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-5xl">🏚️</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900">We couldn’t find that page</h1>
      <p className="mt-1 text-slate-600">It may have moved, or the link is wrong.</p>
      <Link href="/" className="mt-5 inline-block rounded-xl bg-[#E05A2B] px-5 py-2.5 font-bold text-white">Back to Housy</Link>
    </div>
  );
}
