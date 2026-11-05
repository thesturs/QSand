import React, { useEffect, useRef, useState } from 'react';
import {
  APP_VERSION,
  BasketItem,
  CustomReportSnapshot,
  DrawingToolMode,
  ELEMENTS,
  ElementType,
  HazardEntity,
  InspectedPixelData,
  PALETTE,
  SparkParticle,
  TYPE_ACID,
  TYPE_BIO_SPORE,
  TYPE_C4,
  TYPE_CRYO_GEL,
  TYPE_EMPTY,
  TYPE_FIRE,
  TYPE_LAVA,
  TYPE_SAND,
  TYPE_WALL,
  TYPE_WATER,
} from './game/types';
import {
  applyAirForceVector,
  applyGravityAttractor,
  applyTemperatureBrush,
  buildCustomReportSnapshot,
  CANVAS_PRESETS,
  CanvasSizePreset,
  computeElementCensus,
  computeExothermicIndex,
  computeShannonEntropy,
  createSimulationState,
  DISPLAY_SCALE,
  drawRasterBox,
  drawRasterCircle,
  drawRasterLine,
  executeFloodFill,
  getPixel,
  getPixelInspectorData,
  GRID_HEIGHT,
  GRID_WIDTH,
  initWorld,
  injectBasketIntoSimulation,
  paintBrush,
  pushUndoSnapshot,
  resizeSimulationState,
  seedShowcaseArena,
  setPixel,
  stepPhysics,
  undoSimulationState,
  getThermalHeatmapColor,
} from './game/simulation';
import { soundSynth } from './game/audio';
import { ElementDrawer } from './components/ElementDrawer';
import { ResizableCanvasStage } from './components/ResizableCanvasStage';
import { Reactor3DCornerWidget } from './components/Reactor3DCornerWidget';
import { BottomBookmarkBar } from './components/BottomBookmarkBar';
import {
  BioscienceReportingDrawer,
  WorkbenchTab,
} from './components/BioscienceReportingDrawer';

type GameLifecycleState = 'title' | 'playing' | 'paused' | 'gameover';

const MAX_SPARKS = 256;

export default function App() {
  const [gameState, setGameState] = useState<GameLifecycleState>('playing');
  const [isFreePlay, setIsFreePlay] = useState<boolean>(true);
  const [currentType, setCurrentType] = useState<ElementType>(TYPE_SAND);
  const [brushRadius, setBrushRadius] = useState<number>(4);
  const [activeTool, setActiveTool] = useState<DrawingToolMode>('brush');
  const [inspectedPixel, setInspectedPixel] = useState<InspectedPixelData | null>(null);
  const [show3DChamber, setShow3DChamber] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFastForward, setIsFastForward] = useState<boolean>(false);
  const isFastForwardRef = useRef<boolean>(false);

  useEffect(() => {
    isFastForwardRef.current = isFastForward;
  }, [isFastForward]);

  const activeToolRef = useRef<DrawingToolMode>(activeTool);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  // Canvas Resizing Dimensions & Preset State
  const [simWidth, setSimWidth] = useState<number>(GRID_WIDTH);
  const [simHeight, setSimHeight] = useState<number>(GRID_HEIGHT);
  const [displayScale, setDisplayScale] = useState<number>(DISPLAY_SCALE);
  const [currentPresetId, setCurrentPresetId] = useState<string>('standard');
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState<boolean>(false);

  // Bookmarked Elements State
  const [bookmarkedIds, setBookmarkedIds] = useState<ElementType[]>([
    TYPE_SAND,
    TYPE_WATER,
    TYPE_FIRE,
    TYPE_WALL,
    TYPE_C4,
    TYPE_ACID,
  ]);

  // Element Drawer Visibility State
  const [isElementDrawerVisible, setIsElementDrawerVisible] = useState<boolean>(true);

  const handleToggleBookmark = (id: ElementType) => {
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  // Workbench modal state
  const [workbenchOpen, setWorkbenchOpen] = useState<boolean>(false);
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>('bioscience');

  // HUD live throttled metrics
  const [hudStats, setHudStats] = useState({
    fps: 60,
    particles: 0,
    score: 0,
    bestScore: 1450,
    integrity: 100,
    entropy: 1.42,
    exothermic: 18,
    anomaliesCount: 0,
  });

  const [endRunSnapshot, setEndRunSnapshot] = useState({
    victory: true,
    score: 0,
    bestScore: 1450,
    particles: 0,
    entropy: 0,
    integrity: 100,
  });

  // Curated Reagent Basket
  const [basket, setBasket] = useState<BasketItem[]>([
    {
      id: 'BSK-INIT-1',
      name: 'Imatinib Bio-Spore Inoculum',
      elementType: TYPE_BIO_SPORE,
      elementName: 'Bio-Spore',
      brushRadius: 4,
      quantity: 3,
      cid: 5291,
      formula: 'C29H31N7O',
      molecularWeight: 493.6,
      xlogp: 3.5,
      tpsa: 86.3,
      lipinskiPass: true,
      notes: 'PubChem CID 5291 · ABL1 Kinase Agent',
      addedAt: '10:24:00',
    },
    {
      id: 'BSK-INIT-2',
      name: 'Aspirin Corrosive Acid Charge',
      elementType: TYPE_ACID,
      elementName: 'Acid',
      brushRadius: 5,
      quantity: 2,
      cid: 2244,
      formula: 'C9H8O4',
      molecularWeight: 180.16,
      xlogp: 1.2,
      tpsa: 63.6,
      lipinskiPass: true,
      notes: 'PubChem CID 2244 · Organic Acid Solvent',
      addedAt: '10:24:15',
    },
  ]);

  const [reports, setReports] = useState<CustomReportSnapshot[]>([]);
  const [liveCensus, setLiveCensus] = useState<Record<string, number>>({});
  const [isThermalHeatmap, setIsThermalHeatmap] = useState<boolean>(false);
  const isThermalHeatmapRef = useRef<boolean>(false);
  useEffect(() => {
    isThermalHeatmapRef.current = isThermalHeatmap;
  }, [isThermalHeatmap]);

  // Canvas & Simulation Mutable Refs
  const sandCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorRingRef = useRef<HTMLDivElement | null>(null);
  const simStateRef = useRef(createSimulationState(GRID_WIDTH, GRID_HEIGHT));

  // Pre-allocated Spark Pool
  const sparkPoolRef = useRef<SparkParticle[]>(
    Array.from({ length: MAX_SPARKS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 35,
      color: '#ff9d00',
    }))
  );
  const sparkCursorRef = useRef(0);

  // Autonomous Reactor Anomalies
  const hazardsRef = useRef<HazardEntity[]>([]);

  // Interaction & Loop Refs
  const pointerStateRef = useRef({
    isDrawing: false,
    isRightClick: false,
    isShift: false,
    mouseX: Math.floor(GRID_WIDTH / 2),
    mouseY: Math.floor(GRID_HEIGHT / 2),
  });
  const currentTypeRef = useRef<ElementType>(currentType);
  const brushRadiusRef = useRef<number>(brushRadius);
  const gameStateRef = useRef<GameLifecycleState>(gameState);
  const isFreePlayRef = useRef<boolean>(isFreePlay);
  const workbenchOpenRef = useRef<boolean>(workbenchOpen);
  const hitstopTimerRef = useRef<number>(0);
  const shakeTraumaRef = useRef<number>(0);

  useEffect(() => {
    currentTypeRef.current = currentType;
  }, [currentType]);

  useEffect(() => {
    brushRadiusRef.current = brushRadius;
  }, [brushRadius]);

  useEffect(() => {
    gameStateRef.current = gameState;
    document.body.dataset.state = gameState;
  }, [gameState]);

  useEffect(() => {
    isFreePlayRef.current = isFreePlay;
    simStateRef.current.isFreePlay = isFreePlay;
  }, [isFreePlay]);

  useEffect(() => {
    workbenchOpenRef.current = workbenchOpen;
  }, [workbenchOpen]);

  // Global Keyboard Shortcuts for Drawing Tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'b') setActiveTool('brush');
      else if (key === 'l') setActiveTool('line');
      else if (key === 'g') setActiveTool('bucket');
      else if (key === 'i') setActiveTool('inspector');
      else if (key === 'q') setActiveTool('eyedropper');
      else if (key === 'v') setActiveTool('wind_vector');
      else if (key === 't') setActiveTool('thermal');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Seed initial showcase world and initial report on mount
  useEffect(() => {
    seedShowcaseArena(simStateRef.current);
    const initialCensus = computeElementCensus(simStateRef.current);
    setLiveCensus(initialCensus);
    const initialReport = buildCustomReportSnapshot(
      simStateRef.current,
      'Baseline Containment Calibration',
      60,
      basket
    );
    setReports([initialReport]);
  }, []);

  const spawnSparks = (
    x: number,
    y: number,
    count = 4,
    intense = false
  ): void => {
    const pool = sparkPoolRef.current;
    for (let i = 0; i < count; i++) {
      const idx = sparkCursorRef.current;
      sparkCursorRef.current = (idx + 1) % MAX_SPARKS;
      const s = pool[idx];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (intense ? 4 : 1.5) + 0.5;
      s.active = true;
      s.x = x;
      s.y = y;
      s.vx = Math.cos(angle) * speed;
      s.vy = Math.sin(angle) * speed - 0.5;
      s.life = (Math.random() * 20 + 15) | 0;
      s.maxLife = 35;
      s.color = intense
        ? '#ffffff'
        : Math.random() > 0.4
          ? '#ff9d00'
          : '#ff4400';
    }
  };

  const spawnHazardWave = () => {
    const existing = hazardsRef.current;
    const baseId = Date.now();
    const sim = simStateRef.current;
    const midX = Math.floor(sim.width / 2);
    existing.push(
      {
        id: baseId + 1,
        archetype: 'pyro_mite',
        name: 'Pyro-Mite Swarmer',
        x: Math.max(25, midX - 60),
        y: 35,
        vx: 0.7,
        vy: 0.2,
        hp: 3,
        maxHp: 3,
        windupTimer: 0,
        attackCooldown: 120,
        koTimer: 0,
      },
      {
        id: baseId + 2,
        archetype: 'cryo_wisp',
        name: 'Cryo-Wisp Orbiter',
        x: midX,
        y: 42,
        vx: -0.6,
        vy: 0.3,
        hp: 3,
        maxHp: 3,
        windupTimer: 0,
        attackCooldown: 150,
        koTimer: 0,
      },
      {
        id: baseId + 3,
        archetype: 'acid_leech',
        name: 'Acid-Leech Charger',
        x: Math.min(sim.width - 25, midX + 60),
        y: 38,
        vx: -0.8,
        vy: 0.4,
        hp: 4,
        maxHp: 4,
        windupTimer: 0,
        attackCooldown: 110,
        koTimer: 0,
      }
    );
    soundSynth.playSparkCue();
  };

  const startPlaying = () => {
    document.body.dataset.state = 'playing';
    setGameState('playing');
    pointerStateRef.current.isDrawing = false;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const triggerEndState = (victory: boolean) => {
    if (isFreePlayRef.current && !victory) return;

    const sim = simStateRef.current;
    const census = computeElementCensus(sim);
    const entropy = computeShannonEntropy(census);
    const score = Math.round(sim.reactionScore);
    const best = Math.max(hudStats.bestScore, score);
    setEndRunSnapshot({
      victory,
      score,
      bestScore: best,
      particles: sim.activeParticles,
      entropy,
      integrity: Math.round(sim.containmentIntegrity),
    });
    soundSynth.playFanfare(victory);
    document.body.dataset.state = 'gameover';
    setGameState('gameover');
  };

  // Canvas Resize Handlers & Preset Selection
  const handleSelectPreset = (preset: CanvasSizePreset) => {
    pushUndoSnapshot(simStateRef.current);
    resizeSimulationState(simStateRef.current, preset.width, preset.height);
    setSimWidth(preset.width);
    setSimHeight(preset.height);
    setDisplayScale(preset.scale);
    setCurrentPresetId(preset.id);
    setSettingsDropdownOpen(false);
  };

  const handleUndo = () => {
    const success = undoSimulationState(simStateRef.current);
    if (success) {
      const sim = simStateRef.current;
      setSimWidth(sim.width);
      setSimHeight(sim.height);
      soundSynth.playSparkCue();
    }
  };

  const handleSaveSimulation = () => {
    const sim = simStateRef.current;
    const payload = {
      version: APP_VERSION,
      width: sim.width,
      height: sim.height,
      frameCount: sim.frameCount,
      reactionScore: sim.reactionScore,
      containmentIntegrity: sim.containmentIntegrity,
      isFreePlay: sim.isFreePlay,
      grid: Array.from(sim.grid),
      life: Array.from(sim.life),
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum_powder_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSettingsDropdownOpen(false);
  };

  const handleLoadSimulation = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data && data.width && data.height && Array.isArray(data.grid)) {
            pushUndoSnapshot(simStateRef.current);
            const sim = simStateRef.current;
            sim.width = data.width;
            sim.height = data.height;
            sim.frameCount = data.frameCount || 0;
            sim.reactionScore = data.reactionScore || 0;
            sim.containmentIntegrity = data.containmentIntegrity ?? 100;
            sim.isFreePlay = data.isFreePlay ?? true;
            sim.grid = new Uint8Array(data.grid);
            sim.life = new Uint8Array(data.life || data.grid.length);
            sim.updated = new Uint8Array(data.grid.length);

            setSimWidth(data.width);
            setSimHeight(data.height);
            soundSynth.playFanfare(true);
          }
        } catch (err) {
          console.error('Failed to parse simulation save file', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setSettingsDropdownOpen(false);
  };

  // Global keyboard shortcuts (Element hotkeys removed as requested)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.key === 'Escape') {
        if (workbenchOpenRef.current) {
          setWorkbenchOpen(false);
          return;
        }
        setSettingsDropdownOpen(false);
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
        return;
      }

      if (workbenchOpenRef.current) return;

      const key = e.key.toUpperCase();
      if (key === 'P') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : 'paused'));
      } else if (key === 'V') {
        setShow3DChamber((prev) => !prev);
      } else if (key === 'M') {
        setIsMuted((prev) => {
          const next = !prev;
          soundSynth.isMuted = next;
          return next;
        });
      } else if (key === 'R') {
        pushUndoSnapshot(simStateRef.current);
        seedShowcaseArena(simStateRef.current);
        hazardsRef.current = [];
      } else if (key === 'G') {
        spawnHazardWave();
      }
    };

    const handleBlur = () => {
      pointerStateRef.current.isDrawing = false;
      pointerStateRef.current.isRightClick = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60fps Volumetric Cellular Automata & Bloom Canvas Loop
  useEffect(() => {
    const canvas = sandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let currentW = simStateRef.current.width;
    let currentH = simStateRef.current.height;
    canvas.width = currentW;
    canvas.height = currentH;

    const bloomCanvas = document.createElement('canvas');
    bloomCanvas.width = currentW;
    bloomCanvas.height = currentH;
    const bloomCtx = bloomCanvas.getContext('2d');

    let imgData = ctx.createImageData(currentW, currentH);
    let buf32 = new Uint32Array(imgData.data.buffer);
    let bloomData = bloomCtx ? bloomCtx.createImageData(currentW, currentH) : null;
    let bloomBuf32 = bloomData ? new Uint32Array(bloomData.data.buffer) : null;

    let animId = 0;
    let frameCounter = 0;
    let lastFpsStamp = performance.now();
    let lastprevTime = performance.now();

    const updateHazards = (sim: typeof simStateRef.current) => {
      const list = hazardsRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const h = list[i];
        if (h.koTimer > 0) {
          h.koTimer--;
          if (h.koTimer <= 0) {
            spawnSparks(h.x, h.y, 18, true);
            list.splice(i, 1);
          }
          continue;
        }

        const cx = Math.max(2, Math.min(sim.width - 3, Math.floor(h.x)));
        const cy = Math.max(2, Math.min(sim.height - 3, Math.floor(h.y)));
        const cell = sim.grid[cy * sim.width + cx];

        if (
          (h.archetype === 'pyro_mite' &&
            (cell === TYPE_WATER || cell === TYPE_CRYO_GEL)) ||
          (h.archetype === 'cryo_wisp' &&
            (cell === TYPE_FIRE || cell === TYPE_LAVA)) ||
          (h.archetype === 'acid_leech' &&
            (cell === TYPE_SAND || cell === TYPE_FIRE))
        ) {
          h.hp--;
          hitstopTimerRef.current = 0.05;
          shakeTraumaRef.current = Math.min(1, shakeTraumaRef.current + 0.45);
          spawnSparks(h.x, h.y, 14, true);
          soundSynth.playDetonation(10);
          sim.reactionScore += 75;
          if (h.hp <= 0) {
            h.koTimer = 18;
            continue;
          }
        }

        if (h.archetype === 'pyro_mite') {
          h.x += h.vx;
          h.y += Math.sin(sim.frameCount * 0.08 + h.id) * 0.45;
        } else if (h.archetype === 'cryo_wisp') {
          h.x += Math.cos(sim.frameCount * 0.04 + h.id) * 0.65;
          h.y += Math.sin(sim.frameCount * 0.04 + h.id) * 0.45;
        } else {
          h.x += h.vx * 1.25;
          h.y += h.vy * 0.5;
        }

        if (h.x < 18 || h.x > sim.width - 18) h.vx *= -1;
        if (h.y < 18 || h.y > sim.height - 35) h.vy *= -1;

        h.attackCooldown--;
        if (h.attackCooldown <= 25 && h.attackCooldown > 0) {
          h.windupTimer = h.attackCooldown;
        } else if (h.attackCooldown <= 0) {
          h.windupTimer = 0;
          h.attackCooldown = 135;
          const payload =
            h.archetype === 'pyro_mite'
              ? TYPE_FIRE
              : h.archetype === 'cryo_wisp'
                ? TYPE_CRYO_GEL
                : TYPE_ACID;
          paintBrush(sim, Math.floor(h.x), Math.floor(h.y), 4, payload);

          if (!isFreePlayRef.current) {
            sim.containmentIntegrity = Math.max(
              0,
              sim.containmentIntegrity - 2.5
            );
            if (
              sim.containmentIntegrity <= 0 &&
              gameStateRef.current === 'playing'
            ) {
              triggerEndState(false);
            }
          }
        }
      }
    };

    const renderFrame = () => {
      const sim = simStateRef.current;
      const w = sim.width;
      const h = sim.height;

      // Handle dynamic canvas buffer resizing seamlessly
      if (w !== currentW || h !== currentH) {
        currentW = w;
        currentH = h;
        canvas.width = w;
        canvas.height = h;
        bloomCanvas.width = w;
        bloomCanvas.height = h;
        imgData = ctx.createImageData(w, h);
        buf32 = new Uint32Array(imgData.data.buffer);
        if (bloomCtx) {
          bloomData = bloomCtx.createImageData(w, h);
          bloomBuf32 = new Uint32Array(bloomData.data.buffer);
        }
      }

      const grid = sim.grid;
      const fCount = sim.frameCount;

      buf32.fill(0xff0d0f14);
      if (bloomBuf32) bloomBuf32.fill(0x00000000);

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const elem = grid[idx];
          if (elem === TYPE_EMPTY) continue;

          const palette = PALETTE[elem] || PALETTE[TYPE_WALL];
          const baseColor = palette[(x ^ y) % palette.length];

          // 1. Volumetric Normal-Mapped Shading
          const emptyAbove = grid[(y - 1) * w + x] === TYPE_EMPTY;
          const emptyLeft = grid[y * w + (x - 1)] === TYPE_EMPTY;
          const emptyBelow = grid[(y + 1) * w + x] === TYPE_EMPTY;
          const emptyRight = grid[y * w + (x + 1)] === TYPE_EMPTY;

          let r = baseColor & 0xff;
          let g = (baseColor >> 8) & 0xff;
          let b = (baseColor >> 16) & 0xff;
          let a = 0xff;

          if (emptyAbove || emptyLeft) {
            r = Math.min(255, r + 45);
            g = Math.min(255, g + 45);
            b = Math.min(255, b + 45);
          } else if (emptyBelow || emptyRight) {
            r = Math.max(0, r - 35);
            g = Math.max(0, g - 35);
            b = Math.max(0, b - 35);
          }

          // 2. Fluid Surface Shimmer
          if (elem === TYPE_WATER) {
            const wave = Math.sin(x * 0.2 + fCount * 0.1) * 20;
            b = Math.min(255, Math.max(0, b + wave));
            a = 230;
          }

          buf32[idx] = (a << 24) | (b << 16) | (g << 8) | r;

          // 3. Emissive Glow Map Extraction for glowing elements
          if (bloomBuf32 && ELEMENTS[elem]?.glow) {
            bloomBuf32[idx] = (220 << 24) | (b << 16) | (g << 8) | r;
          }
        }
      }

      // Thermal Heatmap Overlay
      if (isThermalHeatmapRef.current) {
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const elem = grid[idx];
            const tColor = getThermalHeatmapColor(elem);
            if (tColor !== 0) {
              const tr = tColor & 0xff;
              const tg = (tColor >> 8) & 0xff;
              const tb = (tColor >> 16) & 0xff;
              const pr = buf32[idx] & 0xff;
              const pg = (buf32[idx] >> 8) & 0xff;
              const pb = (buf32[idx] >> 16) & 0xff;
              const r = Math.floor(pr * 0.4 + tr * 0.6);
              const g = Math.floor(pg * 0.4 + tg * 0.6);
              const b = Math.floor(pb * 0.4 + tb * 0.6);
              buf32[idx] = (0xff << 24) | (b << 16) | (g << 8) | r;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Multi-pass Volumetric Bloom
      if (bloomCtx && bloomData) {
        bloomCtx.putImageData(bloomData, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = 'blur(6px)';
        ctx.drawImage(bloomCanvas, 0, 0);
        ctx.filter = 'blur(2px)';
        ctx.drawImage(bloomCanvas, 0, 0);
        ctx.restore();
      }

      // Render Vector Sparks
      ctx.save();
      const pool = sparkPoolRef.current;
      for (let i = 0; i < MAX_SPARKS; i++) {
        const s = pool[i];
        if (!s.active) continue;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.08;
        s.life--;

        if (s.life <= 0 || s.x < 0 || s.x >= w || s.y < 0 || s.y >= h) {
          s.active = false;
          continue;
        }

        ctx.strokeStyle = s.color;
        ctx.globalAlpha = s.life / s.maxLife;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 1.5, s.y - s.vy * 1.5);
        ctx.stroke();
      }
      ctx.restore();

      // Render Reactor Anomalies
      if (hazardsRef.current.length > 0) {
        ctx.save();
        for (const h of hazardsRef.current) {
          const color =
            h.archetype === 'pyro_mite'
              ? '#f97316'
              : h.archetype === 'cryo_wisp'
                ? '#06b6d4'
                : '#22c55e';

          if (h.windupTimer > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(h.x, h.y, 4 + (25 - h.windupTimer) * 0.25, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.fillStyle = h.koTimer > 0 ? '#ffffff' : color;
          ctx.beginPath();
          ctx.arc(
            h.x,
            h.y,
            h.koTimer > 0 ? h.koTimer * 0.25 : 3.2,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const loop = (timestamp: number) => {
      const rawDt = (timestamp - lastprevTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastprevTime = timestamp;
      frameCounter++;

      const sim = simStateRef.current;
      const pState = pointerStateRef.current;

      if (pState.isDrawing && !workbenchOpenRef.current) {
        if (activeToolRef.current === 'brush') {
          const drawType = pState.isRightClick
            ? TYPE_EMPTY
            : currentTypeRef.current;
          paintBrush(
            sim,
            pState.mouseX,
            pState.mouseY,
            brushRadiusRef.current,
            drawType,
            pState.isShift
          );
          if (frameCounter % 5 === 0) {
            soundSynth.playPaintTick(drawType === TYPE_EMPTY ? 0.7 : 1.1);
          }
        } else if (activeToolRef.current === 'thermal') {
          applyTemperatureBrush(
            sim,
            pState.mouseX,
            pState.mouseY,
            brushRadiusRef.current,
            pState.isRightClick ? -50 : 50
          );
          if (frameCounter % 8 === 0) {
            soundSynth.playSparkCue();
          }
        } else if (activeToolRef.current === 'gravity') {
          applyGravityAttractor(
            sim,
            pState.mouseX,
            pState.mouseY,
            brushRadiusRef.current * 3,
            !pState.isRightClick
          );
        }
      }

      if (hitstopTimerRef.current > 0) {
        hitstopTimerRef.current = Math.max(0, hitstopTimerRef.current - dt);
      } else if (
        gameStateRef.current === 'playing' ||
        gameStateRef.current === 'title'
      ) {
        const steps = isFastForwardRef.current ? 3 : 1;
        for (let s = 0; s < steps; s++) {
          stepPhysics(sim, {
            onSpark: (x, y, count, intense) => {
              spawnSparks(x, y, count, intense);
              if (intense && s === 0) soundSynth.playSparkCue();
            },
            onExplosion: (_x, _y, radius) => {
              hitstopTimerRef.current = 0.045;
              shakeTraumaRef.current = Math.min(1, shakeTraumaRef.current + 0.65);
              if (s === 0) soundSynth.playDetonation(radius);
            },
          });
        }
        if (gameStateRef.current === 'playing') {
          updateHazards(sim);
        }
      }

      if (shakeTraumaRef.current > 0) {
        shakeTraumaRef.current = Math.max(0, shakeTraumaRef.current - dt * 2.2);
      }

      renderFrame();

      // Throttle React HUD state updates to ~2.5Hz
      if (timestamp - lastFpsStamp >= 400) {
        const currentFps = Math.min(
          60,
          Math.max(
            1,
            Math.round((frameCounter * 1000) / (timestamp - lastFpsStamp))
          )
        );
        const census = computeElementCensus(sim);
        const entropy = computeShannonEntropy(census);
        const exo = computeExothermicIndex(census);

        setLiveCensus(census);
        setHudStats((prev) => ({
          fps: currentFps,
          particles: sim.activeParticles,
          score: Math.round(sim.reactionScore),
          bestScore: Math.max(prev.bestScore, Math.round(sim.reactionScore)),
          integrity: Math.round(sim.containmentIntegrity),
          entropy,
          exothermic: exo,
          anomaliesCount: hazardsRef.current.length,
        }));

        frameCounter = 0;
        lastFpsStamp = timestamp;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const updateMousePos = (clientX: number, clientY: number) => {
    const canvas = sandCanvasRef.current;
    if (!canvas) return;
    const sim = simStateRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / sim.width;
    const scaleY = rect.height / sim.height;

    const mx = Math.floor((clientX - rect.left) / scaleX);
    const my = Math.floor((clientY - rect.top) / scaleY);
    pointerStateRef.current.mouseX = Math.max(1, Math.min(sim.width - 2, mx));
    pointerStateRef.current.mouseY = Math.max(1, Math.min(sim.height - 2, my));

    const ring = cursorRingRef.current;
    if (ring) {
      ring.style.left = `${clientX}px`;
      ring.style.top = `${clientY}px`;
      ring.style.width = `${brushRadiusRef.current * 2 * scaleX}px`;
      ring.style.height = `${brushRadiusRef.current * 2 * scaleY}px`;
    }
  };

  const handleAddToBasket = (item: BasketItem) => {
    setBasket((prev) => [item, ...prev]);
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((b) => b.id !== id));
  };

  const handleInjectBasket = () => {
    pushUndoSnapshot(simStateRef.current);
    injectBasketIntoSimulation(simStateRef.current, basket, {
      onSpark: (x, y, c, i) => spawnSparks(x, y, c, i),
    });
    soundSynth.playDetonation(14);
  };

  const handleGenerateReport = (title: string) => {
    const snap = buildCustomReportSnapshot(
      simStateRef.current,
      title,
      hudStats.fps,
      basket
    );
    setReports((prev) => [snap, ...prev]);
    soundSynth.playSparkCue();
  };

  const activeElementMeta = ELEMENTS[currentType] || ELEMENTS[TYPE_SAND];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#08090c] select-none flex flex-col font-sans">
      {/* =====================================================================
          TOP TELEMETRY & WORKBENCH ACCESS BAR (Zero-Pill, Unboxed Ribbon)
          ===================================================================== */}
      <header className="z-30 w-full px-4 py-2 bg-[#10141d]/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shadow-md shrink-0">
        {/* Left branding & Game State Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
            <h1 className="text-sm font-mono font-bold tracking-wide text-white">
              QUANTUM POWDER
            </h1>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Mode Badge */}
          <button
            type="button"
            onClick={() => setIsFreePlay((prev) => !prev)}
            title="Toggle between Free Play and Challenge Mode"
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border ${
              isFreePlay
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
            }`}
          >
            {isFreePlay ? 'FREE PLAY' : 'CHALLENGE'}
          </button>

          <div className="h-5 w-px bg-slate-800 hidden md:block" />

          {/* Active Element Swatch in Header */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeElementMeta.color }}
            />
            <span className="text-slate-200 font-semibold">{activeElementMeta.name}</span>
          </div>
        </div>

        {/* Center Live Telemetry Ribbon */}
        <div className="hidden lg:flex items-center gap-5 text-xs font-mono">
          {!isFreePlay && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase">CONTAINMENT:</span>
              <span className="font-bold text-white tabular-nums">{hudStats.integrity}%</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">PARTICLES:</span>
            <span className="font-bold text-[#ffae00] tabular-nums">{hudStats.particles}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">ENTROPY:</span>
            <span className="font-bold text-slate-200 tabular-nums">{hudStats.entropy.toFixed(2)} b</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">SCORE:</span>
            <span className="font-bold text-[#00d4ff] tabular-nums">{hudStats.score}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase">FPS:</span>
            <span className="font-bold text-slate-300 tabular-nums">{hudStats.fps}</span>
            <span className="text-[10px] text-slate-500">· {APP_VERSION}</span>
          </div>
        </div>

        {/* Right Utility Buttons & Settings Dropdown */}
        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            title="Undo Last Action [Ctrl+Z]"
            className="px-3 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            <span>Undo [Ctrl+Z]</span>
          </button>

          {/* Settings Dropdown for Resolution Presets */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSettingsDropdownOpen((prev) => !prev)}
              className="px-3 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#00d4ff]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings ▾</span>
            </button>

            {settingsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#12161f] border border-slate-700 shadow-2xl p-2 z-50 font-mono text-xs space-y-1">
                <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  Crucible Resolution Presets
                </div>
                {CANVAS_PRESETS.map((preset) => {
                  const isActive = currentPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-[#0B57D0] text-white font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span>{preset.name} ({preset.width}×{preset.height})</span>
                      {isActive && <span className="text-xs">✓</span>}
                    </button>
                  );
                })}

                <div className="pt-2 mt-2 border-t border-slate-800 space-y-1">
                  <div className="px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Simulation Storage
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSimulation}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer flex items-center justify-between"
                  >
                    <span>Save Simulation (.json)</span>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSimulation}
                    className="w-full text-left px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer flex items-center justify-between"
                  >
                    <span>Load Simulation (.json)</span>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#00d4ff]" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setWorkbenchTab('bioscience');
              setWorkbenchOpen(true);
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-600 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            Workbench ({basket.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkbenchTab('reporting');
              setWorkbenchOpen(true);
            }}
            className="px-3 py-1 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Reports
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkbenchTab('guide');
              setWorkbenchOpen(true);
            }}
            className="px-2.5 py-1 text-xs font-semibold text-amber-300 bg-slate-800/90 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            Guide
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE: ELEMENT PICKER + RESIZABLE CANVAS STAGE + 3D WIDGET
          ===================================================================== */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden p-3 gap-2">
        {/* Element Picker Bar */}
        <ElementDrawer
          currentType={currentType}
          onSelectElement={(type) => setCurrentType(type)}
          brushRadius={brushRadius}
          onBrushRadiusChange={setBrushRadius}
          isFreePlay={isFreePlay}
          onToggleFreePlay={() => setIsFreePlay((prev) => !prev)}
          onClearWorld={() => {
            pushUndoSnapshot(simStateRef.current);
            initWorld(simStateRef.current);
            hazardsRef.current = [];
          }}
          onDispenseBasket={handleInjectBasket}
          basketCount={basket.length}
          onSpawnAnomalies={spawnHazardWave}
          anomaliesCount={hudStats.anomaliesCount}
          show3DChamber={show3DChamber}
          onToggle3DChamber={() => setShow3DChamber((prev) => !prev)}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={handleToggleBookmark}
          isDrawerVisible={isElementDrawerVisible}
          onToggleVisibility={() => setIsElementDrawerVisible((prev) => !prev)}
        />

        {/* Resizable Canvas Stage (Preset-driven) with Drawing Suite & Modifiers */}
        <ResizableCanvasStage
          sandCanvasRef={sandCanvasRef}
          previewCanvasRef={previewCanvasRef}
          cursorRingRef={cursorRingRef}
          simWidth={simWidth}
          simHeight={simHeight}
          displayScale={displayScale}
          activeTool={activeTool}
          onSelectTool={(tool) => setActiveTool(tool)}
          brushRadius={brushRadius}
          onBrushRadiusChange={setBrushRadius}
          inspectedPixel={inspectedPixel}
          onCloseInspector={() => setInspectedPixel(null)}
          onUpdateInspectedLife={(delta) => {
            if (inspectedPixel) {
              const idx =
                inspectedPixel.y * simStateRef.current.width + inspectedPixel.x;
              const newLife = Math.max(0, simStateRef.current.life[idx] + delta);
              simStateRef.current.life[idx] = newLife;
              setInspectedPixel((prev) =>
                prev ? { ...prev, life: newLife } : null
              );
            }
          }}
          onClearInspectedPixel={() => {
            if (inspectedPixel) {
              setPixel(
                simStateRef.current,
                inspectedPixel.x,
                inspectedPixel.y,
                TYPE_EMPTY
              );
              setInspectedPixel(null);
            }
          }}
                     shakeTrauma={shakeTraumaRef.current}
           isThermalHeatmap={isThermalHeatmap}
           onToggleThermalHeatmap={() => {
             setIsThermalHeatmap((prev) => !prev);
             soundSynth.playSparkCue();
           }}
          isPaused={gameState === 'paused'}
          isFastForward={isFastForward}
          onToggleFastForward={() => {
            setIsFastForward((prev) => !prev);
            soundSynth.playSparkCue();
          }}
          onTogglePause={() => {
            setGameState((prev) => (prev === 'paused' ? 'playing' : 'paused'));
            soundSynth.playSparkCue();
          }}
          onResetSimulation={() => {
            initWorld(simStateRef.current);
            simStateRef.current.reactionScore = 0;
            simStateRef.current.frameCount = 0;
            simStateRef.current.containmentIntegrity = 100;
            setInspectedPixel(null);
            soundSynth.playSparkCue();
          }}
          onPointerDown={(e) => {
            if (gameState !== 'playing') return;
            pointerStateRef.current.isDrawing = true;
            pointerStateRef.current.isRightClick = e.button === 2;
            updateMousePos(e.clientX, e.clientY);
            const mx = pointerStateRef.current.mouseX;
            const my = pointerStateRef.current.mouseY;
            dragOriginRef.current = { x: mx, y: my };

            if (activeTool === 'bucket') {
              pushUndoSnapshot(simStateRef.current);
              const drawType = pointerStateRef.current.isRightClick
                ? TYPE_EMPTY
                : currentType;
              const filled = executeFloodFill(
                simStateRef.current,
                mx,
                my,
                drawType
              );
              if (filled > 0) soundSynth.playSparkCue();
            } else if (activeTool === 'eyedropper') {
              const sampled = getPixel(simStateRef.current, mx, my);
              if (sampled !== TYPE_EMPTY) {
                setCurrentType(sampled);
              }
              setActiveTool('brush');
              soundSynth.playSparkCue();
            } else if (activeTool === 'inspector') {
              const data = getPixelInspectorData(simStateRef.current, mx, my);
              setInspectedPixel(data);
            } else if (activeTool === 'brush') {
              pushUndoSnapshot(simStateRef.current);
            }
          }}
          onPointerMove={(e) => {
            updateMousePos(e.clientX, e.clientY);
            if (cursorRingRef.current && gameState === 'playing') {
              cursorRingRef.current.style.display = 'block';
            }

            // Real-time geometric shape and vector preview
            const pCanvas = previewCanvasRef.current;
            if (
              pCanvas &&
              dragOriginRef.current &&
              pointerStateRef.current.isDrawing &&
              (activeTool === 'line' ||
                activeTool === 'box' ||
                activeTool === 'circle' ||
                activeTool === 'wind_vector')
            ) {
              const pCtx = pCanvas.getContext('2d');
              if (pCtx) {
                pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
                const startX = dragOriginRef.current.x;
                const startY = dragOriginRef.current.y;
                const curX = pointerStateRef.current.mouseX;
                const curY = pointerStateRef.current.mouseY;

                pCtx.save();
                pCtx.strokeStyle = activeElementMeta.color || '#00d4ff';
                pCtx.fillStyle = activeElementMeta.color || '#00d4ff';
                pCtx.lineWidth = Math.max(1, brushRadius);
                pCtx.setLineDash([3, 3]);

                if (activeTool === 'line') {
                  pCtx.beginPath();
                  pCtx.moveTo(startX, startY);
                  pCtx.lineTo(curX, curY);
                  pCtx.stroke();
                } else if (activeTool === 'box') {
                  const bx = Math.min(startX, curX);
                  const by = Math.min(startY, curY);
                  const bw = Math.abs(curX - startX);
                  const bh = Math.abs(curY - startY);
                  pCtx.strokeRect(bx, by, bw, bh);
                } else if (activeTool === 'circle') {
                  const cr = Math.hypot(curX - startX, curY - startY);
                  pCtx.beginPath();
                  pCtx.arc(startX, startY, cr, 0, Math.PI * 2);
                  pCtx.stroke();
                } else if (activeTool === 'wind_vector') {
                  pCtx.strokeStyle = '#67e8f9';
                  pCtx.beginPath();
                  pCtx.moveTo(startX, startY);
                  pCtx.lineTo(curX, curY);
                  pCtx.stroke();
                }
                pCtx.restore();
              }
            }
          }}
          onPointerUp={() => {
            pointerStateRef.current.isDrawing = false;
            const pCanvas = previewCanvasRef.current;
            if (pCanvas) {
              const pCtx = pCanvas.getContext('2d');
              pCtx?.clearRect(0, 0, pCanvas.width, pCanvas.height);
            }

            if (dragOriginRef.current) {
              const startX = dragOriginRef.current.x;
              const startY = dragOriginRef.current.y;
              const endX = pointerStateRef.current.mouseX;
              const endY = pointerStateRef.current.mouseY;
              const drawType = pointerStateRef.current.isRightClick
                ? TYPE_EMPTY
                : currentType;

              if (activeTool === 'line') {
                pushUndoSnapshot(simStateRef.current);
                drawRasterLine(
                  simStateRef.current,
                  startX,
                  startY,
                  endX,
                  endY,
                  brushRadius,
                  drawType
                );
                soundSynth.playPaintTick(1.2);
              } else if (activeTool === 'box') {
                pushUndoSnapshot(simStateRef.current);
                drawRasterBox(
                  simStateRef.current,
                  startX,
                  startY,
                  endX,
                  endY,
                  true,
                  drawType
                );
                soundSynth.playPaintTick(1.0);
              } else if (activeTool === 'circle') {
                pushUndoSnapshot(simStateRef.current);
                const r = Math.hypot(endX - startX, endY - startY);
                drawRasterCircle(
                  simStateRef.current,
                  startX,
                  startY,
                  r,
                  true,
                  drawType
                );
                soundSynth.playPaintTick(1.1);
              } else if (activeTool === 'wind_vector') {
                applyAirForceVector(
                  simStateRef.current,
                  startX,
                  startY,
                  endX,
                  endY,
                  2.0
                );
                soundSynth.playSparkCue();
              }
              dragOriginRef.current = null;
            }
          }}
          onPointerLeave={() => {
            pointerStateRef.current.isDrawing = false;
            if (cursorRingRef.current) {
              cursorRingRef.current.style.display = 'none';
            }
            const pCanvas = previewCanvasRef.current;
            if (pCanvas) {
              const pCtx = pCanvas.getContext('2d');
              pCtx?.clearRect(0, 0, pCanvas.width, pCanvas.height);
            }
            dragOriginRef.current = null;
          }}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Persistent Bottom Bookmark Bar */}
        <BottomBookmarkBar
          bookmarkedIds={bookmarkedIds}
          currentType={currentType}
          onSelectElement={(type) => setCurrentType(type)}
          onToggleBookmark={handleToggleBookmark}
        />

        {/* Compact 3D Reactor Corner Widget with Orbital Expand Modal */}
        <Reactor3DCornerWidget
          visible={show3DChamber}
          onToggleVisible={() => setShow3DChamber((prev) => !prev)}
          exothermicIndex={hudStats.exothermic}
          activeParticles={hudStats.particles}
          containmentIntegrity={hudStats.integrity}
          simulationCanvasRef={sandCanvasRef}
        />
      </div>

      {/* =====================================================================
          PAUSED MODAL CARD
          ===================================================================== */}
      {gameState === 'paused' && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Simulation Paused"
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#12161f] border border-slate-700 shadow-2xl space-y-5 text-center">
            <div>
              <div className="text-xs font-mono text-[#ffae00]">
                CRUCIBLE PAUSED · {APP_VERSION}
              </div>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                Physics Simulation Suspended
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                You can still paint or erase elements on the canvas while physics is paused.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">PARTICLES</div>
                <div className="text-lg font-bold text-[#ffae00] tabular-nums">
                  {hudStats.particles}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">ENTROPY</div>
                <div className="text-lg font-bold text-white tabular-nums">
                  {hudStats.entropy.toFixed(2)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">SCORE</div>
                <div className="text-lg font-bold text-[#00d4ff] tabular-nums">
                  {hudStats.score}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={startPlaying}
                className="w-full py-2.5 text-xs font-bold text-slate-950 bg-[#ffae00] hover:bg-[#ff7b00] rounded-lg cursor-pointer"
              >
                Resume Simulation [P / Esc]
              </button>
              <button
                type="button"
                onClick={() => {
                  pushUndoSnapshot(simStateRef.current);
                  seedShowcaseArena(simStateRef.current);
                  hazardsRef.current = [];
                  startPlaying();
                }}
                className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
              >
                Restart Showcase Arena
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CHALLENGE GAME OVER MODAL (Only active in Challenge Mode)
          ===================================================================== */}
      {gameState === 'gameover' && !isFreePlay && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label={
            endRunSnapshot.victory
              ? 'Reactor Audit Complete'
              : 'Containment Breach'
          }
        >
          <div className="w-full max-w-md p-6 rounded-xl bg-[#12161f] border border-slate-700 shadow-2xl space-y-5 text-center">
            <div>
              <div className="text-xs font-mono text-[#00d4ff]">
                {endRunSnapshot.victory
                  ? 'REACTOR AUDIT COMPLETE'
                  : 'CONTAINMENT BREACH DETECTED'}
              </div>
              <h2 className="text-2xl font-bold text-white font-display mt-1">
                {endRunSnapshot.victory
                  ? 'Thermodynamic Equilibrium Verified'
                  : 'Chamber Integrity Depleted'}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">SCORE / BEST</div>
                <div className="text-base font-bold text-[#00d4ff] tabular-nums">
                  {endRunSnapshot.score} / {endRunSnapshot.bestScore}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">ENTROPY</div>
                <div className="text-base font-bold text-[#ffae00] tabular-nums">
                  {endRunSnapshot.entropy.toFixed(2)} b
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">INTEGRITY</div>
                <div className="text-base font-bold text-emerald-400 tabular-nums">
                  {endRunSnapshot.integrity}%
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-start="true"
                onClick={() => {
                  pushUndoSnapshot(simStateRef.current);
                  seedShowcaseArena(simStateRef.current);
                  hazardsRef.current = [];
                  startPlaying();
                }}
                className="w-full py-2.5 text-xs font-bold text-slate-950 bg-[#ffae00] hover:bg-[#ff7b00] rounded-lg cursor-pointer"
              >
                {endRunSnapshot.victory ? 'Start Next Reactor Run' : 'Try Again'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleGenerateReport(
                    `End-of-Run Audit (${endRunSnapshot.score} pts)`
                  );
                  setGameState('playing');
                  setWorkbenchTab('reporting');
                  setWorkbenchOpen(true);
                }}
                className="w-full py-2.5 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-700 rounded-lg cursor-pointer"
              >
                Log Custom Telemetry Report &amp; Inspect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          BIOSCIENCE REAGENT SYNTHESIS, CUSTOM REPORTING & BASKET WORKBENCH
          ===================================================================== */}
      <BioscienceReportingDrawer
        isOpen={workbenchOpen}
        activeTab={workbenchTab}
        onTabChange={setWorkbenchTab}
        onClose={() => setWorkbenchOpen(false)}
        basket={basket}
        onAddToBasket={handleAddToBasket}
        onRemoveFromBasket={handleRemoveFromBasket}
        onClearBasket={() => setBasket([])}
        onInjectBasket={handleInjectBasket}
        reports={reports}
        onGenerateReport={handleGenerateReport}
        liveCensus={liveCensus}
        liveEntropy={hudStats.entropy}
        liveExothermic={hudStats.exothermic}
        onSelectElementBrush={(elem) => setCurrentType(elem)}
      />
    </main>
  );
}
