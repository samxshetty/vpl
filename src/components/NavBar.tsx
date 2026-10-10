"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { name: "Matches", href: "/" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Sports Hub", href: "/sports" },
  { name: "Results", href: "/fixtures" },
  { name: "Rules", href: "/rules" },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex items-center space-x-6">
      {links.map((link) => (
        <Link
          key={link.name}
          href={link.href}
          className={clsx(
            "text-sm font-semibold uppercase tracking-widest transition-colors hover:text-white font-sans",
            pathname === link.href
              ? "text-white border-b-2 border-white pb-1"
              : "text-white/50"
          )}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}

export function NavBar() {
  return (
    <nav className="sticky top-0 z-40 w-full glass-panel !rounded-none !border-x-0 !border-t-0 border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center block">
              <div className="relative w-32 h-14 overflow-hidden">
                <Image
                  src="/vpl-logo-transparent.png"
                  alt="VPL Logo"
                  fill
                  sizes="128px"
                  className="object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                  priority
                />
              </div>
            </Link>
          </div>
          <div className="hidden md:block">
            <Suspense fallback={null}>
              <NavLinks />
            </Suspense>
          </div>
        </div>
      </div>
    </nav>
  );
}
