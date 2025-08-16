"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

/** -------------------- Types & Mock Data -------------------- */
type ArchiveItem = {
  id: string;
  title: string;
  createdAt: string;         // ISO
  words: number;
  tags: string[];
  audioUrl?: string | null;
  audioExpiresAt?: string | null; // ISO; if future => playable
};

const INITIAL_ITEMS: ArchiveItem[] = [
  {
    id: "1",
    title: "Introduction to Machine Learning",
    createdAt: "2024-01-15T12:00:00Z",
    words: 1250,
    tags: ["ML", "AI", "Computer Science"],
    audioUrl: "/mock/audio-1.webm",
    audioExpiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // expired
  },
  {
    id: "2",
    title: "Quantum Physics Fundamentals",
    createdAt: "2024-01-14T12:00:00Z",
    words: 890,
    tags: ["Physics", "Quantum"],
    audioUrl: "/mock/audio-2.webm",
    audioExpiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // expires in 6h
  },
  {
    id: "3",
    title: "Modern History: World War II",
    createdAt: "2024-01-13T12:00:00Z",
    words: 2100,
    tags: ["History", "War"],
  },
];

/** -------------------- Utils -------------------- */
function clsx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}
function hoursUntil(iso?: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60));
}
function isExpired(iso?: string | null) {
  if (!iso) return true;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 0;
}
function isExpiringSoon(iso?: string | null) {
  if (!iso) return false;
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff <= 6 * 60 * 60 * 1000; // 6 hours
}

/** -------------------- Page -------------------- */
export default function ArchivePage() {
  // stateful data so edits persist in session
  const [data, setData] = useState<ArchiveItem[]>(INITIAL_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // toolbar state
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");

  const tags = useMemo(() => {
    const t = new Set<string>();
    data.forEach(i => i.tags.forEach(t.add, t));
    return ["all", ...Array.from(t)];
  }, [data]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data.filter(i => {
      const matchesQ =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q));
      const matchesTag = tag === "all" || i.tags.includes(tag);
      return matchesQ && matchesTag;
    });
    if (sort === "newest") list = list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "oldest") list = list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    if (sort === "title")  list = list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [data, query, tag, sort]);

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  /** update helpers (replace with API calls later) */
  function updateItem(id: string, patch: Partial<Pick<ArchiveItem, "title" | "tags">>) {
    setData(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
    // TODO: await fetch("/api/archive/update", { method:"POST", body: JSON.stringify({ id, ...patch }) })
  }
  function deleteItem(id: string) {
    setData(prev => prev.filter(i => i.id !== id));
    // TODO: await fetch("/api/archive/delete", { method:"POST", body: JSON.stringify({ id }) })
  }

  function retryFetch() {
    setError(null);
    setIsLoading(true);
    // TODO: Implement actual retry logic
    setTimeout(() => setIsLoading(false), 1000);
  }

  // Handle keyboard shortcuts for quick filtering
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
          case 't':
            e.preventDefault();
            document.getElementById('tag-filter')?.focus();
            break;
          case 's':
            e.preventDefault();
            document.getElementById('sort-filter')?.focus();
            break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (error) {
    return <ErrorState error={error} onRetry={retryFetch} />;
  }

  return (
    <section className="space-y-8">
      {/* Header Section */}
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-bold text-neutral-900">Archive</h1>
        <p className="text-base text-neutral-600">Your processed lectures and study materials.</p>
      </header>

      {/* Enhanced Toolbar with Search & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search and Filters - Horizontal scrollable on mobile */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
          <input
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or tag..."
            className="h-11 w-full rounded-lg border border-neutral-300 px-4 text-base outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent sm:w-80 flex-shrink-0 bg-white text-neutral-900 placeholder-neutral-500"
            aria-label="Search archive by title or tags"
          />
          <select
            id="tag-filter"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="h-11 rounded-lg border border-neutral-300 px-4 text-base outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent flex-shrink-0 bg-white text-neutral-900"
            aria-label="Filter by tag"
          >
            {tags.map(t => <option key={t} value={t}>{t === "all" ? "All Tags" : t}</option>)}
          </select>
          <select
            id="sort-filter"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="h-11 rounded-lg border border-neutral-300 px-4 text-base outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent flex-shrink-0 bg-white text-neutral-900"
            aria-label="Sort archive items"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>

        {/* Upload New Button */}
        <Link
          href="/upload"
          className="h-11 inline-flex items-center justify-center rounded-lg bg-neutral-900 px-6 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex-shrink-0"
          aria-label="Upload new lecture or audio"
        >
          Upload New
        </Link>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-sm text-neutral-600 bg-neutral-100 rounded-lg p-3 border border-neutral-200">
        <span className="font-medium text-neutral-700">Keyboard shortcuts:</span>{" "}
        <kbd className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-700">Ctrl+K</kbd> search,{" "}
        <kbd className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-700">Ctrl+T</kbd> tags,{" "}
        <kbd className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs text-neutral-700">Ctrl+S</kbd> sort
      </div>

      {/* Content List */}
      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-6">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <Row
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** -------------------- Loading State -------------------- */
function LoadingState() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="h-7 bg-neutral-200 rounded animate-pulse w-3/4"></div>
            
            {/* Meta skeleton */}
            <div className="flex gap-4">
              <div className="h-5 bg-neutral-200 rounded animate-pulse w-20"></div>
              <div className="h-5 bg-neutral-200 rounded animate-pulse w-24"></div>
              <div className="h-5 bg-neutral-200 rounded animate-pulse w-32"></div>
            </div>
            
            {/* Tags skeleton */}
            <div className="flex gap-2">
              <div className="h-6 bg-neutral-200 rounded-full animate-pulse w-16"></div>
              <div className="h-6 bg-neutral-200 rounded-full animate-pulse w-20"></div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex gap-3 pt-4 border-t border-neutral-100">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-11 bg-neutral-200 rounded-lg animate-pulse w-24"></div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** -------------------- Error State -------------------- */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-neutral-300 bg-neutral-100 p-12 text-center">
      <div className="text-xl font-semibold text-neutral-800 mb-2">Failed to load archive</div>
      <p className="text-base text-neutral-700 mb-6">{error}</p>
      <button
        onClick={onRetry}
        className="h-11 rounded-lg bg-neutral-900 px-6 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
        aria-label="Try to load archive again"
      >
        Try Again
      </button>
    </div>
  );
}

/** -------------------- Empty State -------------------- */
function EmptyState() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
      <div className="text-6xl mb-4">📚</div>
      <div className="text-xl font-semibold text-neutral-900 mb-2">No lectures archived yet</div>
      <p className="text-base text-neutral-600 mb-6">
        Upload or record one to get started with your study materials.
      </p>
      <Link
        href="/upload"
        className="inline-flex items-center justify-center h-11 rounded-lg bg-neutral-900 px-6 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
        aria-label="Upload your first lecture"
      >
        Upload Your First Lecture
      </Link>
    </div>
  );
}

/** -------------------- Row with inline edit -------------------- */
function Row({
  item,
  onUpdate,
  onDelete,
}: {
  item: ArchiveItem;
  onUpdate: (id: string, patch: Partial<Pick<ArchiveItem, "title" | "tags">>) => void;
  onDelete: (id: string) => void;
}) {
  const expiresIn = hoursUntil(item.audioExpiresAt);
  const playable = !!item.audioUrl && !isExpired(item.audioExpiresAt);
  const expiringSoon = isExpiringSoon(item.audioExpiresAt);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [newTag, setNewTag] = useState("");

  function save() {
    onUpdate(item.id, { title: title.trim() || item.title, tags });
    setEditing(false);
  }
  function cancel() {
    setTitle(item.title);
    setTags(item.tags);
    setNewTag("");
    setEditing(false);
  }
  function addTag() {
    const t = newTag.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setNewTag("");
  }
  function removeTag(t: string) {
    setTags(prev => prev.filter(x => x !== t));
  }

  return (
    <div className="space-y-6">
      {/* Header: Title + Meta Info */}
      <div className="space-y-4">
        {/* Title with inline edit */}
        <div className="flex items-start justify-between gap-4">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-left text-xl font-semibold text-neutral-900 hover:text-neutral-700 hover:underline focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 rounded px-1 -ml-1"
              aria-label={`Edit title: ${item.title}`}
            >
              {item.title}
            </button>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 text-xl font-semibold outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-500"
                placeholder="Enter title..."
                autoFocus
                aria-label="Edit title"
              />
              <button
                onClick={save}
                className="h-11 rounded-lg bg-neutral-900 px-4 text-base font-medium text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
                aria-label="Save title changes"
              >
                Save
              </button>
              <button
                onClick={cancel}
                className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors"
                aria-label="Cancel title editing"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Meta: Date, Word Count, Tags */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-neutral-600">
          <span className="font-medium">{formatDate(item.createdAt)}</span>
          <span aria-hidden className="text-neutral-400">•</span>
          <span>{item.words.toLocaleString()} words</span>
          <span aria-hidden className="text-neutral-400">•</span>
          {!editing ? (
            <span className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span key={t} className="rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                  {t}
                </span>
              ))}
            </span>
          ) : (
            <div className="flex w-full flex-wrap items-center gap-3">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    className="text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1 rounded-full p-0.5"
                    aria-label={`Remove tag ${t}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add tag"
                  className="h-9 w-32 rounded-lg border border-neutral-300 px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-500"
                  aria-label="Add new tag"
                />
                <button
                  onClick={addTag}
                  className="h-9 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1 transition-colors"
                  aria-label="Add tag"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Player with Expiration Status */}
        {item.audioUrl && (
          <div className="space-y-3">
            {playable ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <audio 
                    src={item.audioUrl} 
                    controls 
                    className="w-full h-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400"
                    preload="metadata"
                    aria-label={`Audio playback for ${item.title}`}
                  >
                    Your browser does not support audio.
                  </audio>
                </div>
                {expiringSoon && (
                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 border border-neutral-300">
                    ⏰ Expires in {expiresIn}h
                  </span>
                )}
                {!expiringSoon && expiresIn !== null && expiresIn > 6 && (
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600 border border-neutral-200">
                    ✓ Available for {expiresIn}h
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-3 py-1 border border-neutral-200">
                  🕐 Audio expired
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-100">
        <Link
          href={`/archive/${item.id}`}
          className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex-1 sm:flex-none text-center min-w-[120px]"
          aria-label={`View transcript for ${item.title}`}
        >
          View
        </Link>
        <button
          onClick={() => console.log("TODO: send to ThinkSpace", item.id)}
          className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex-1 sm:flex-none text-center min-w-[120px]"
          aria-label={`Send ${item.title} to ThinkSpace`}
        >
          Send to ThinkSpace
        </button>
        <button
          onClick={() => console.log("TODO: export TXT", item.id)}
          className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex-1 sm:flex-none text-center min-w-[120px]"
          aria-label={`Export ${item.title} as text`}
        >
          Export
        </button>
        <button
          onClick={() => setEditing(true)}
          className="h-11 rounded-lg border border-neutral-300 px-4 text-base font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 transition-colors flex-1 sm:flex-none text-center min-w-[120px]"
          aria-label={`Edit ${item.title}`}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className={clsx(
            "h-11 rounded-lg px-4 text-base font-medium border transition-colors flex-1 sm:flex-none text-center min-w-[120px] focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
            "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
          )}
          aria-label={`Delete ${item.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
