import React, { useState } from 'react';
import { ELEMENTS, ElementType } from '../game/types';

interface BottomBookmarkBarProps {
  bookmarkedIds: ElementType[];
  currentType: ElementType;
  onSelectElement: (type: ElementType) => void;
  onToggleBookmark: (type: ElementType) => void;
}

export const BottomBookmarkBar: React.FC<BottomBookmarkBarProps> = ({
  bookmarkedIds,
  currentType,
  onSelectElement,
  onToggleBookmark,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (isMinimized) {
    return (
      <div
        id="bottom-bookmark-bar"
        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12161f]/95 backdrop-blur-md border border-slate-800 shadow-2xl select-none"
      >
        <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
          ★ Bookmarks ({bookmarkedIds.length})
        </span>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono cursor-pointer"
          title="Expand Bookmark Bar"
        >
          ▲ Expand
        </button>
      </div>
    );
  }

  return (
    <div
      id="bottom-bookmark-bar"
      className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#12161f]/95 backdrop-blur-md border border-slate-800 shadow-2xl select-none max-w-[92vw] overflow-x-auto scrollbar-thin"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider mr-1 shrink-0">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span>Bookmarks:</span>
      </div>

      {bookmarkedIds.map((id) => {
        const info = ELEMENTS[id];
        if (!info) return null;
        const isActive = id === currentType;
        return (
          <div
            key={id}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isActive
                ? 'bg-[#0B57D0] border-[#00d4ff] text-white shadow-md'
                : 'bg-slate-900/90 border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white'
            }`}
            onClick={() => onSelectElement(id)}
            title={`Equip ${info.name} Brush`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: info.color }}
            />
            <span className="truncate">{info.name}</span>

            {/* Unbookmark button on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(id);
              }}
              title="Remove bookmark"
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
            >
              ×
            </button>
          </div>
        );
      })}

      {bookmarkedIds.length === 0 && (
        <div className="text-xs font-mono text-slate-500 px-2 py-0.5">
          No bookmarks yet. Click the star icon on any element in the Element Picker to bookmark it here!
        </div>
      )}

      {/* Minimize button */}
      <button
        type="button"
        onClick={() => setIsMinimized(true)}
        className="ml-2 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono cursor-pointer shrink-0 border border-slate-700"
        title="Minimize Bookmark Bar"
      >
        ▼ Minimize
      </button>
    </div>
  );
};
