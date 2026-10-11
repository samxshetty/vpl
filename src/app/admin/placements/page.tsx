import { AdminNav } from "@/components/AdminNav";
import { PlacementsEditor } from "@/components/PlacementsEditor";

export default function AdminPlacementsPage() {
  return (
    <main className="min-h-screen pb-32 relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-[#990000]/10 blur-[150px] rounded-full opacity-50 mix-blend-screen translate-x-1/3" />
      </div>
      <AdminNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <PlacementsEditor />
      </div>
    </main>
  );
}
