"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import clsx from "clsx";

const links = [
  { name: "Matches", href: "/" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Sports Hub", href: "/sports" },
  { name: "Fixtures", href: "/fixtures" },
  { name: "Rules", href: "/rules" },
];

function NavLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className={mobile ? "flex flex-col gap-1 py-2" : "flex items-center space-x-6"}>
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          onClick={onNavigate}
          className={clsx(
            "text-sm font-semibold uppercase tracking-widest transition-colors hover:text-white font-sans",
            mobile ? "rounded-lg px-3 py-3" : "py-1",
            pathname === link.href || (link.href === "/fixtures" && pathname.startsWith("/fixtures"))
              ? "text-white md:border-b-2 md:border-white"
              : "text-white/55"
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <nav className="relative md:fixed md:top-0 md:left-0 md:right-0 z-50 w-full glass-panel !rounded-none !border-x-0 !border-t-0 border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-20">
            <Link href="/" className="flex items-center shrink-0" aria-label="VPL home">
              <div className="relative w-24 sm:w-32 h-12 sm:h-14 overflow-hidden">
                <Image src="/vpl-logo-transparent.png" alt="VPL Logo" fill sizes="128px" className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" priority />
              </div>
            </Link>
            <div className="hidden md:block">
              <Suspense fallback={null}><NavLinks /></Suspense>
            </div>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-white/15 text-white hover:bg-white/10"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden border-t border-white/10 pb-3">
              <Suspense fallback={null}><NavLinks mobile onNavigate={() => setMenuOpen(false)} /></Suspense>
            </div>
          )}
        </div>
      </nav>
      <div className="hidden md:block h-20" aria-hidden="true" />
    </>
  );
}
