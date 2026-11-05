import React, { useMemo, useState } from 'react';
import {
  APP_VERSION,
  BasketItem,
  ELEMENTS,
  ElementCategory,
  ElementType,
  TYPE_EMPTY,
  TYPE_WALL,
} from '../game/types';

interface UnifiedSideDockProps {
  currentType: ElementType;
  onSelectElement: (type: ElementType) => void;
  brushRadius: number;
  onBrushRadiusChange: (r: number) => void;
  isFreePlay: boolean;
  onToggleFreePlay: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onStepFrame?: () => void;
  onResetArena: () => void;
  onClearWorld: () => void;
  onSpawnAnomalies: () => void;
  anomaliesCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  basket: BasketItem[];
  onDispenseBasket: () => void;
  onOpenWorkbench: (tab: 'bioscience' | 'reporting' | 'guide') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type DockTab = 'elements' | 'controls' | 'reagents';

const CATEGORIES: { id: ElementCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'solids', label: 'Solids' },
  { id: 'liquids', label: 'Liquids' },
  { id: 'gases', label: 'Gases' },
  { id: 'explosives', label: 'Explosives' },
  { id: 'nuclear', label: 'Nuclear' },
  { id: 'alchemy', label: 'Alchemy' },
  { id: 'electronics', label: 'Circuits' },
  { id: 'thermodynamics', label: 'Thermal' },
  { id: 'ray_emitters', label: 'Emitters' },
  { id: 'optics', label: 'Optics' },
  { id: 'biology', label: 'Life' },
  { id: 'bioscience', label: 'Bio' },
];

export const UnifiedSideDock: React.FC<UnifiedSideDockProps> = ({
  currentType,
  onSelectElement,
  brushRadius,
  onBrushRadiusChange,
  isFreePlay,
  onToggleFreePlay,
  isPaused,
  onTogglePause,
  onStepFrame,
  onResetArena,
  onClearWorld,
  onSpawnAnomalies,
  anomaliesCount,
  isMuted,
  onToggleMute,
  basket,
  onDispenseBasket,
  onOpenWorkbench,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('elements');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ElementCategory | 'all'>('all');

  const currentMeta = ELEMENTS[currentType] || ELEMENTS[TYPE_WALL];

  const filteredElements = useMemo(() => {
    const list = Object.values(ELEMENTS);
    return list.filter((elem) => {
      if (selectedCategory !== 'all' && elem.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = elem.name.toLowerCase().includes(q);
        const matchRole = elem.shortRole.toLowerCase().includes(q);
        const matchFormula = elem.formula && elem.formula.toLowerCase().includes(q);
        const matchCategory = elem.category.toLowerCase().includes(q);
        return matchName || matchRole || matchFormula || matchCategory;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Collapsed Rail (56px)
  if (isCollapsed) {
    return (
      <aside
        className="w-14 z-20 flex flex-col items-center justify-between py-3 bg-[#10141d]/95 backdrop-blur-md border-r border-slate-800 text-slate-300 select-none shadow-2xl transition-all duration-200"
        aria-label="Crucible side dock collapsed"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Expand toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand Control Dock [H]"
            title="Expand Control Dock [H]"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-[#0B57D0] text-slate-200 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Active Element Swatch Chip */}
          <div
            className="w-9 h-9 rounded-lg border border-slate-700 flex flex-col items-center justify-center relative cursor-pointer group"
            onClick={() => onToggleCollapse()}
            title={`Active: ${currentMeta.name} [${currentMeta.keyBinding}] - Click to choose`}
          >
            <span
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{ backgroundColor: currentMeta.color }}
            />
            <span className="text-[9px] font-mono font-bold text-slate-300 mt-0.5 leading-none">
              {currentMeta.name.slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Brush Radius indicator */}
          <div
            className="text-[10px] font-mono text-slate-400 font-bold px-1 py-0.5 rounded bg-slate-900 border border-slate-800"
            title={`Brush Radius: ${brushRadius}px`}
          >
            {brushRadius}px
          </div>

          <div className="w-8 h-px bg-slate-800 my-0.5" />

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'Resume [P]' : 'Pause [P]'}
            title={isPaused ? 'Resume [P]' : 'Pause [P]'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer border ${
              isPaused
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/60'
            }`}
          >
            {isPaused ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>

          {/* Arena Reset Button */}
          <button
            type="button"
            onClick={onResetArena}
            aria-label="Reset Showcase Arena [R]"
            title="Reset Showcase Arena [R]"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Eraser Quick Swatch */}
          <button
            type="button"
            onClick={() => onSelectElement(TYPE_EMPTY)}
            aria-label="Select Void Eraser [0]"
            title="Void Eraser [0]"
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer border ${
              currentType === TYPE_EMPTY
                ? 'bg-[#0B57D0] text-white border-blue-400'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
          >
            <span className="text-[10px] font-mono font-bold">CLR</span>
          </button>
        </div>

        {/* Bottom items in collapsed rail */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Basket Quick Icon */}
          <button
            type="button"
            onClick={() => onOpenWorkbench('bioscience')}
            aria-label={`Bioscience Basket (${basket.length})`}
            title={`Bioscience Basket (${basket.length} items) - Open Workbench`}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#0B57D0]/20 hover:bg-[#0B57D0] text-blue-300 hover:text-white border border-blue-800/60 transition-colors cursor-pointer relative"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
            </svg>
            {basket.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
                {basket.length}
              </span>
            )}
          </button>

          {/* Audio Mute */}
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              {isMuted ? (
                <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              ) : (
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              )}
            </svg>
          </button>
        </div>
      </aside>
    );
  }

  // Expanded Dock (w-80 / 320px)
  return (
    <aside
      className="w-80 z-20 flex flex-col h-full bg-[#10141d]/98 backdrop-blur-xl border-r border-slate-800 text-slate-200 select-none shadow-2xl transition-all duration-200 overflow-hidden"
      aria-label="Crucible side dock expanded"
    >
      {/* Top Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
            <h2 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
              Crucible Deck · {APP_VERSION}
            </h2>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {isFreePlay ? 'Free Play Sandbox' : 'Containment Challenge'} · {35}+ Elements
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse Dock [H]"
          title="Collapse Dock [H]"
          className="w-7 h-7 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="grid grid-cols-3 p-1.5 gap-1 bg-[#0b0e14] border-b border-slate-800 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('elements')}
          className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center font-semibold ${
            activeTab === 'elements'
              ? 'bg-[#0B57D0] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Elements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('controls')}
          className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center font-semibold ${
            activeTab === 'controls'
              ? 'bg-[#0B57D0] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Controls
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reagents')}
          className={`py-1.5 px-2 rounded-md transition-colors cursor-pointer text-center font-semibold flex items-center justify-center gap-1 ${
            activeTab === 'reagents'
              ? 'bg-[#0B57D0] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>Basket</span>
          {basket.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-bold flex items-center justify-center">
              {basket.length}
            </span>
          )}
        </button>
      </div>

      {/* =====================================================================
          TAB 1: ELEMENTS MATRIX & SEARCH
          ===================================================================== */}
      {activeTab === 'elements' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-2.5 overflow-hidden">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search elements, formula, tags..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00d4ff] font-mono"
            />
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-200 text-slate-950 font-bold'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Elements Grid (Scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1">
            <div className="grid grid-cols-2 gap-1.5">
              {filteredElements.map((elem) => {
                const isSelected = currentType === elem.id;
                return (
                  <button
                    key={elem.id}
                    type="button"
                    onClick={() => onSelectElement(elem.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#0B57D0]/30 border-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.25)] ring-1 ring-[#00d4ff]'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: elem.color }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 leading-tight truncate">
                          {elem.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {elem.formula || elem.shortRole}
                        </div>
                      </div>
                    </div>

                    {elem.keyBinding && (
                      <span className="shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {elem.keyBinding}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredElements.length === 0 && (
              <div className="text-center py-8 text-xs font-mono text-slate-500">
                No elements found matching "{searchQuery}".
              </div>
            )}
          </div>

          {/* Selected Element Spec Box */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: currentMeta.color }}
                />
                {currentMeta.name}
              </span>
              <span className="text-[10px] text-[#00d4ff] uppercase tracking-wider">
                {currentMeta.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-tight">
              {currentMeta.description}
            </p>
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5 border-t border-slate-800/80">
              <span>Key: [{currentMeta.keyBinding || 'None'}]</span>
              {currentMeta.pubchemCid && <span>PubChem CID: {currentMeta.pubchemCid}</span>}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CONTROLS (Brush & Simulation Physics)
          ===================================================================== */}
      {activeTab === 'controls' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 font-mono text-xs">
          {/* Brush Radius Controls */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">Brush Radius</span>
              <span className="text-[#ffae00] font-bold tabular-nums">{brushRadius} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={brushRadius}
              onChange={(e) => onBrushRadiusChange(Number(e.target.value))}
              className="w-full accent-[#00d4ff] bg-slate-800 rounded h-1.5 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 pt-1">
              {[1, 2, 4, 8, 12, 16, 24].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onBrushRadiusChange(r)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer border ${
                    brushRadius === r
                      ? 'bg-[#0B57D0] text-white border-blue-400'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Mode Toggle */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">Game Mode</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!isFreePlay) onToggleFreePlay();
                }}
                className={`py-2 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                  isFreePlay
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                Free Play
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isFreePlay) onToggleFreePlay();
                }}
                className={`py-2 px-2 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                  !isFreePlay
                    ? 'bg-amber-950 text-amber-300 border-amber-600 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                Challenge
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-tight">
              {isFreePlay
                ? 'Infinite sandbox freedom: no game over or containment drain.'
                : 'Containment test: protect chamber integrity against anomaly swarms.'}
            </p>
          </div>

          {/* Physics Engine Actions */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200">Simulation Actions</span>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={onTogglePause}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-between cursor-pointer border ${
                  isPaused
                    ? 'bg-amber-950 text-amber-300 border-amber-600'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <span>{isPaused ? '▶ Resume Physics' : '⏸ Pause Physics'}</span>
                <span className="text-[10px] opacity-75">[P]</span>
              </button>

              {isPaused && onStepFrame && (
                <button
                  type="button"
                  onClick={onStepFrame}
                  className="w-full py-1.5 px-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Step 1 Frame</span>
                  <span className="text-[10px] opacity-75">[.]</span>
                </button>
              )}

              <button
                type="button"
                onClick={onResetArena}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>Reset Showcase Arena</span>
                <span className="text-[10px] opacity-75">[R]</span>
              </button>

              <button
                type="button"
                onClick={onClearWorld}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/80 flex items-center justify-between cursor-pointer"
              >
                <span>Clear World (Empty Void)</span>
                <span className="text-[10px] opacity-75">[0]</span>
              </button>

              <button
                type="button"
                onClick={onSpawnAnomalies}
                className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 flex items-center justify-between cursor-pointer"
              >
                <span>Spawn Anomaly Wave ({anomaliesCount})</span>
                <span className="text-[10px] opacity-75">[G]</span>
              </button>
            </div>
          </div>

          {/* Sound & Guide */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold cursor-pointer text-center"
            >
              {isMuted ? '🔇 Audio Muted' : '🔊 Audio Active'} [M]
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkbench('guide')}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold cursor-pointer text-center"
            >
              📖 Open Guide
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: REAGENTS & PUBCHEM BASKET
          ===================================================================== */}
      {activeTab === 'reagents' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-3 overflow-hidden font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Curated Reagent Basket</span>
            <span className="text-emerald-400 font-bold tabular-nums">{basket.length} items</span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
            {basket.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-white">
                  <span className="truncate">{item.name}</span>
                  <span className="text-[10px] text-amber-400 shrink-0">×{item.quantity}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{item.formula || item.elementName}</span>
                  {item.cid && <span>PubChem {item.cid}</span>}
                </div>
                {item.notes && (
                  <p className="text-[10px] text-slate-500 font-sans leading-tight">
                    {item.notes}
                  </p>
                )}
              </div>
            ))}

            {basket.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-500">
                Basket is empty. Add compounds from the Bioscience Workbench.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onDispenseBasket}
              disabled={basket.length === 0}
              className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
                basket.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
              }`}
            >
              Inject Basket into Crucible
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkbench('bioscience')}
              className="w-full py-2 px-3 rounded-lg bg-[#0B57D0] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Open Bioscience &amp; Basket Workbench
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
