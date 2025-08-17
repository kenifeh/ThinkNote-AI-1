"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/upload", label: "Upload" },
  { href: "/archive", label: "Archive" },
  { href: "/thinkspace", label: "ThinkSpace" },
];

export default function MainNav({ rightSlot }: { rightSlot?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-2 sm:gap-4">
        {/* Logo + Wordmark - responsive spacing */}
        <Link 
          href="/upload" 
          className="flex items-center gap-1.5 sm:gap-2 shrink-0" 
          aria-label="ThinkNote AI Home"
        >
          <Image
            src="/thinknote-logo.svg"
            alt="ThinkNote AI"
            width={24}
            height={24}
            className="h-6 w-6"
            priority
          />
          <span className="font-semibold tracking-tight text-base sm:text-lg text-gray-900">ThinkNote AI</span>
        </Link>

        {/* Tabs - horizontal scrolling on mobile */}
        <nav className="flex-1 flex items-center justify-center sm:justify-start sm:ml-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-full">
            {tabs.map((t) => {
              const isActive =
                pathname === t.href ||
                (t.href !== "/upload" && pathname.startsWith(t.href));

              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "relative px-4 py-3 text-base rounded-xl hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 transition-colors",
                    "min-h-[48px] min-w-[48px] flex items-center justify-center", // Touch-friendly sizing
                    isActive ? "font-semibold text-gray-900" : "text-gray-600"
                  )}
                >
                  {t.label}
                  {/* Active underline */}
                  <span
                    className={cn(
                      "pointer-events-none absolute left-2 right-2 -bottom-[2px] h-[3px] rounded-full bg-gray-900 transition-opacity",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right slot - ensure it doesn't interfere with scrolling */}
        <div className="shrink-0">{rightSlot}</div>
      </div>
    </header>
  );
}
