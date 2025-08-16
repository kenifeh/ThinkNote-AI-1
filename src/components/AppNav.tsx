"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/upload", label: "Upload" },
  { href: "/archive", label: "Archive" },
  { href: "/thinkspace", label: "ThinkSpace" },
];

export function AppNav() {
  const pathname = usePathname();
  
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-6">
        <Link href="/upload" className="font-semibold">
          ThinkNote AI
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2 py-1 rounded-md hover:bg-neutral-100 ${
                pathname.startsWith(l.href) ? "bg-neutral-100 font-medium" : ""
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
