import React, { useState } from 'react';
import { Reactor3DChamber } from './Reactor3DChamber';

interface Reactor3DCornerWidgetProps {
  exothermicIndex: number;
  activeParticles: number;
  containmentIntegrity: number;
  simulationCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  visible: boolean;
  onToggleVisible: () => void;
}

export const Reactor3DCornerWidget: React.FC<Reactor3DCornerWidgetProps> = ({
  exothermicIndex,
  activeParticles,
  containmentIntegrity,
  simulationCanvasRef,
  visible,
  onToggleVisible,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  if (!visible) {
    return (
      <div className="fixed bottom-4 right-4 z-20 pointer-events-auto">
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label="Show 3D Reactor Widget [V]"
          title="Show 3D Reactor Widget [V]"
          className="px-3 py-1.5 rounded-lg bg-[#12161f]/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#00d4ff] shadow-[0_0_6px_#00d4ff]" />
          <span>3D Core [V]</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Compact Corner Widget (Bottom-Right, 130x130) */}
      <div className="fixed bottom-4 right-4 z-20 pointer-events-auto flex flex-col items-end">
        <div className="w-36 h-36 rounded-xl bg-[#12161f]/95 border border-slate-800 p-1.5 shadow-2xl backdrop-blur-md flex flex-col relative group transition-all duration-150 hover:border-slate-700">
          {/* Header strip */}
          <div className="flex items-center justify-between px-1 pb-1 text-[9px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              CORE
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[#ffae00] font-bold tabular-nums">
                {exothermicIndex} EXO
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Expand 3D Orbital Inspection"
                className="hover:text-white text-slate-400 cursor-pointer ml-1"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onToggleVisible}
                title="Hide 3D Widget [V]"
                className="hover:text-white text-slate-500 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {/* Mini 3D Chamber Container */}
          <div
            className="flex-1 min-h-0 rounded-lg overflow-hidden bg-slate-950 relative cursor-pointer"
            onClick={() => setIsExpanded(true)}
            title="Click to expand 3D Orbital Chamber"
          >
            <Reactor3DChamber
              visible={visible}
              exothermicIndex={exothermicIndex}
              activeParticles={activeParticles}
              containmentIntegrity={containmentIntegrity}
              simulationCanvasRef={simulationCanvasRef}
            />

            {/* Hover expand overlay prompt */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded border border-slate-700">
                Expand 3D
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Resolution Expanded 3D Inspection Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm pointer-events-auto select-none"
          role="dialog"
          aria-modal="true"
          aria-label="3D Reactor Orbital Inspection"
        >
          <div className="w-full max-w-4xl h-[78vh] flex flex-col rounded-2xl bg-[#12161f] border border-slate-700 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 px-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]" />
                  <h3 className="text-sm font-mono font-bold tracking-wider text-white uppercase">
                    3D Volumetric Containment Vessel · Orbital Inspection
                  </h3>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Three.js PBR Shading · Real-Time Texture Sampling · Thermal Core Dynamics
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 cursor-pointer"
                >
                  Close [Esc]
                </button>
              </div>
            </div>

            {/* Main 3D Viewport in Modal */}
            <div className="flex-1 min-h-0 bg-slate-950 relative">
              <Reactor3DChamber
                visible={isExpanded}
                exothermicIndex={exothermicIndex}
                activeParticles={activeParticles}
                containmentIntegrity={containmentIntegrity}
                simulationCanvasRef={simulationCanvasRef}
              />

              {/* Orbital Navigation Hint */}
              <div className="absolute bottom-4 left-4 pointer-events-none px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-sm">
                🖱 Move mouse across viewport to orient orbital perspective
              </div>
            </div>

            {/* Modal Telemetry Footer */}
            <div className="p-3 px-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-slate-500 uppercase text-[10px]">INTEGRITY: </span>
                  <span className="font-bold text-emerald-400">{containmentIntegrity}%</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px]">EXOTHERMIC INDEX: </span>
                  <span className="font-bold text-[#ffae00]">{exothermicIndex} b</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase text-[10px]">ACTIVE MATTER: </span>
                  <span className="font-bold text-[#00d4ff]">{activeParticles} px</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 rounded-lg bg-[#0B57D0] hover:bg-blue-600 text-white font-bold cursor-pointer"
              >
                Return to Crucible
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
