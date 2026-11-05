import React, { useState } from 'react';
import { DrawingToolMode, InspectedPixelData } from '../game/types';

interface ResizableCanvasStageProps {
  sandCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  previewCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  cursorRingRef: React.RefObject<HTMLDivElement | null>;
  simWidth: number;
  simHeight: number;
  displayScale: number;
  activeTool: DrawingToolMode;
  onSelectTool: (tool: DrawingToolMode) => void;
  brushRadius: number;
  onBrushRadiusChange: (r: number) => void;
  inspectedPixel: InspectedPixelData | null;
  onCloseInspector: () => void;
  onUpdateInspectedLife?: (delta: number) => void;
  onClearInspectedPixel?: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onPointerLeave: () => void;
  shakeTrauma: number;
  isPaused: boolean;
  isFastForward: boolean;
  onToggleFastForward: () => void;
  onTogglePause: () => void;
  onResetSimulation: () => void;
  isThermalHeatmap: boolean;
  onToggleThermalHeatmap: () => void;
}

const TOOLS_CONFIG: {
  id: DrawingToolMode;
  label: string;
  category: 'draw' | 'mod';
  tooltip: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  // Geometric Drawing Modes
  {
    id: 'brush',
    label: 'Brush',
    category: 'draw',
    tooltip: 'Freehand Paint Brush [B]',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'Line',
    category: 'draw',
    tooltip: 'Straight Line Tool [L] - Drag to draw straight lines',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="4" y1="20" x2="20" y2="4" />
        <circle cx="4" cy="20" r="1.5" fill="currentColor" />
        <circle cx="20" cy="4" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'box',
    label: 'Box',
    category: 'draw',
    tooltip: 'Filled Box / Rectangle Tool - Drag to create rectangular vessels',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" strokeDasharray="2 2" />
        <line x1="9" y1="3" x2="9" y2="21" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Circle',
    category: 'draw',
    tooltip: 'Circle Tool - Drag to draw circular perimeters or discs',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    id: 'bucket',
    label: 'Bucket',
    category: 'draw',
    tooltip: 'Flood Fill Bucket [G] - Click enclosed regions to fill',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l5 5a2.12 2.12 0 0 0 3 0L19 11z" />
        <path d="M5 2l5 5" />
        <path d="M2 13h15" />
        <path d="M22 20a2 2 0 1 1-4 0c0-1.6 2-3 2-3s2 1.4 2 3z" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'eyedropper',
    label: 'Picker',
    category: 'draw',
    tooltip: 'Eyedropper Element Picker [I] - Click to sample canvas element',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2l4 4-2 2-4-4 2-2z" />
        <path d="M12 4L3 13v5h5l9-9-5-5z" />
        <circle cx="5" cy="19" r="1" fill="currentColor" />
      </svg>
    ),
  },

  // Environmental & Physics Modifiers
  {
    id: 'wind_vector',
    label: 'Wind Vector',
    category: 'mod',
    tooltip: 'Air Velocity Vector Brush - Drag directional airflow lines',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
        <path d="M17.5 12.6A2.5 2.5 0 1 0 19 8H2" />
        <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
      </svg>
    ),
  },
  {
    id: 'thermal',
    label: 'Temp Gun',
    category: 'mod',
    tooltip: 'Temperature Thermal Brush - Left-click to heat, Right-click to cool',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        <circle cx="11.5" cy="17.5" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'gravity',
    label: 'Gravity Well',
    category: 'mod',
    tooltip: 'Gravity Well Attractor - Left-click attracts particles, Right-click repels',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        <path d="M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12" />
      </svg>
    ),
  },
  {
    id: 'inspector',
    label: 'Inspector',
    category: 'mod',
    tooltip: 'Pixel Property Inspector [Alt+Click] - Inspect element properties & calibrate life timer',
    icon: (a) => (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
];

export const ResizableCanvasStage: React.FC<ResizableCanvasStageProps> = ({
  sandCanvasRef,
  previewCanvasRef,
  cursorRingRef,
  simWidth,
  simHeight,
  displayScale,
  activeTool,
  onSelectTool,
  brushRadius,
  onBrushRadiusChange,
  inspectedPixel,
  onCloseInspector,
  onUpdateInspectedLife,
  onClearInspectedPixel,
  shakeTrauma,
  isPaused,
  isFastForward,
  onToggleFastForward,
  onTogglePause,
  onResetSimulation,
  isThermalHeatmap,
  onToggleThermalHeatmap,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
  onPointerLeave,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Screen shake offset calculation
  const shakeX = shakeTrauma > 0 ? (Math.random() - 0.5) * shakeTrauma * 16 : 0;
  const shakeY = shakeTrauma > 0 ? (Math.random() - 0.5) * shakeTrauma * 16 : 0;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.max(0.5, Math.min(4.0, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or space-drag for pan
    if (e.button === 1 || (e.shiftKey && e.button === 0)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanX(e.clientX - panStart.x);
      setPanY(e.clientY - panStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-4 relative select-none overflow-hidden bg-[#0a0d14]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* =====================================================================
          TOP-LEFT TELEMETRY & CONTROL CLUSTER (Pause, 3x Fast-Forward, Reset)
          ===================================================================== */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#12161f]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl font-mono text-xs">
        <button
          type="button"
          onClick={onTogglePause}
          className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
            isPaused
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Pause Simulation"
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>
        <button
          type="button"
          onClick={onToggleFastForward}
          className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
            isFastForward
              ? 'bg-[#00d4ff] text-slate-950 shadow-sm ring-1 ring-cyan-300'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Fast-Forward 3x Speed"
        >
          3x FAST
        </button>
        <button
          type="button"
          onClick={onResetSimulation}
          className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold transition-colors cursor-pointer"
          title="Reset Simulation Grid"
        >
          RESET
        </button>
      </div>
      {/* =====================================================================
          UNIFIED TOP CANVAS TOOLBAR (Powder Toy Drawing Modes, Modifiers & Zoom)
          ===================================================================== */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-[#12161f]/95 backdrop-blur-md border border-slate-700/80 shadow-2xl font-mono text-xs max-w-[96vw]">
        {/* Geometric Drawing Modes Button Group */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-bold uppercase px-1.5 hidden md:inline">
            Draw
          </span>
          {TOOLS_CONFIG.filter((t) => t.category === 'draw').map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                title={tool.tooltip}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'bg-[#0B57D0] text-white shadow-sm ring-1 ring-blue-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tool.icon(isActive)}
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-700 hidden sm:block" />

        {/* Environmental Physics Modifiers Button Group */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 font-bold uppercase px-1.5 hidden md:inline">
            Physics
          </span>
          {TOOLS_CONFIG.filter((t) => t.category === 'mod').map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectTool(tool.id)}
                title={tool.tooltip}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tool.icon(isActive)}
                <span className="hidden sm:inline">{tool.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-slate-700 hidden sm:block" />

        {/* Brush Radius Controls */}
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden lg:inline">Size:</span>
          <button
            type="button"
            onClick={() => onBrushRadiusChange(Math.max(1, brushRadius - 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer font-bold text-slate-200"
            title="Decrease Brush Size"
          >
            -
          </button>
          <span className="w-5 text-center font-bold text-[#00d4ff] tabular-nums">
            {brushRadius}
          </span>
          <button
            type="button"
            onClick={() => onBrushRadiusChange(Math.min(24, brushRadius + 1))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer font-bold text-slate-200"
            title="Increase Brush Size"
          >
            +
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700 hidden md:block" />

        {/* Zoom & View Reset */}
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden lg:inline">Zoom:</span>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.25))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer font-bold text-slate-200"
            title="Zoom Out"
          >
            -
          </button>
          <span className="w-10 text-center font-bold text-[#00d4ff] tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(4.0, prev + 0.25))}
            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer font-bold text-slate-200"
            title="Zoom In"
          >
            +
          </button>
          {(zoom !== 1.0 || panX !== 0 || panY !== 0) && (
            <button
              type="button"
              onClick={() => {
                setZoom(1.0);
                setPanX(0);
                setPanY(0);
              }}
              className="ml-1 px-1.5 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white font-semibold text-[10px] cursor-pointer"
              title="Reset View"
            >
              Reset
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-slate-700 hidden md:block" />

        {/* Thermal Heatmap Toggle */}
        <button
          type="button"
          onClick={onToggleThermalHeatmap}
          className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer text-xs ${
            isThermalHeatmap
              ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title="Toggle Thermal Heatmap Temperature Distribution Overlay"
        >
          HEATMAP {isThermalHeatmap ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Main Crucible Canvas Stage Container (Preset-driven resizing + Zoom & Pan) */}
      <div
        className="relative transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${shakeX + panX}px, ${shakeY + panY}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* The Sandbox Pixel Canvas & Preview Layer */}
        <div
          className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-[0_12px_45px_rgba(0,0,0,0.85)] bg-[#0d0f14]"
          style={{
            width: `${simWidth * displayScale}px`,
            height: `${simHeight * displayScale}px`,
            maxWidth: 'calc(100vw - 80px)',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          {/* Main Simulation Canvas */}
          <canvas
            ref={sandCanvasRef}
            width={simWidth}
            height={simHeight}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onContextMenu={onContextMenu}
            className="w-full h-full block cursor-crosshair touch-none"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Interactive Geometric Shape & Vector Preview Overlay */}
          <canvas
            ref={previewCanvasRef}
            width={simWidth}
            height={simHeight}
            className="absolute inset-0 pointer-events-none w-full h-full block"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Paused Watermark Overlay */}
          {isPaused && (
            <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-600/50 text-amber-300 text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-sm shadow-md">
              ⏸ Simulation Paused · Paint Active
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Cursor Ring */}
      <div
        id="cursor-ring"
        ref={cursorRingRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          border: '1.5px solid rgba(255, 255, 255, 0.75)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'none',
          boxShadow: '0 0 10px rgba(0, 212, 255, 0.5)',
          zIndex: 40,
        }}
      />

      {/* Pixel Property Inspector Telemetry Popover */}
      {inspectedPixel && (
        <div className="absolute bottom-4 left-4 z-40 w-72 p-3.5 rounded-xl bg-[#12161f]/95 backdrop-blur-md border border-slate-700 shadow-2xl font-mono text-xs space-y-2 text-slate-200 animate-in fade-in-50">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                style={{
                  backgroundColor: inspectedPixel.color,
                  color: inspectedPixel.color,
                }}
              />
              <span className="font-bold text-white text-sm">
                {inspectedPixel.elemName}
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseInspector}
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer font-bold"
              title="Close Inspector"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Coordinates</span>
              <span className="font-bold text-slate-300">
                ({inspectedPixel.x}, {inspectedPixel.y})
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Temperature</span>
              <span className="font-bold text-amber-400">
                {inspectedPixel.temperature ?? 22}°C
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Density</span>
              <span className="font-bold text-[#00d4ff]">
                {inspectedPixel.density} kg/m³
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Hardness (Mohs)</span>
              <span className="font-bold text-emerald-400">
                {inspectedPixel.hardness ?? 5} / 10
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Flammability</span>
              <span className="font-bold text-rose-400">
                {inspectedPixel.flammability ?? 0}%
              </span>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[9px] uppercase">Conductivity</span>
              <span className="font-bold text-sky-300 capitalize">
                {inspectedPixel.conductivity ?? 'Insulator'}
              </span>
            </div>
          </div>

          {inspectedPixel.reactivityNotes && (
            <div className="text-[10px] text-slate-400 px-1 italic bg-slate-900/60 p-1.5 rounded border border-slate-800/80">
              <span className="font-semibold text-slate-300 not-italic">Reactivity:</span> {inspectedPixel.reactivityNotes}
            </div>
          )}

          {inspectedPixel.chemicalFormula && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
              <span>Formula:</span>
              <span className="font-bold text-slate-200 font-mono">
                {inspectedPixel.chemicalFormula}
              </span>
            </div>
          )}

          {/* Interactive Life Adjuster Controls */}
          {onUpdateInspectedLife && (
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Adjust Life:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onUpdateInspectedLife(-5)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer text-xs"
                  title="Decrease Life (-5)"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateInspectedLife(+5)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer text-xs"
                  title="Increase Life (+5)"
                >
                  +5
                </button>
                {onClearInspectedPixel && (
                  <button
                    type="button"
                    onClick={onClearInspectedPixel}
                    className="ml-1 px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold cursor-pointer text-xs"
                    title="Clear Pixel"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
