import Link from "next/link";
import Image from "next/image";
import { SignOutButton, SyncBanner } from "@/components/AdminStatus";

export function AdminNav() {
  return (
    <nav className="sticky top-0 z-40 w-full glass-panel !rounded-none !border-x-0 !border-t-0 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/admin" className="flex items-center gap-4 outline-none focus-visible:outline-2 focus-visible:outline-[#f59e0b] rounded-lg">
            <div className="relative w-32 h-14 overflow-hidden">
              <Image
                src="/vpl-logo-transparent.png"
                alt="VPL"
                fill
                sizes="128px"
                className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                priority
              />
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded border border-[#f59e0b]/50 bg-[#f59e0b]/15 text-[11px] font-bold text-[#f59e0b] tracking-widest uppercase">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="hidden sm:inline text-sm font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              View site
            </Link>
            <Link
              href="/admin"
              className="text-sm font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              All sports
            </Link>
            <Link
              href="/admin/brackets"
              className="text-sm font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              Brackets
            </Link>
            <Link
              href="/admin/placements"
              className="text-sm font-semibold uppercase tracking-widest text-white/60 hover:text-white transition-colors"
            >
              Placements
            </Link>
            <SignOutButton />
          </div>
        </div>
      </div>
      <SyncBanner />
    </nav>
  );
}
