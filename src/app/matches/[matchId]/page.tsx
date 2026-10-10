import { Suspense } from "react";
import { NavBar } from "@/components/NavBar";
import { MatchCenter } from "@/components/MatchCenter";
import { PageSkeleton } from "@/components/PublicBits";

export default function MatchPage() {
  return (
    <main className="min-h-screen pb-20">
      <NavBar />
      <Suspense
        fallback={
          <div className="max-w-5xl mx-auto px-4 mt-12">
            <PageSkeleton />
          </div>
        }
      >
        <MatchCenter />
      </Suspense>
    </main>
  );
}
