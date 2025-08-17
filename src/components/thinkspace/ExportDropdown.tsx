'use client';

import * as React from 'react';

/**
 * Minimal dropdown for Export action.
 * Uses native <details> to avoid extra deps.
 * Replace with shadcn/ui DropdownMenu if you prefer.
 */
export default function ExportDropdown({
  onExport,
}: {
  onExport: (type: 'txt' | 'pdf') => void;
}) {
  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
        Export
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <button
          className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          onClick={() => onExport('txt')}
        >
          Export as TXT
        </button>
        <button
          className="block w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          onClick={() => onExport('pdf')}
        >
          Export as PDF
        </button>
      </div>
    </details>
  );
}
