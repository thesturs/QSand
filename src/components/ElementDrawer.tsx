import React, { useMemo, useState } from 'react';
import {
  ELEMENTS,
  ElementCategory,
  ElementMetadata,
  ElementType,
} from '../game/types';

interface ElementDrawerProps {
  currentType: ElementType;
  onSelectElement: (type: ElementType) => void;
  brushRadius: number;
  onBrushRadiusChange: (radius: number) => void;
  isFreePlay: boolean;
  onToggleFreePlay: () => void;
  onClearWorld: () => void;
  onDispenseBasket: () => void;
  basketCount: number;
  onSpawnAnomalies: () => void;
  anomaliesCount: number;
  show3DChamber: boolean;
  onToggle3DChamber: () => void;
  bookmarkedIds: ElementType[];
  onToggleBookmark: (type: ElementType) => void;
  isDrawerVisible?: boolean;
  onToggleVisibility?: () => void;
}

const CATEGORIES: { id: ElementCategory; label: string }[] = [
  { id: 'solids', label: 'Solids & Mineral' },
  { id: 'liquids', label: 'Liquids & Solvents' },
  { id: 'gases', label: 'Gases & Plasmas' },
  { id: 'explosives', label: 'Explosives & Ultimata' },
  { id: 'electronics', label: 'Electronics & Logic' },
  { id: 'nuclear', label: 'Nuclear & Exotics' },
  { id: 'alchemy', label: 'Alchemy Mod' },
  { id: 'thermodynamics', label: 'Thermodynamics' },
  { id: 'ray_emitters', label: 'Ray Emitters' },
  { id: 'optics', label: 'Optics' },
  { id: 'biology', label: 'Life' },
  { id: 'bioscience', label: 'Bioscience Lab' },
];

export const ElementDrawer: React.FC<ElementDrawerProps> = ({
  currentType,
  onSelectElement,
  brushRadius,
  onBrushRadiusChange,
  isFreePlay,
  onToggleFreePlay,
  onClearWorld,
  onDispenseBasket,
  basketCount,
  onSpawnAnomalies,
  anomaliesCount,
  show3DChamber,
  onToggle3DChamber,
  bookmarkedIds,
  onToggleBookmark,
  isDrawerVisible,
  onToggleVisibility,
}) => {
  const [activeCategory, setActiveCategory] =
    useState<ElementCategory>('solids');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalMinimized, setInternalMinimized] = useState<boolean>(false);

  // Controlled or uncontrolled minimized state
  const isMinimized =
    isDrawerVisible !== undefined ? !isDrawerVisible : internalMinimized;

  const handleToggle = () => {
    if (onToggleVisibility) {
      onToggleVisibility();
    } else {
      setInternalMinimized((prev) => !prev);
    }
  };

  const elementsList = useMemo(() => {
    return Object.values(ELEMENTS);
  }, []);

  const filteredElements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return elementsList.filter(
        (el) =>
          el.name.toLowerCase().includes(q) ||
          el.shortRole.toLowerCase().includes(q) ||
          el.description.toLowerCase().includes(q) ||
          (el.formula && el.formula.toLowerCase().includes(q))
      );
    }
    return elementsList.filter((el) => el.category === activeCategory);
  }, [elementsList, activeCategory, searchQuery]);

  const currentMetadata: ElementMetadata | undefined = ELEMENTS[currentType];

  // Minimized state rendering as a compact, animated icon button
  if (isMinimized) {
    return (
      <div className="w-full flex justify-start items-center transition-all duration-300 ease-in-out transform">
        <button
          type="button"
          onClick={handleToggle}
          id="toolbar"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12161f]/95 hover:bg-[#1a2232] border border-slate-700/80 shadow-2xl hover:border-[#00d4ff]/70 transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md select-none"
          title="Expand Element Drawer"
          aria-label="Expand Element Drawer"
        >
          <span
            className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
            style={{
              backgroundColor: currentMetadata?.color || '#38bdf8',
              color: currentMetadata?.color || '#38bdf8',
            }}
          />
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-slate-300 group-hover:text-[#00d4ff] transition-colors shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span className="text-xs font-mono font-bold text-slate-200">
            {currentMetadata?.name || 'Elements'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center gap-1 group-hover:text-white group-hover:border-slate-500">
            <span>Expand</span>
            <span>▼</span>
          </span>
        </button>
      </div>
    );
  }

  // Expanded state rendering with smooth appearance animation
  return (
    <div
      id="toolbar"
      className="w-full px-4 py-2.5 rounded-xl bg-[#12161f]/95 border border-slate-800 shadow-2xl transition-all duration-300 ease-in-out transform origin-top animate-in fade-in-50"
    >
      {/* Minimize / Expand Bar Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentMetadata?.color || '#38bdf8' }}
          />
          <span className="font-bold text-white">Element Picker & Toolbar</span>
          <span className="text-slate-500">
            ({currentMetadata?.name || 'Eraser'})
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          aria-label="Minimize Element Drawer"
          title="Minimize Element Drawer to small icon button"
          className="px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="4 14 12 6 20 14" />
          </svg>
          <span>Minimize</span>
        </button>
      </div>

      <div className="space-y-2.5 pt-2">
        {/* Category Tabs & Search Bar Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#0B57D0] text-white shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Live Filter Input */}
          <div className="flex items-center gap-2">
            <label htmlFor="element-search-filter" className="sr-only">
              Filter all elements
            </label>
            <input
              id="element-search-filter"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elements (Water, Wind, Lava, Mirror)..."
              className="w-48 px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00d4ff]"
            />
          </div>
        </div>

        {/* Element Button Matrix */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-h-24 overflow-y-auto pr-1">
          {filteredElements.map((info) => {
            const isActive = info.id === currentType;
            const isBookmarked = bookmarkedIds.includes(info.id);
            return (
              <div
                key={info.id}
                onClick={() => onSelectElement(info.id)}
                title={`${info.name} (${info.shortRole}): ${info.description}`}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-transform flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 border group ${
                  isActive
                    ? 'bg-slate-700/90 border-slate-300 text-white -translate-y-0.5 shadow'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{
                    backgroundColor: info.color,
                    boxShadow: info.glow ? `0 0 6px ${info.color}` : 'none',
                  }}
                />
                <span className="font-semibold">{info.name}</span>

                {/* Bookmark Star Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(info.id);
                  }}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark element'}
                  className={`ml-0.5 transition-colors cursor-pointer ${
                    isBookmarked
                      ? 'text-amber-400'
                      : 'text-slate-600 hover:text-amber-300'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-3.5 h-3.5"
                    fill={isBookmarked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
