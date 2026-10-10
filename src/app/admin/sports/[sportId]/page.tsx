import { Suspense } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { SportView } from "@/components/SportView";
import { SPORTS, getSport } from "@/lib/sports";

export function generateStaticParams() {
  return SPORTS.map((s) => ({ sportId: s.id }));
}

async function SportBody({ params }: { params: Promise<{ sportId: string }> }) {
  const { sportId } = await params;
  const sport = getSport(sportId);

  // Not notFound(): Next's dev-mode navigation check renders this page with a placeholder id, and throwing there is reported as an error.
  if (!sport) {
    return (
      <main className="min-h-screen pb-32 relative">
        <AdminNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center">
          <h1 className="text-4xl font-display font-bold tracking-tight mb-4">Sport not found</h1>
          <p className="text-white/50 mb-8 normal-case font-sans">There&apos;s no sport with that address.</p>
          <Link href="/admin" className="text-sm font-semibold uppercase tracking-widest text-white/70 hover:text-white">
            Back to all sports
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-32 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[#990000]/10 blur-[150px] rounded-full opacity-50 mix-blend-screen translate-x-1/3" />
      </div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <SportView sportId={sport.id} />
      </div>
    </main>
  );
}

export default function SportPage({ params }: { params: Promise<{ sportId: string }> }) {
  // Awaiting params happens inside Suspense so the page shell can render instantly (cacheComponents).
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pb-32 relative">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <div className="glass-panel h-64 animate-pulse" />
          </div>
        </main>
      }
    >
      <SportBody params={params} />
    </Suspense>
  );
}
