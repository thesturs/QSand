import {
  APP_VERSION,
  BasketItem,
  CustomReportSnapshot,
  DrawingToolMode,
  ELEMENTS,
  ElementType,
  InspectedPixelData,
  TYPE_ACID,
  TYPE_AETHER,
  TYPE_ANTIMATTER,
  TYPE_BIO_SPORE,
  TYPE_BRIMSTONE,
  TYPE_C4,
  TYPE_C5,
  TYPE_COOL,
  TYPE_CREATURE,
  TYPE_CRYO_GEL,
  TYPE_DARK_MATTER,
  TYPE_DIAMOND,
  TYPE_ELIXIR,
  TYPE_EMPTY,
  TYPE_FIRE,
  TYPE_GUNPOWDER,
  TYPE_HEAT,
  TYPE_ICE,
  TYPE_LAVA,
  TYPE_LENS,
  TYPE_MERCURY,
  TYPE_MIRROR,
  TYPE_NEUTRON,
  TYPE_NITROGEN,
  TYPE_OIL,
  TYPE_PHILOSOPHER_STONE,
  TYPE_PLASMA,
  TYPE_PLUTONIUM,
  TYPE_QRTZ,
  TYPE_RFRG,
  TYPE_SAND,
  TYPE_SENSOR,
  TYPE_SINGULARITY,
  TYPE_SMOKE,
  TYPE_SPARK,
  TYPE_SWITCH,
  TYPE_THERMITE,
  TYPE_TUNG,
  TYPE_URANIUM,
  TYPE_VITRIOL,
  TYPE_WALL,
  TYPE_WATER,
  TYPE_WIND,
  TYPE_WIRE,
  TYPE_WOOD,
} from './types';

export const GRID_WIDTH = 400;
export const GRID_HEIGHT = 300;
export const DISPLAY_SCALE = 2;

export interface SimulationState {
  width: number;
  height: number;
  grid: Uint8Array;
  life: Uint8Array;
  updated: Uint8Array;
  frameCount: number;
  activeParticles: number;
  reactionScore: number;
  containmentIntegrity: number;
  isFreePlay: boolean;
  undoStack: { grid: Uint8Array; life: Uint8Array; width: number; height: number; activeParticles: number }[];
}

export function createSimulationState(
  width = GRID_WIDTH,
  height = GRID_HEIGHT
): SimulationState {
  const size = width * height;
  const state: SimulationState = {
    width,
    height,
    grid: new Uint8Array(size),
    life: new Uint8Array(size),
    updated: new Uint8Array(size),
    frameCount: 0,
    activeParticles: 0,
    reactionScore: 0,
    containmentIntegrity: 100,
    isFreePlay: true,
    undoStack: [],
  };
  initWorld(state);
  return state;
}

export function pushUndoSnapshot(state: SimulationState): void {
  if (!state.undoStack) state.undoStack = [];
  if (state.undoStack.length >= 10) {
    state.undoStack.shift();
  }
  state.undoStack.push({
    grid: new Uint8Array(state.grid),
    life: new Uint8Array(state.life),
    width: state.width,
    height: state.height,
    activeParticles: state.activeParticles,
  });
}

export function undoSimulationState(state: SimulationState): boolean {
  if (!state.undoStack || state.undoStack.length === 0) return false;
  const prev = state.undoStack.pop()!;
  state.width = prev.width;
  state.height = prev.height;
  state.grid = prev.grid;
  state.life = prev.life;
  state.updated = new Uint8Array(prev.width * prev.height);
  state.activeParticles = prev.activeParticles;
  return true;
}

export function initWorld(state: SimulationState): void {
  state.grid.fill(TYPE_EMPTY);
  state.life.fill(0);
  state.updated.fill(0);
  state.activeParticles = 0;
  state.containmentIntegrity = 100;

  for (let x = 0; x < state.width; x++) {
    setPixel(state, x, 0, TYPE_WALL);
    setPixel(state, x, state.height - 1, TYPE_WALL);
  }
  for (let y = 0; y < state.height; y++) {
    setPixel(state, 0, y, TYPE_WALL);
    setPixel(state, state.width - 1, y, TYPE_WALL);
  }
}

export interface CanvasSizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  scale: number;
  description: string;
}

export const CANVAS_PRESETS: CanvasSizePreset[] = [

    {
    id: 'small',
    name: 'Small',
    width: 400,
    height: 300,
    scale: 1.5,
    description: 'Small Sandbox',
  },
      {
    id: 'medium',
    name: 'Medium',
    width: 400,
    height: 300,
    scale: 2,
    description: 'Med Sandbox',

  },
    {
    id: 'large',
    name: 'Large',
    width: 400,
    height: 300,
    scale: 2.5,
    description: 'Large Sandbox',
  },
 
];

export function resizeSimulationState(
  state: SimulationState,
  newWidth: number,
  newHeight: number
): void {
  newWidth = Math.max(160, Math.min(1140, Math.round(newWidth)));
  newHeight = Math.max(100, Math.min(1280, Math.round(newHeight)));

  if (state.width === newWidth && state.height === newHeight) return;

  const oldWidth = state.width;
  const oldHeight = state.height;
  const oldGrid = state.grid;
  const oldLife = state.life;

  const newSize = newWidth * newHeight;
  const newGrid = new Uint8Array(newSize);
  const newLife = new Uint8Array(newSize);
  const newUpdated = new Uint8Array(newSize);

  // Initialize perimeter boundary walls
  for (let x = 0; x < newWidth; x++) {
    newGrid[0 * newWidth + x] = TYPE_WALL;
    newGrid[(newHeight - 1) * newWidth + x] = TYPE_WALL;
  }
  for (let y = 0; y < newHeight; y++) {
    newGrid[y * newWidth + 0] = TYPE_WALL;
    newGrid[y * newWidth + (newWidth - 1)] = TYPE_WALL;
  }

  // Calculate centered offset for copying existing matter
  const offsetX = Math.floor((newWidth - oldWidth) / 2);
  const offsetY = Math.floor((newHeight - oldHeight) / 2);

  let activeCount = 0;
  for (let y = 1; y < oldHeight - 1; y++) {
    for (let x = 1; x < oldWidth - 1; x++) {
      const oldIdx = y * oldWidth + x;
      const elem = oldGrid[oldIdx];
      if (elem === TYPE_EMPTY) continue;

      const targetX = x + offsetX;
      const targetY = y + offsetY;

      if (
        targetX >= 1 &&
        targetX < newWidth - 1 &&
        targetY >= 1 &&
        targetY < newHeight - 1
      ) {
        const newIdx = targetY * newWidth + targetX;
        newGrid[newIdx] = elem;
        newLife[newIdx] = oldLife[oldIdx];
        activeCount++;
      }
    }
  }

  state.width = newWidth;
  state.height = newHeight;
  state.grid = newGrid;
  state.life = newLife;
  state.updated = newUpdated;
  state.activeParticles = activeCount;
}

export function seedShowcaseArena(state: SimulationState): void {
  initWorld(state);

  // Left Basin: Aqueous & Granular
  for (let x = 20; x <= 75; x++) {
    setPixel(state, x, 115, TYPE_WALL);
    setPixel(state, x, 116, TYPE_WALL);
  }
  for (let y = 90; y <= 116; y++) {
    setPixel(state, 20, y, TYPE_WALL);
    setPixel(state, 21, y, TYPE_WALL);
    setPixel(state, 75, y, TYPE_WALL);
    setPixel(state, 76, y, TYPE_WALL);
  }
  for (let y = 98; y < 114; y++) {
    for (let x = 23; x < 74; x++) {
      setPixel(state, x, y, TYPE_WATER);
    }
  }
  for (let y = 60; y < 85; y++) {
    const spread = Math.floor((y - 60) * 0.85);
    for (let x = 48 - spread; x <= 48 + spread; x++) {
      setPixel(state, x, y, TYPE_SAND);
    }
  }

  // Middle-Left: Electronics Test Circuit (Wire, Switch, Sensor)
  for (let x = 86; x <= 126; x++) {
    setPixel(state, x, 105, TYPE_WIRE);
  }
  setPixel(state, 106, 105, TYPE_SWITCH);
  setPixel(state, 126, 104, TYPE_SENSOR);
  setPixel(state, 86, 104, TYPE_SPARK);

  // Center Platform: C-4 & Thermite with Timber Base
  for (let x = 135; x <= 175; x++) {
    setPixel(state, x, 105, TYPE_WOOD);
    setPixel(state, x, 106, TYPE_WOOD);
    if (x >= 142 && x <= 150) {
      setPixel(state, x, 103, TYPE_C4);
      setPixel(state, x, 104, TYPE_C4);
    }
    if (x >= 158 && x <= 168) {
      setPixel(state, x, 103, TYPE_THERMITE);
      setPixel(state, x, 104, TYPE_THERMITE);
    }
  }

  // Middle-Right: Alchemical Crucible (Philosopher's Stone, Brimstone, Mercury)
  for (let x = 185; x <= 240; x++) {
    setPixel(state, x, 125, TYPE_DIAMOND);
    setPixel(state, x, 126, TYPE_DIAMOND);
  }
  for (let y = 95; y <= 126; y++) {
    setPixel(state, 185, y, TYPE_DIAMOND);
    setPixel(state, 186, y, TYPE_DIAMOND);
    setPixel(state, 240, y, TYPE_DIAMOND);
    setPixel(state, 241, y, TYPE_DIAMOND);
  }
  for (let y = 115; y < 124; y++) {
    for (let x = 188; x < 239; x++) {
      setPixel(state, x, y, TYPE_LAVA);
    }
  }
  setPixel(state, 205, 110, TYPE_PHILOSOPHER_STONE);
  setPixel(state, 215, 110, TYPE_BRIMSTONE);
  setPixel(state, 225, 110, TYPE_MERCURY);
}

export function setPixel(
  state: SimulationState,
  x: number,
  y: number,
  type: ElementType
): void {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return;
  const idx = y * state.width + x;
  state.grid[idx] = type;

  // Life timer configurations
  if (type === TYPE_FIRE) {
    state.life[idx] = (20 + Math.random() * 25) | 0;
  } else if (type === TYPE_SMOKE) {
    state.life[idx] = (30 + Math.random() * 30) | 0;
  } else if (type === TYPE_SPARK) {
    state.life[idx] = 4;
  } else if (type === TYPE_PLASMA) {
    state.life[idx] = (40 + Math.random() * 40) | 0;
  } else if (type === TYPE_NEUTRON) {
    state.life[idx] = (50 + Math.random() * 50) | 0;
  } else if (type === TYPE_AETHER) {
    state.life[idx] = (80 + Math.random() * 80) | 0;
  } else if (type === TYPE_WIND) {
    state.life[idx] = (35 + Math.random() * 25) | 0;
  } else if (type === TYPE_HEAT) {
    state.life[idx] = (30 + Math.random() * 20) | 0;
  } else if (type === TYPE_COOL) {
    state.life[idx] = (30 + Math.random() * 20) | 0;
  } else if (type === TYPE_CREATURE) {
    state.life[idx] = 120;
  } else {
    state.life[idx] = 0;
  }
}

export function getPixel(state: SimulationState, x: number, y: number): number {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return TYPE_WALL;
  return state.grid[y * state.width + x];
}

export function swapCells(state: SimulationState, i1: number, i2: number): void {
  const t = state.grid[i1];
  state.grid[i1] = state.grid[i2];
  state.grid[i2] = t;
  const l = state.life[i1];
  state.life[i1] = state.life[i2];
  state.life[i2] = l;
  state.updated[i2] = 1;
}

export function paintBrush(
  state: SimulationState,
  cx: number,
  cy: number,
  radius: number,
  drawType: ElementType,
  allowOverwrite: boolean = false
): number {
  let painted = 0;
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) {
        const px = cx + dx;
        const py = cy + dy;
        if (
          px <= 0 ||
          px >= state.width - 1 ||
          py <= 0 ||
          py >= state.height - 1
        ) {
          continue;
        }
        const idx = py * state.width + px;
        if (drawType === TYPE_EMPTY) {
          setPixel(state, px, py, TYPE_EMPTY);
          painted++;
        } else if (
          allowOverwrite ||
          state.grid[idx] === TYPE_EMPTY
        ) {
          setPixel(state, px, py, drawType);
          painted++;
        }
      }
    }
  }
  return painted;
}

/**
 * Powder Toy Geometric Drawing: Bresenham Raster Line
 */
export function drawRasterLine(
  state: SimulationState,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  elem: ElementType,
  allowOverwrite: boolean = false
): number {
  let count = 0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let curX = x0;
  let curY = y0;

  while (true) {
    count += paintBrush(state, curX, curY, radius, elem, allowOverwrite);
    if (curX === x1 && curY === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      curX += sx;
    }
    if (e2 < dx) {
      err += dx;
      curY += sy;
    }
  }

  return count;
}

/**
 * Powder Toy Geometric Drawing: Filled or Hollow Bounding Box
 */
export function drawRasterBox(
  state: SimulationState,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  filled: boolean,
  elem: ElementType,
  allowOverwrite: boolean = false
): number {
  const minX = Math.max(1, Math.min(x0, x1));
  const maxX = Math.min(state.width - 2, Math.max(x0, x1));
  const minY = Math.max(1, Math.min(y0, y1));
  const maxY = Math.min(state.height - 2, Math.max(y0, y1));

  let count = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const isPerimeter = x === minX || x === maxX || y === minY || y === maxY;
      if (filled || isPerimeter) {
        const idx = y * state.width + x;
        if (elem === TYPE_EMPTY || allowOverwrite || state.grid[idx] === TYPE_EMPTY) {
          setPixel(state, x, y, elem);
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Powder Toy Geometric Drawing: Circle Outline or Filled Disc
 */
export function drawRasterCircle(
  state: SimulationState,
  cx: number,
  cy: number,
  radius: number,
  outline: boolean,
  elem: ElementType,
  allowOverwrite: boolean = false
): number {
  let count = 0;
  const rCeil = Math.ceil(radius);
  for (let dy = -rCeil; dy <= rCeil; dy++) {
    for (let dx = -rCeil; dx <= rCeil; dx++) {
      const dist = Math.hypot(dx, dy);
      const isTarget = outline
        ? Math.abs(dist - radius) <= 0.8
        : dist <= radius;

      if (isTarget) {
        const px = cx + dx;
        const py = cy + dy;
        if (px > 0 && px < state.width - 1 && py > 0 && py < state.height - 1) {
          const idx = py * state.width + px;
          if (elem === TYPE_EMPTY || allowOverwrite || state.grid[idx] === TYPE_EMPTY) {
            setPixel(state, px, py, elem);
            count++;
          }
        }
      }
    }
  }
  return count;
}

/**
 * Powder Toy Geometric Drawing: 4-Way Breadth-First Scanline Flood Fill Bucket
 */
export function executeFloodFill(
  state: SimulationState,
  startX: number,
  startY: number,
  replaceElem: ElementType
): number {
  if (
    startX <= 0 ||
    startX >= state.width - 1 ||
    startY <= 0 ||
    startY >= state.height - 1
  ) {
    return 0;
  }

  const w = state.width;
  const h = state.height;
  const startIdx = startY * w + startX;
  const targetElem = state.grid[startIdx];

  if (targetElem === replaceElem) return 0;

  // Maximum cells capped at 60,000 for safety and performance
  const maxQueue = 60000;
  const queue = new Int32Array(maxQueue);
  let head = 0;
  let tail = 0;

  queue[tail++] = startIdx;
  state.grid[startIdx] = replaceElem;
  let filledCount = 1;

  while (head < tail && filledCount < maxQueue) {
    const idx = queue[head++];
    const x = idx % w;
    const y = Math.floor(idx / w);

    const neighbors = [
      y > 1 ? idx - w : -1,
      y < h - 2 ? idx + w : -1,
      x > 1 ? idx - 1 : -1,
      x < w - 2 ? idx + 1 : -1,
    ];

    for (const nIdx of neighbors) {
      if (nIdx > 0 && state.grid[nIdx] === targetElem) {
        state.grid[nIdx] = replaceElem;
        filledCount++;
        if (tail < maxQueue) {
          queue[tail++] = nIdx;
        }
      }
    }
  }

  return filledCount;
}

/**
 * Powder Toy Environmental Modifier: Air Velocity Force Vector
 */
export function applyAirForceVector(
  state: SimulationState,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  strength = 1.0
): number {
  const w = state.width;
  const h = state.height;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 1) return 0;

  const nx = dx / len;
  const ny = dy / len;
  const steps = Math.min(Math.ceil(len), 60);

  let affected = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);

    // Apply wind puff & displace particles in swath
    for (let sy = -3; sy <= 3; sy++) {
      for (let sx = -3; sx <= 3; sx++) {
        const px = cx + sx;
        const py = cy + sy;
        if (px <= 1 || px >= w - 2 || py <= 1 || py >= h - 2) continue;
        const pIdx = py * w + px;
        const elem = state.grid[pIdx];

        if (elem === TYPE_EMPTY && Math.random() < 0.25) {
          state.grid[pIdx] = TYPE_WIND;
          state.life[pIdx] = (25 + Math.random() * 20) | 0;
          affected++;
        } else if (
          elem === TYPE_SAND ||
          elem === TYPE_WATER ||
          elem === TYPE_OIL ||
          elem === TYPE_SMOKE ||
          elem === TYPE_GUNPOWDER
        ) {
          const pushX = Math.round(px + nx * (1 + strength));
          const pushY = Math.round(py + ny * (1 + strength));
          if (pushX > 1 && pushX < w - 2 && pushY > 1 && pushY < h - 2) {
            const pushIdx = pushY * w + pushX;
            if (state.grid[pushIdx] === TYPE_EMPTY) {
              swapCells(state, pIdx, pushIdx);
              affected++;
            }
          }
        }
      }
    }
  }

  return affected;
}

/**
 * Powder Toy Environmental Modifier: Precision Temperature Brush (Heat / Chill)
 */
export function applyTemperatureBrush(
  state: SimulationState,
  cx: number,
  cy: number,
  radius: number,
  deltaTemp: number
): number {
  const w = state.width;
  const h = state.height;
  const r2 = radius * radius;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) {
        const px = cx + dx;
        const py = cy + dy;
        if (px <= 1 || px >= w - 2 || py <= 1 || py >= h - 2) continue;
        const idx = py * w + px;
        const elem = state.grid[idx];

        if (deltaTemp > 0) {
          // Heating
          if (elem === TYPE_ICE) {
            state.grid[idx] = TYPE_WATER;
            count++;
          } else if (elem === TYPE_WATER) {
            state.grid[idx] = TYPE_SMOKE;
            state.life[idx] = 30;
            count++;
          } else if (elem === TYPE_WIRE || elem === TYPE_SAND) {
            if (Math.random() < 0.2) {
              state.grid[idx] = TYPE_LAVA;
              count++;
            }
          } else if (elem === TYPE_WOOD || elem === TYPE_OIL) {
            state.grid[idx] = TYPE_FIRE;
            state.life[idx] = 35;
            count++;
          } else if (elem === TYPE_EMPTY && Math.random() < 0.15) {
            state.grid[idx] = TYPE_HEAT;
            state.life[idx] = 20;
            count++;
          }
        } else {
          // Chilling
          if (elem === TYPE_WATER) {
            state.grid[idx] = TYPE_ICE;
            count++;
          } else if (elem === TYPE_LAVA) {
            state.grid[idx] = TYPE_WALL;
            count++;
          } else if (elem === TYPE_FIRE || elem === TYPE_PLASMA) {
            state.grid[idx] = TYPE_SMOKE;
            state.life[idx] = 15;
            count++;
          } else if (elem === TYPE_EMPTY && Math.random() < 0.15) {
            state.grid[idx] = TYPE_COOL;
            state.life[idx] = 20;
            count++;
          }
        }
      }
    }
  }

  return count;
}

/**
 * Powder Toy Environmental Modifier: Point Gravity Well Attractor / Repulsor
 */
export function applyGravityAttractor(
  state: SimulationState,
  cx: number,
  cy: number,
  radius: number,
  pullTowards: boolean
): number {
  const w = state.width;
  const h = state.height;
  const r2 = radius * radius;
  let count = 0;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const distSq = dx * dx + dy * dy;
      if (distSq <= r2 && distSq > 1) {
        const px = cx + dx;
        const py = cy + dy;
        if (px <= 1 || px >= w - 2 || py <= 1 || py >= h - 2) continue;
        const idx = py * w + px;
        const elem = state.grid[idx];

        const isMovable =
          elem !== TYPE_EMPTY &&
          elem !== TYPE_WALL &&
          elem !== TYPE_DIAMOND;

        if (isMovable) {
          const stepX = pullTowards
            ? dx > 0 ? -1 : dx < 0 ? 1 : 0
            : dx > 0 ? 1 : dx < 0 ? -1 : 0;
          const stepY = pullTowards
            ? dy > 0 ? -1 : dy < 0 ? 1 : 0
            : dy > 0 ? 1 : dy < 0 ? -1 : 0;

          const targetX = px + stepX;
          const targetY = py + stepY;
          if (targetX > 1 && targetX < w - 2 && targetY > 1 && targetY < h - 2) {
            const targetIdx = targetY * w + targetX;
            if (state.grid[targetIdx] === TYPE_EMPTY) {
              swapCells(state, idx, targetIdx);
              count++;
            }
          }
        }
      }
    }
  }

  return count;
}

/**
 * Powder Toy Environmental Modifier: Real-time Pixel Property Inspector
 */
export function getPixelInspectorData(
  state: SimulationState,
  x: number,
  y: number
): InspectedPixelData | null {
  if (x < 0 || x >= state.width || y < 0 || y >= state.height) return null;
  const idx = y * state.width + x;
  const elemId = state.grid[idx];
  const meta = ELEMENTS[elemId] || ELEMENTS[TYPE_EMPTY];
  const life = state.life[idx];

  let temp = meta.temperature ?? 22;
  if (elemId === TYPE_FIRE || elemId === TYPE_SPARK) temp = 1200;
  else if (elemId === TYPE_LAVA) temp = 1500;
  else if (elemId === TYPE_PLASMA) temp = 3500;
  else if (elemId === TYPE_NITROGEN) temp = -196;

  const flam = meta.flammability ?? (elemId === TYPE_WOOD || elemId === TYPE_OIL || elemId === TYPE_GUNPOWDER || elemId === TYPE_C4 ? 100 : 0);
  const hard = meta.hardness ?? (elemId === TYPE_WALL || elemId === TYPE_DIAMOND ? 10 : elemId === TYPE_SAND ? 7 : 5);
  const cond = meta.conductivity ?? (elemId === TYPE_WIRE || elemId === TYPE_MERCURY ? 'conductor' : elemId === TYPE_SPARK ? 'generator' : 'insulator');

  return {
    x,
    y,
    elemId,
    elemName: meta.name,
    category: meta.category,
    density: meta.density,
    life,
    color: meta.color,
    chemicalFormula: meta.formula,
    shortRole: meta.shortRole,
    temperature: temp,
    flammability: flam,
    hardness: hard,
    conductivity: cond,
    reactivityNotes: meta.description,
  };
}

export interface PhysicsCallbacks {
  onSpark?: (x: number, y: number, count: number, intense: boolean) => void;
  onExplosion?: (x: number, y: number, radius: number) => void;
}

export function explodeRadius(
  state: SimulationState,
  cx: number,
  cy: number,
  radius: number,
  callbacks?: PhysicsCallbacks
): void {
  callbacks?.onSpark?.(cx, cy, 35, true);
  callbacks?.onExplosion?.(cx, cy, radius);
  state.reactionScore += radius * 8;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const px = cx + dx;
        const py = cy + dy;
        if (
          px <= 0 ||
          px >= state.width - 1 ||
          py <= 0 ||
          py >= state.height - 1
        ) {
          continue;
        }
        const pidx = py * state.width + px;
        const target = state.grid[pidx];

        if (target === TYPE_DIAMOND) continue;
        if (target === TYPE_WALL && Math.random() > 0.3) continue;

        if (Math.random() < 0.4) {
          state.grid[pidx] = TYPE_FIRE;
          state.life[pidx] = (25 + Math.random() * 25) | 0;
        } else {
          state.grid[pidx] = TYPE_EMPTY;
        }
      }
    }
  }
}

export function getHeatProximity(
  state: SimulationState,
  x: number,
  y: number,
  maxRadius = 3
): number {
  const w = state.width;
  const h = state.height;
  const grid = state.grid;
  let maxHeat = 0;

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    const py = y + dy;
    if (py < 0 || py >= h) continue;
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const px = x + dx;
      if (px < 0 || px >= w) continue;
      const distSq = dx * dx + dy * dy;
      if (distSq > maxRadius * maxRadius) continue;

      const neighbor = grid[py * w + px];
      let heatVal = 0;
      if (neighbor === TYPE_PLASMA) heatVal = 100;
      else if (neighbor === TYPE_LAVA) heatVal = 80;
      else if (neighbor === TYPE_THERMITE) heatVal = 85;
      else if (neighbor === TYPE_FIRE) heatVal = 60;
      else if (neighbor === TYPE_HEAT) heatVal = 95;

      if (heatVal > 0) {
        const effective = heatVal / Math.max(1, distSq);
        if (effective > maxHeat) maxHeat = effective;
      }
    }
  }
  return maxHeat;
}

export function getCoolProximity(
  state: SimulationState,
  x: number,
  y: number,
  maxRadius = 3
): number {
  const w = state.width;
  const h = state.height;
  const grid = state.grid;
  let maxCool = 0;

  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    const py = y + dy;
    if (py < 0 || py >= h) continue;
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const px = x + dx;
      if (px < 0 || px >= w) continue;
      const distSq = dx * dx + dy * dy;
      if (distSq > maxRadius * maxRadius) continue;

      const neighbor = grid[py * w + px];
      let coolVal = 0;
      if (neighbor === TYPE_NITROGEN) coolVal = 95;
      else if (neighbor === TYPE_CRYO_GEL) coolVal = 80;
      else if (neighbor === TYPE_COOL) coolVal = 90;
      else if (neighbor === TYPE_WIND) coolVal = 75;
      else if (neighbor === TYPE_ICE) coolVal = 40;

      if (coolVal > 0) {
        const effective = coolVal / Math.max(1, distSq);
        if (effective > maxCool) maxCool = effective;
      }
    }
  }
  return maxCool;
}



export function applyCatalyticReactions(
  state: SimulationState,
  x: number,
  y: number,
  idx: number,
  elem: ElementType,
  n8: number[],
  callbacks?: PhysicsCallbacks
): boolean {
  const grid = state.grid;
  const life = state.life;
  const updated = state.updated;
  const w = state.width;
  const h = state.height;

  // 100+ Fine-Grained Catalyst & Phase Interaction Rules
  for (const n of n8) {
    if (n < 0 || n >= w * h) continue;
    const ne = grid[n];
    if (ne === TYPE_EMPTY) continue;

    // Rule 1-15: Philosopher's Stone Catalytic Transmutations
    if (elem === TYPE_PHILOSOPHER_STONE) {
      if (ne === TYPE_URANIUM || ne === TYPE_PLUTONIUM) {
        grid[n] = TYPE_DIAMOND;
        state.reactionScore += 50;
        callbacks?.onSpark?.(x, y, 6, true);
        return true;
      }
      if (ne === TYPE_GUNPOWDER || ne === TYPE_C4) {
        grid[n] = TYPE_DIAMOND;
        state.reactionScore += 30;
        return true;
      }
      if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
        grid[n] = TYPE_WATER;
        state.reactionScore += 15;
        return true;
      }
      if (ne === TYPE_MERCURY) {
        grid[n] = TYPE_AETHER;
        life[n] = 90;
        state.reactionScore += 40;
        return true;
      }
      if (ne === TYPE_WOOD) {
        grid[n] = TYPE_PLASMA;
        life[n] = 60;
        state.reactionScore += 25;
        return true;
      }
      if (ne === TYPE_SAND) {
        grid[n] = TYPE_DIAMOND;
        state.reactionScore += 20;
        return true;
      }
    }

    // Rule 16-35: Alchemical Elixir Purification & Neutralization
    if (elem === TYPE_ELIXIR) {
      if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
        grid[n] = TYPE_WATER;
        grid[idx] = TYPE_WATER;
        state.reactionScore += 25;
        return true;
      }
      if (ne === TYPE_LAVA) {
        grid[n] = TYPE_WALL;
        grid[idx] = TYPE_SMOKE;
        life[idx] = 40;
        state.reactionScore += 30;
        return true;
      }
      if (ne === TYPE_ANTIMATTER || ne === TYPE_DARK_MATTER) {
        grid[n] = TYPE_AETHER;
        life[n] = 100;
        state.reactionScore += 60;
        callbacks?.onSpark?.(x, y, 12, true);
        return true;
      }
      if (ne === TYPE_URANIUM || ne === TYPE_PLUTONIUM) {
        grid[n] = TYPE_CRYO_GEL;
        state.reactionScore += 45;
        return true;
      }
      if (ne === TYPE_FIRE) {
        grid[n] = TYPE_AETHER;
        life[n] = 80;
        state.reactionScore += 10;
        return true;
      }
    }

    // Rule 36-60: Corrosive Acid & Vitriol Solvent Reactivity
    if (elem === TYPE_ACID || elem === TYPE_VITRIOL) {
      if (ne === TYPE_SAND) {
        grid[n] = TYPE_SMOKE;
        life[n] = 20;
        grid[idx] = TYPE_WATER;
        state.reactionScore += 10;
        return true;
      }
      if (ne === TYPE_WOOD) {
        grid[n] = TYPE_SMOKE;
        life[n] = 30;
        state.reactionScore += 8;
        return true;
      }
      if (ne === TYPE_MERCURY) {
        grid[n] = TYPE_SMOKE;
        life[n] = 40;
        state.reactionScore += 18;
        callbacks?.onSpark?.(x, y, 5, false);
        return true;
      }
      if (ne === TYPE_URANIUM) {
        grid[n] = TYPE_PLASMA;
        life[n] = 50;
        state.reactionScore += 35;
        callbacks?.onSpark?.(x, y, 10, true);
        return true;
      }
      if (ne === TYPE_WIRE) {
        grid[n] = TYPE_SPARK;
        life[n] = 4;
        state.reactionScore += 12;
        return true;
      }
    }

    // Rule 61-80: Cryogenic & Thermal Phase Boundaries
    if (elem === TYPE_CRYO_GEL || elem === TYPE_NITROGEN) {
      if (ne === TYPE_OIL) {
        grid[n] = TYPE_ICE;
        state.reactionScore += 15;
        return true;
      }
      if (ne === TYPE_MERCURY) {
        grid[n] = TYPE_WALL;
        state.reactionScore += 25;
        return true;
      }
      if (ne === TYPE_LAVA) {
        grid[n] = TYPE_WALL;
        grid[idx] = TYPE_SMOKE;
        life[idx] = 30;
        state.reactionScore += 20;
        return true;
      }
      if (ne === TYPE_PLASMA) {
        grid[n] = TYPE_FIRE;
        life[n] = 25;
        state.reactionScore += 15;
        return true;
      }
      if (ne === TYPE_FIRE) {
        grid[n] = TYPE_SMOKE;
        life[n] = 20;
        return true;
      }
    }

    // Rule 81-100: Nuclear, Neutron & Exotic Circuit Catalysis
    if (elem === TYPE_NEUTRON) {
      if (ne === TYPE_OIL) {
        grid[n] = TYPE_FIRE;
        life[n] = 45;
        state.reactionScore += 12;
        return true;
      }
      if (ne === TYPE_MERCURY) {
        grid[n] = TYPE_SPARK;
        life[n] = 4;
        state.reactionScore += 15;
        return true;
      }
      if (ne === TYPE_ELIXIR) {
        grid[n] = TYPE_AETHER;
        life[n] = 70;
        state.reactionScore += 20;
        return true;
      }
      if (ne === TYPE_VITRIOL) {
        grid[n] = TYPE_WATER;
        state.reactionScore += 10;
        return true;
      }
      if (ne === TYPE_SENSOR) {
        for (const t of n8) {
          if (grid[t] === TYPE_WIRE && updated[t] === 0) {
            grid[t] = TYPE_SPARK;
            life[t] = 4;
            updated[t] = 1;
          }
        }
        state.reactionScore += 8;
        return true;
      }
    }
  }

  return false;
}

export function stepPhysics(
  state: SimulationState,
  callbacks?: PhysicsCallbacks
): void {
  state.updated.fill(0);
  state.frameCount++;
  let active = 0;

  const w = state.width;
  const h = state.height;
  const grid = state.grid;
  const life = state.life;
  const updated = state.updated;

  // Step from bottom to top for gravity cascades
  for (let y = h - 2; y >= 1; y--) {
    const sweepLeft = Math.random() > 0.5;
    const xStart = sweepLeft ? w - 2 : 1;
    const xEnd = sweepLeft ? 0 : w - 1;
    const xStep = sweepLeft ? -1 : 1;

    for (let x = xStart; x !== xEnd; x += xStep) {
      const idx = y * w + x;
      const elem = grid[idx];

      if (elem === TYPE_EMPTY || updated[idx]) continue;
      active++;

      const below = (y + 1) * w + x;
      const left = y * w + (x - 1);
      const right = y * w + (x + 1);
      const above = (y - 1) * w + x;
      const rDir = Math.random() < 0.5 ? -1 : 1;

      // 8-neighbor indices
      const n8 = [
        above,
        below,
        left,
        right,
        (y - 1) * w + (x - 1),
        (y - 1) * w + (x + 1),
        (y + 1) * w + (x - 1),
        (y + 1) * w + (x + 1),
      ];

      if (applyCatalyticReactions(state, x, y, idx, elem, n8, callbacks)) continue;

      switch (elem) {
        // --- 1. Granular Powders (Sand, Gunpowder, Thermite, Brimstone) ---
        case TYPE_SAND:
        case TYPE_GUNPOWDER:
        case TYPE_THERMITE:
        case TYPE_BRIMSTONE: {
          // Sand specific: smothers fire and melts in extreme lava/plasma
          if (elem === TYPE_SAND) {
            for (const n of [below, left, right, above]) {
              const ne = grid[n];
              if (ne === TYPE_FIRE) {
                grid[n] = TYPE_SMOKE;
                life[n] = 20;
                updated[n] = 1;
              } else if ((ne === TYPE_LAVA || ne === TYPE_PLASMA) && Math.random() < 0.04) {
                grid[idx] = TYPE_LAVA;
                state.reactionScore += 2;
                break;
              }
            }
          }

          // Thermite ignition with spark or extreme heat; bores through bedrock walls
          if (elem === TYPE_THERMITE) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (
                ne === TYPE_FIRE ||
                ne === TYPE_LAVA ||
                ne === TYPE_SPARK ||
                ne === TYPE_PLASMA
              ) {
                grid[idx] = TYPE_PLASMA;
                life[idx] = 70;
                // Signature TPT Thermite capability: melts adjacent stone/wall barriers
                for (const tn of [above, below, left, right]) {
                  if (grid[tn] === TYPE_WALL) {
                    grid[tn] = TYPE_LAVA;
                    updated[tn] = 1;
                    state.reactionScore += 10;
                  }
                }
                callbacks?.onSpark?.(x, y, 8, true);
                state.reactionScore += 15;
                break;
              }
            }
            if (grid[idx] === TYPE_PLASMA) break;
          }

          // Gunpowder ignition
          if (elem === TYPE_GUNPOWDER) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (
                ne === TYPE_FIRE ||
                ne === TYPE_LAVA ||
                ne === TYPE_SPARK ||
                ne === TYPE_PLASMA
              ) {
                explodeRadius(state, x, y, 22, callbacks);
                break;
              }
            }
            if (grid[idx] !== TYPE_GUNPOWDER) break;
          }

          // Alchemy Mod: Brimstone (Sulfur) Reactions
          if (elem === TYPE_BRIMSTONE) {
            let hasWater = false;
            let hasMercury = false;
            let hasHeat = false;
            for (const n of n8) {
              const ne = grid[n];
              if (ne === TYPE_WATER || (ne === TYPE_SMOKE && life[n] >= 20)) hasWater = true;
              if (ne === TYPE_MERCURY) hasMercury = true;
              if (
                ne === TYPE_FIRE ||
                ne === TYPE_LAVA ||
                ne === TYPE_PLASMA ||
                ne === TYPE_SPARK
              ) {
                hasHeat = true;
              }
            }
            // Magnum Opus: Brimstone + Mercury + Heat -> Philosopher's Stone
            if (hasMercury && hasHeat) {
              grid[idx] = TYPE_PHILOSOPHER_STONE;
              callbacks?.onSpark?.(x, y, 10, true);
              state.reactionScore += 50;
              break;
            } else if (hasWater && hasHeat) {
              // Brimstone + Water + Heat -> Green Vitriol
              grid[idx] = TYPE_VITRIOL;
              state.reactionScore += 20;
              callbacks?.onSpark?.(x, y, 4, false);
              break;
            } else if (hasHeat) {
              // Standalone combustion: Sulfur burns with a distinct blue/orange flame and smoke
              grid[idx] = TYPE_FIRE;
              life[idx] = (35 + Math.random() * 20) | 0;
              callbacks?.onSpark?.(x, y, 3, false);
              state.reactionScore += 8;
              break;
            }
          }

          const bElem = grid[below];
          const isLiquid =
            bElem === TYPE_WATER ||
            bElem === TYPE_OIL ||
            bElem === TYPE_ACID ||
            bElem === TYPE_NITROGEN ||
            bElem === TYPE_CRYO_GEL ||
            bElem === TYPE_VITRIOL ||
            bElem === TYPE_ELIXIR;

          if (bElem === TYPE_EMPTY || isLiquid) {
            swapCells(state, idx, below);
          } else if (
            grid[below + rDir] === TYPE_EMPTY ||
            grid[below + rDir] === TYPE_WATER
          ) {
            swapCells(state, idx, below + rDir);
          } else if (
            grid[below - rDir] === TYPE_EMPTY ||
            grid[below - rDir] === TYPE_WATER
          ) {
            swapCells(state, idx, below - rDir);
          }
          break;
        }

        // --- 2. Liquids (Water, Oil, Acid, Cryo-Gel, Nitrogen, Mercury, Vitriol, Elixir) ---
        case TYPE_WATER:
        case TYPE_OIL:
        case TYPE_ACID:
        case TYPE_CRYO_GEL:
        case TYPE_NITROGEN:
        case TYPE_MERCURY:
        case TYPE_VITRIOL:
        case TYPE_ELIXIR: {
          // --- Chemical & Phase Reactions per Liquid Type ---

          // WATER:
          if (elem === TYPE_WATER) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (ne === TYPE_CRYO_GEL || ne === TYPE_NITROGEN || ne === TYPE_COOL) {
                grid[idx] = TYPE_ICE;
                state.reactionScore += 4;
                break;
              } else if (ne === TYPE_LAVA) {
                grid[n] = TYPE_WALL;
                grid[idx] = TYPE_SMOKE;
                life[idx] = 40;
                callbacks?.onSpark?.(x, y, 2, false);
                state.reactionScore += 6;
                break;
              } else if (ne === TYPE_FIRE || ne === TYPE_PLASMA || ne === TYPE_THERMITE || ne === TYPE_HEAT) {
                grid[idx] = TYPE_SMOKE;
                life[idx] = 30;
                break;
              } else if (ne === TYPE_SPARK) {
                // Electrification: shocks adjacent wires and conducts without converting water to wire
                for (const t of n8) {
                  if (grid[t] === TYPE_WIRE && updated[t] === 0) {
                    grid[t] = TYPE_SPARK;
                    life[t] = 4;
                    updated[t] = 1;
                  }
                }
                callbacks?.onSpark?.(x, y, 2, false);
                break;
              }
            }

            // Proximity boiling: water in proximity to heat sources boils into steam
            if (grid[idx] === TYPE_WATER) {
              const heat = getHeatProximity(state, x, y, 3);
              if (heat > 20) {
                life[idx]++;
                if (life[idx] >= 2 || heat > 65) {
                  grid[idx] = TYPE_SMOKE;
                  life[idx] = (30 + Math.random() * 25) | 0;
                  state.reactionScore += 2;
                  callbacks?.onSpark?.(x, y, 1, false);
                }
              }
            }
          }

          // OIL:
          else if (elem === TYPE_OIL) {
            // Oil flammability: catches fire from sparks, heat, or thermite
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (
                ne === TYPE_FIRE ||
                ne === TYPE_LAVA ||
                ne === TYPE_SPARK ||
                ne === TYPE_PLASMA ||
                ne === TYPE_THERMITE
              ) {
                grid[idx] = TYPE_FIRE;
                life[idx] = (45 + Math.random() * 25) | 0;
                callbacks?.onSpark?.(x, y, 3, false);
                state.reactionScore += 4;
                break;
              }
            }
            if (grid[idx] === TYPE_FIRE) break;

            // Buoyancy: Oil floats upward through denser water (800 vs 1000 kg/m³)
            if (grid[above] === TYPE_WATER && updated[above] === 0) {
              swapCells(state, idx, above);
              break;
            }
          }

          // LIQUID NITROGEN:
          else if (elem === TYPE_NITROGEN) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (ne === TYPE_WATER) {
                grid[n] = TYPE_ICE;
                state.reactionScore += 4;
              } else if (ne === TYPE_LAVA) {
                grid[n] = TYPE_WALL;
                grid[idx] = TYPE_ICE;
                state.reactionScore += 8;
                break;
              } else if (ne === TYPE_MERCURY) {
                // Freezes liquid mercury (-38.8°C melting point) into solid silver stone
                grid[n] = TYPE_WALL;
                callbacks?.onSpark?.(x, y, 3, false);
                state.reactionScore += 6;
              } else if (ne === TYPE_BIO_SPORE) {
                grid[n] = TYPE_EMPTY;
                callbacks?.onSpark?.(x, y, 2, false);
              } else if (ne === TYPE_FIRE) {
                grid[idx] = TYPE_SMOKE;
                life[idx] = 20;
                break;
              }
            }
          }

          // CRYO-GEL:
          else if (elem === TYPE_CRYO_GEL) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (ne === TYPE_WATER) {
                grid[n] = TYPE_ICE;
                state.reactionScore += 3;
              } else if (ne === TYPE_LAVA) {
                grid[n] = TYPE_WALL;
                grid[idx] = TYPE_WALL;
                state.reactionScore += 8;
                break;
              } else if (ne === TYPE_FIRE) {
                grid[n] = TYPE_SMOKE;
                life[n] = 25;
              }
            }
          }

          // ACID & GREEN VITRIOL:
          else if (elem === TYPE_ACID || elem === TYPE_VITRIOL) {
            for (const n of [below, above, left, right]) {
              const ne = grid[n];
              if (ne === TYPE_ELIXIR) {
                grid[idx] = TYPE_WATER;
                state.reactionScore += 10;
                break;
              } else if (
                ne === TYPE_WOOD ||
                ne === TYPE_SAND ||
                ne === TYPE_BIO_SPORE ||
                ne === TYPE_GUNPOWDER ||
                ne === TYPE_C4 ||
                ne === TYPE_ICE ||
                ne === TYPE_WIRE
              ) {
                grid[n] = TYPE_SMOKE;
                life[n] = 25;
                if (Math.random() < 0.6) {
                  grid[idx] = TYPE_SMOKE;
                  life[idx] = 20;
                }
                callbacks?.onSpark?.(x, y, 2, false);
                state.reactionScore += 5;
                break;
              }
            }
            if (grid[idx] === TYPE_WATER) break;
          }

          // ALCHEMICAL ELIXIR:
          else if (elem === TYPE_ELIXIR) {
            for (const n of n8) {
              const ne = grid[n];
              if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
                grid[n] = TYPE_WATER;
                updated[n] = 1;
                state.reactionScore += 15;
              } else if (ne === TYPE_FIRE) {
                grid[n] = TYPE_AETHER;
                life[n] = 90;
                state.reactionScore += 12;
              } else if (ne === TYPE_LAVA) {
                grid[n] = TYPE_WALL;
                state.reactionScore += 10;
              } else if (ne === TYPE_ICE) {
                grid[n] = TYPE_WATER;
                updated[n] = 1;
                state.reactionScore += 5;
              } else if (ne === TYPE_BIO_SPORE && Math.random() < 0.1) {
                callbacks?.onSpark?.(x, y, 4, true);
              }
            }
          }

          // MERCURY (Quicksilver):
          else if (elem === TYPE_MERCURY) {
            for (const n of [above, below, left, right]) {
              const ne = grid[n];
              if (ne === TYPE_NITROGEN || ne === TYPE_CRYO_GEL) {
                grid[idx] = TYPE_WALL;
                callbacks?.onSpark?.(x, y, 2, false);
                state.reactionScore += 6;
                break;
              } else if (ne === TYPE_SPARK) {
                for (const t of n8) {
                  if (grid[t] === TYPE_WIRE && updated[t] === 0) {
                    grid[t] = TYPE_SPARK;
                    life[t] = 4;
                    updated[t] = 1;
                  }
                }
              } else if (
                ne === TYPE_FIRE ||
                ne === TYPE_LAVA ||
                ne === TYPE_PLASMA
              ) {
                grid[idx] = TYPE_AETHER;
                life[idx] = 85;
                callbacks?.onSpark?.(x, y, 4, true);
                state.reactionScore += 15;
                break;
              }
            }
            if (grid[idx] !== TYPE_MERCURY) break;

            let hasBrimstone = false;
            let hasHeat = false;
            for (const n of n8) {
              if (grid[n] === TYPE_BRIMSTONE) hasBrimstone = true;
              if (
                grid[n] === TYPE_FIRE ||
                grid[n] === TYPE_LAVA ||
                grid[n] === TYPE_PLASMA
              ) {
                hasHeat = true;
              }
            }
            if (hasBrimstone && hasHeat) {
              grid[idx] = TYPE_PHILOSOPHER_STONE;
              callbacks?.onSpark?.(x, y, 8, true);
              state.reactionScore += 50;
            }
          }

          // --- Fluid Downward Gravity & Sinking ---
          if (grid[below] === TYPE_EMPTY) {
            swapCells(state, idx, below);
          } else if (
            elem === TYPE_MERCURY &&
            (grid[below] === TYPE_WATER ||
              grid[below] === TYPE_OIL ||
              grid[below] === TYPE_ACID ||
              grid[below] === TYPE_SAND)
          ) {
            swapCells(state, idx, below);
          } else if (elem === TYPE_WATER && grid[below] === TYPE_OIL) {
            swapCells(state, idx, below);
          } else if (grid[below + rDir] === TYPE_EMPTY) {
            swapCells(state, idx, below + rDir);
          } else if (grid[below - rDir] === TYPE_EMPTY) {
            swapCells(state, idx, below - rDir);
          } else if (grid[idx + rDir] === TYPE_EMPTY) {
            swapCells(state, idx, idx + rDir);
          } else if (grid[idx - rDir] === TYPE_EMPTY) {
            swapCells(state, idx, idx - rDir);
          }
          break;
        }

        // --- 3. ICE (Solid Frozen Water) ---
        case TYPE_ICE: {
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_PLASMA ||
              ne === TYPE_THERMITE ||
              ne === TYPE_HEAT ||
              ne === TYPE_ELIXIR
            ) {
              grid[idx] = TYPE_WATER;
              if (ne === TYPE_FIRE) {
                grid[n] = TYPE_SMOKE;
                life[n] = 25;
              }
              callbacks?.onSpark?.(x, y, 1, false);
              state.reactionScore += 2;
              break;
            } else if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 20;
              break;
            }
          }

          // Proximity-based melting: ice melts into water near fire, lava, thermite, or heat
          if (grid[idx] === TYPE_ICE) {
            const heat = getHeatProximity(state, x, y, 3);
            if (heat > 8) {
              grid[idx] = TYPE_WATER;
              callbacks?.onSpark?.(x, y, 1, false);
              state.reactionScore += 2;
            }
          }

          if (grid[below] === TYPE_EMPTY && Math.random() < 0.25) {
            swapCells(state, idx, below);
          }
          break;
        }

        // --- 4. WOOD (Combustible Organic Solid) ---
        case TYPE_WOOD: {
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_PLASMA ||
              ne === TYPE_THERMITE ||
              ne === TYPE_SPARK
            ) {
              grid[idx] = TYPE_FIRE;
              life[idx] = (35 + Math.random() * 25) | 0;
              callbacks?.onSpark?.(x, y, 2, false);
              state.reactionScore += 3;
              break;
            } else if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 25;
              callbacks?.onSpark?.(x, y, 2, false);
              break;
            } else if (ne === TYPE_BIO_SPORE && Math.random() < 0.08) {
              grid[idx] = TYPE_BIO_SPORE;
              state.reactionScore += 4;
              break;
            }
          }
          break;
        }

        // --- 4. DIAMOND (Ultra-Hard Carbon Lattice) ---
        case TYPE_DIAMOND: {
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (ne === TYPE_THERMITE || ne === TYPE_PLASMA) {
              if (Math.random() < 0.15) {
                grid[idx] = TYPE_FIRE;
                life[idx] = 30;
                callbacks?.onSpark?.(x, y, 4, true);
              }
              break;
            }
          }
          break;
        }

        // --- 5. NUCLEAR METALS: URANIUM & PLUTONIUM ---
        case TYPE_URANIUM: {
          if (Math.random() < 0.003) {
            const emptyNeighbor = [above, below, left, right].find(
              (n) => grid[n] === TYPE_EMPTY
            );
            if (emptyNeighbor !== undefined) {
              grid[emptyNeighbor] = TYPE_NEUTRON;
              life[emptyNeighbor] = 25;
            }
          }
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (
              ne === TYPE_NEUTRON ||
              ne === TYPE_PLASMA ||
              ne === TYPE_THERMITE
            ) {
              grid[idx] = TYPE_FIRE;
              life[idx] = 40;
              if (grid[above] === TYPE_EMPTY) {
                grid[above] = TYPE_NEUTRON;
                life[above] = 30;
              }
              callbacks?.onSpark?.(x, y, 8, true);
              state.reactionScore += 20;
              break;
            }
          }
          break;
        }

        case TYPE_PLUTONIUM: {
          if (Math.random() < 0.007) {
            const emptyNeighbor = [above, below, left, right].find(
              (n) => grid[n] === TYPE_EMPTY
            );
            if (emptyNeighbor !== undefined) {
              grid[emptyNeighbor] = TYPE_NEUTRON;
              life[emptyNeighbor] = 30;
            }
          }
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (
              ne === TYPE_NEUTRON ||
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_PLASMA ||
              ne === TYPE_THERMITE ||
              ne === TYPE_SPARK
            ) {
              explodeRadius(state, x, y, 32, callbacks);
              [above, below, left, right].forEach((pos) => {
                if (pos > 0 && pos < w * h && grid[pos] === TYPE_EMPTY) {
                  grid[pos] = TYPE_NEUTRON;
                  life[pos] = 40;
                }
              });
              callbacks?.onSpark?.(x, y, 20, true);
              state.reactionScore += 40;
              break;
            }
          }
          break;
        }

        // --- 7. NEUTRON (Penetrating Ray) ---
        case TYPE_NEUTRON: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          const dx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 0);
          const dy = (Math.random() < 0.5 ? -1 : 1) * (dx === 0 ? 1 : Math.random() < 0.5 ? 1 : 0);
          const tx = x + (dx || 0);
          const ty = y + (dy || -1);

          if (tx > 0 && tx < w - 1 && ty > 0 && ty < h - 1) {
            const target = ty * w + tx;
            const tElem = grid[target];

            if (tElem === TYPE_URANIUM || tElem === TYPE_PLUTONIUM) {
              explodeRadius(state, tx, ty, tElem === TYPE_PLUTONIUM ? 32 : 24, callbacks);
              callbacks?.onSpark?.(tx, ty, 12, true);
              grid[idx] = TYPE_EMPTY;
            } else if (tElem === TYPE_C4 || tElem === TYPE_GUNPOWDER) {
              explodeRadius(state, tx, ty, tElem === TYPE_C4 ? 28 : 22, callbacks);
              grid[idx] = TYPE_EMPTY;
            } else if (tElem === TYPE_BIO_SPORE) {
              grid[target] = TYPE_SMOKE;
              life[target] = 20;
              grid[idx] = TYPE_EMPTY;
            } else if (tElem === TYPE_WATER) {
              grid[idx] = TYPE_EMPTY;
              if (Math.random() < 0.2) {
                grid[target] = TYPE_SMOKE;
                life[target] = 30;
              }
            } else if (tElem === TYPE_DIAMOND) {
              grid[idx] = TYPE_EMPTY;
              callbacks?.onSpark?.(tx, ty, 1, false);
            } else if (tElem === TYPE_EMPTY) {
              swapCells(state, idx, target);
            } else if (tElem === TYPE_WALL) {
              if (Math.random() < 0.4) {
                grid[idx] = TYPE_EMPTY;
              } else {
                swapCells(state, idx, target);
              }
            }
          } else {
            grid[idx] = TYPE_EMPTY;
          }
          break;
        }

        // --- 8. EXPLOSIVES: C-4 ---
        case TYPE_C4: {
          for (const n of n8) {
            const ne = grid[n];
            if (
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_SPARK ||
              ne === TYPE_PLASMA ||
              ne === TYPE_THERMITE ||
              ne === TYPE_NEUTRON
            ) {
              explodeRadius(state, x, y, 28, callbacks);
              break;
            }
          }
          break;
        }

        // --- 8. LAVA ---
        case TYPE_LAVA: {
          if (Math.random() < 0.04) callbacks?.onSpark?.(x, y, 1, false);

          // Dynamic Wind & Cool proximity cooling
          const cool = getCoolProximity(state, x, y, 2);
          if (cool > 12) {
            grid[idx] = TYPE_WALL; // Chilled and solidified into rock
            state.reactionScore += 4;
            callbacks?.onSpark?.(x, y, 2, false);
            break;
          }

          for (const n of [below, above, left, right]) {
            const ne = grid[n];
            if (
              ne === TYPE_WATER ||
              ne === TYPE_CRYO_GEL ||
              ne === TYPE_NITROGEN ||
              ne === TYPE_WIND ||
              ne === TYPE_COOL
            ) {
              grid[n] = TYPE_SMOKE;
              life[n] = 35;
              grid[idx] = TYPE_WALL;
              state.reactionScore += 6;
              break;
            } else if (
              ne === TYPE_WOOD ||
              ne === TYPE_OIL ||
              ne === TYPE_BIO_SPORE
            ) {
              grid[n] = TYPE_FIRE;
              life[n] = 40;
              state.reactionScore += 3;
            } else if (ne === TYPE_GUNPOWDER || ne === TYPE_C4) {
              explodeRadius(state, n % w, Math.floor(n / w), 24, callbacks);
            }
          }
          if (grid[idx] === TYPE_LAVA) {
            if (grid[below] === TYPE_EMPTY) swapCells(state, idx, below);
            else if (grid[below + rDir] === TYPE_EMPTY)
              swapCells(state, idx, below + rDir);
            else if (Math.random() < 0.5 && grid[idx + rDir] === TYPE_EMPTY)
              swapCells(state, idx, idx + rDir);
          }
          break;
        }

        // --- 10. FIRE & PLASMA ---
        case TYPE_FIRE:
        case TYPE_PLASMA: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = Math.random() < 0.3 ? TYPE_SMOKE : TYPE_EMPTY;
            if (grid[idx] === TYPE_SMOKE) life[idx] = 30;
            continue;
          }
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (ne === TYPE_WOOD || ne === TYPE_BIO_SPORE) {
              grid[n] = TYPE_FIRE;
              life[n] = (30 + Math.random() * 30) | 0;
              state.reactionScore += 2;
            } else if (ne === TYPE_OIL) {
              grid[n] = TYPE_FIRE;
              life[n] = 50;
              state.reactionScore += 4;
            } else if (ne === TYPE_GUNPOWDER) {
              explodeRadius(state, n % w, Math.floor(n / w), 22, callbacks);
            } else if (ne === TYPE_C4) {
              explodeRadius(state, n % w, Math.floor(n / w), 28, callbacks);
            } else if (
              ne === TYPE_WATER ||
              ne === TYPE_CRYO_GEL ||
              ne === TYPE_ICE ||
              ne === TYPE_NITROGEN ||
              ne === TYPE_WIND ||
              ne === TYPE_COOL
            ) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 25;
              break;
            } else if (ne === TYPE_SAND) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 15;
              break;
            } else if (ne === TYPE_ELIXIR) {
              grid[idx] = TYPE_AETHER;
              life[idx] = 90;
              state.reactionScore += 12;
              break;
            } else if (elem === TYPE_PLASMA) {
              if (ne === TYPE_WIRE && updated[n] === 0) {
                grid[n] = TYPE_SPARK;
                life[n] = 4;
                updated[n] = 1;
              } else if (ne === TYPE_WALL && Math.random() < 0.08) {
                grid[n] = TYPE_LAVA;
                state.reactionScore += 8;
              }
            }
          }
          if (grid[idx] === TYPE_FIRE || grid[idx] === TYPE_PLASMA) {
            if (grid[above] === TYPE_EMPTY && Math.random() < 0.6) {
              swapCells(state, idx, above);
            } else if (
              grid[above + rDir] === TYPE_EMPTY &&
              Math.random() < 0.35
            ) {
              swapCells(state, idx, above + rDir);
            }
          }
          break;
        }

        // --- 11. ELECTRONICS & LOGIC ---
        case TYPE_SPARK: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_WIRE;
            continue;
          }
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_WIRE && updated[n] === 0) {
              grid[n] = TYPE_SPARK;
              life[n] = 4;
              updated[n] = 1;
            } else if (ne === TYPE_SWITCH) {
              if (life[n] === 1) {
                for (const t of [n - w, n + w, n - 1, n + 1]) {
                  if (grid[t] === TYPE_WIRE && updated[t] === 0) {
                    grid[t] = TYPE_SPARK;
                    life[t] = 4;
                    updated[t] = 1;
                  }
                }
              }
              life[n] = life[n] === 1 ? 0 : 1;
              state.reactionScore += 5;
            } else if (ne === TYPE_GUNPOWDER || ne === TYPE_C4) {
              explodeRadius(state, n % w, Math.floor(n / w), 26, callbacks);
            } else if (ne === TYPE_THERMITE) {
              grid[n] = TYPE_PLASMA;
              life[n] = 70;
              callbacks?.onSpark?.(n % w, Math.floor(n / w), 8, true);
            } else if (ne === TYPE_OIL) {
              grid[n] = TYPE_FIRE;
              life[n] = 50;
            } else if (ne === TYPE_WOOD) {
              grid[n] = TYPE_FIRE;
              life[n] = 40;
            }
          }
          break;
        }

        case TYPE_SWITCH: {
          // Switch state: life[idx] === 1 (closed/conducting), 0 (open/insulating)
          break;
        }

        case TYPE_SENSOR: {
          let detected = false;
          for (const n of n8) {
            const ne = grid[n];
            if (
              ne !== TYPE_EMPTY &&
              ne !== TYPE_SENSOR &&
              ne !== TYPE_WIRE &&
              ne !== TYPE_WALL &&
              ne !== TYPE_SWITCH
            ) {
              detected = true;
              break;
            }
          }
          if (detected) {
            for (const n of [above, below, left, right]) {
              if (grid[n] === TYPE_WIRE && updated[n] === 0) {
                grid[n] = TYPE_SPARK;
                life[n] = 4;
                updated[n] = 1;
              }
            }
          }
          break;
        }

        // --- 11. EXOTICS: ANTIMATTER, SINGULARITY, DARK MATTER ---
        case TYPE_ANTIMATTER: {
          for (const n of n8) {
            if (grid[n] !== TYPE_EMPTY && grid[n] !== TYPE_ANTIMATTER) {
              grid[n] = TYPE_EMPTY;
              grid[idx] = TYPE_PLASMA;
              life[idx] = 45;
              callbacks?.onSpark?.(x, y, 8, true);
              state.reactionScore += 25;
              break;
            }
          }
          break;
        }

        case TYPE_SINGULARITY: {
          for (let dy = -5; dy <= 5; dy++) {
            for (let dx = -5; dx <= 5; dx++) {
              if (dx === 0 && dy === 0) continue;
              const distSq = dx * dx + dy * dy;
              if (distSq > 25) continue;
              const tx = x + dx;
              const ty = y + dy;
              if (tx > 1 && tx < w - 2 && ty > 1 && ty < h - 2) {
                const tidx = ty * w + tx;
                const telem = grid[tidx];
                if (
                  telem !== TYPE_EMPTY &&
                  telem !== TYPE_SINGULARITY &&
                  telem !== TYPE_WALL &&
                  telem !== TYPE_DIAMOND
                ) {
                  if (distSq <= 2.25) {
                    grid[tidx] = TYPE_EMPTY;
                    callbacks?.onSpark?.(x, y, 2, true);
                    state.reactionScore += 5;
                  } else {
                    const stepX = dx > 0 ? -1 : dx < 0 ? 1 : 0;
                    const stepY = dy > 0 ? -1 : dy < 0 ? 1 : 0;
                    const pullIdx = (ty + stepY) * w + (tx + stepX);
                    if (grid[pullIdx] === TYPE_EMPTY && updated[tidx] === 0) {
                      swapCells(state, tidx, pullIdx);
                    }
                  }
                }
              }
            }
          }
          break;
        }

        case TYPE_DARK_MATTER: {
          for (const n of [above, below, left, right]) {
            if (grid[n] === TYPE_ANTIMATTER) {
              grid[n] = TYPE_EMPTY;
              grid[idx] = TYPE_PLASMA;
              life[idx] = 80;
              explodeRadius(state, x, y, 20, callbacks);
              callbacks?.onSpark?.(x, y, 15, true);
              state.reactionScore += 40;
              break;
            }
          }
          if (grid[above] === TYPE_EMPTY) {
            swapCells(state, idx, above);
          } else if (grid[above + rDir] === TYPE_EMPTY) {
            swapCells(state, idx, above + rDir);
          }
          break;
        }

        // --- 13. ALCHEMY: PHILOSOPHER'S STONE & AETHER ---
        case TYPE_PHILOSOPHER_STONE: {
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_SAND || ne === TYPE_WOOD) {
              grid[n] = Math.random() < 0.5 ? TYPE_DIAMOND : TYPE_ELIXIR;
              updated[n] = 1;
              callbacks?.onSpark?.(x, y, 4, true);
              state.reactionScore += 30;
            } else if (ne === TYPE_MERCURY) {
              grid[n] = TYPE_AETHER;
              life[n] = 90;
              updated[n] = 1;
              state.reactionScore += 25;
            } else if (ne === TYPE_ACID || ne === TYPE_VITRIOL) {
              grid[n] = TYPE_WATER;
              updated[n] = 1;
              state.reactionScore += 20;
            } else if (ne === TYPE_GUNPOWDER || ne === TYPE_C4) {
              grid[n] = TYPE_DIAMOND;
              updated[n] = 1;
              callbacks?.onSpark?.(x, y, 6, true);
              state.reactionScore += 35;
            } else if (ne === TYPE_BIO_SPORE) {
              grid[n] = TYPE_ELIXIR;
              updated[n] = 1;
              state.reactionScore += 15;
            }
          }
          if (grid[below] === TYPE_EMPTY) {
            swapCells(state, idx, below);
          }
          break;
        }

        case TYPE_AETHER: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          if (grid[above] === TYPE_EMPTY) {
            swapCells(state, idx, above);
          } else if (grid[above + rDir] === TYPE_EMPTY) {
            swapCells(state, idx, above + rDir);
          }
          break;
        }

        case TYPE_SMOKE: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          // Wind/coolant condenses smoke into water
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (
              (ne === TYPE_WIND || ne === TYPE_COOL || ne === TYPE_NITROGEN || ne === TYPE_CRYO_GEL) &&
              Math.random() < 0.25
            ) {
              grid[idx] = TYPE_WATER; // Condensation
              break;
            }
          }
          if (grid[idx] === TYPE_SMOKE) {
            if (grid[above] === TYPE_EMPTY && Math.random() < 0.5) {
              swapCells(state, idx, above);
            } else if (grid[above + rDir] === TYPE_EMPTY && Math.random() < 0.4) {
              swapCells(state, idx, above + rDir);
            }
          }
          break;
        }

        // --- 13. BIOSCIENCE: BIO-SPORE ---
        case TYPE_BIO_SPORE: {
          for (const n of [above, below, left, right]) {
            const ne = grid[n];
            if (ne === TYPE_WATER && Math.random() < 0.22) {
              grid[n] = TYPE_BIO_SPORE;
              state.reactionScore += 2;
            } else if (
              (ne === TYPE_WOOD || ne === TYPE_OIL) &&
              Math.random() < 0.08
            ) {
              grid[n] = TYPE_BIO_SPORE;
              state.reactionScore += 4;
              callbacks?.onSpark?.(x, y, 1, false);
            } else if (
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_ACID ||
              ne === TYPE_VITRIOL
            ) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 20;
              break;
            }
          }
          if (grid[below] === TYPE_EMPTY && Math.random() < 0.7) {
            swapCells(state, idx, below);
          } else if (grid[below + rDir] === TYPE_EMPTY && Math.random() < 0.4) {
            swapCells(state, idx, below + rDir);
          }
          break;
        }

        // --- 14. WIRE & REFRACTORY METALS (Melting under extreme heat proximity) ---
        case TYPE_WIRE:
        case TYPE_TUNG: {
          const heat = getHeatProximity(state, x, y, elem === TYPE_TUNG ? 1 : 2);
          if (heat > (elem === TYPE_TUNG ? 50 : 25)) {
            grid[idx] = TYPE_LAVA;
            callbacks?.onSpark?.(x, y, 3, true);
            state.reactionScore += 8;
            break;
          }
          break;
        }

        // --- 15. DYNAMIC WIND (Atmospheric Coolant Flow) ---
        case TYPE_WIND: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          // Dynamic wind cooling on surrounding elements
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_LAVA) {
              grid[n] = TYPE_WALL; // Cools molten lava into stone
              state.reactionScore += 4;
              callbacks?.onSpark?.(n % w, Math.floor(n / w), 2, false);
            } else if (ne === TYPE_FIRE || ne === TYPE_PLASMA) {
              grid[n] = TYPE_SMOKE; // Chills and snuffs flames into smoke
              life[n] = 20;
            } else if (ne === TYPE_SMOKE && Math.random() < 0.25) {
              grid[n] = TYPE_WATER; // Condenses steam clouds into water droplets
            }
          }
          // Wind drift: moves horizontally with gentle upward lift
          const windTarget = Math.random() < 0.65 ? right : above;
          if (windTarget > 0 && windTarget < w * h) {
            const targetElem = grid[windTarget];
            if (targetElem === TYPE_EMPTY) {
              swapCells(state, idx, windTarget);
            } else if (
              targetElem === TYPE_SAND ||
              targetElem === TYPE_GUNPOWDER ||
              targetElem === TYPE_SMOKE ||
              targetElem === TYPE_BIO_SPORE
            ) {
              swapCells(state, idx, windTarget);
            }
          }
          break;
        }

        // --- 16. THERMAL HEAT TOOL ---
        case TYPE_HEAT: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_ICE) {
              grid[n] = TYPE_WATER;
            } else if (ne === TYPE_WATER) {
              grid[n] = TYPE_SMOKE;
              life[n] = 30;
            } else if (ne === TYPE_WOOD || ne === TYPE_OIL) {
              grid[n] = TYPE_FIRE;
              life[n] = 40;
            } else if (ne === TYPE_GUNPOWDER || ne === TYPE_C4) {
              explodeRadius(state, n % w, Math.floor(n / w), 22, callbacks);
            } else if (ne === TYPE_WIRE && Math.random() < 0.3) {
              grid[n] = TYPE_LAVA;
            }
          }
          if (grid[above] === TYPE_EMPTY && Math.random() < 0.6) {
            swapCells(state, idx, above);
          }
          break;
        }

        // --- 17. CRYO-COOL TOOL ---
        case TYPE_COOL: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_WATER) {
              grid[n] = TYPE_ICE;
            } else if (ne === TYPE_LAVA) {
              grid[n] = TYPE_WALL;
            } else if (ne === TYPE_FIRE || ne === TYPE_PLASMA) {
              grid[n] = TYPE_SMOKE;
              life[n] = 20;
            } else if (ne === TYPE_C5) {
              explodeRadius(state, n % w, Math.floor(n / w), 26, callbacks);
            }
          }
          if (grid[below] === TYPE_EMPTY && Math.random() < 0.6) {
            swapCells(state, idx, below);
          }
          break;
        }

        // --- 18. C-5 EXPLOSIVE (Cold-Sensitive Plastic) ---
        case TYPE_C5: {
          const cool = getCoolProximity(state, x, y, 2);
          if (cool > 12) {
            explodeRadius(state, x, y, 26, callbacks);
            break;
          }
          for (const n of n8) {
            const ne = grid[n];
            if (
              ne === TYPE_CRYO_GEL ||
              ne === TYPE_NITROGEN ||
              ne === TYPE_COOL ||
              ne === TYPE_ICE
            ) {
              explodeRadius(state, x, y, 26, callbacks);
              break;
            }
          }
          break;
        }

        // --- 19. AMOEBA CREATURE (Lifeform Simulation) ---
        case TYPE_CREATURE: {
          if (life[idx] > 0) life[idx]--;
          if (life[idx] <= 0) {
            grid[idx] = TYPE_EMPTY;
            continue;
          }
          for (const n of n8) {
            const ne = grid[n];
            if (ne === TYPE_BIO_SPORE) {
              grid[n] = TYPE_CREATURE;
              life[n] = 100;
              life[idx] = 120;
              state.reactionScore += 6;
              break;
            } else if (
              ne === TYPE_FIRE ||
              ne === TYPE_LAVA ||
              ne === TYPE_ACID ||
              ne === TYPE_VITRIOL
            ) {
              grid[idx] = TYPE_SMOKE;
              life[idx] = 25;
              break;
            }
          }
          if (grid[idx] === TYPE_CREATURE) {
            const crawlDir = Math.random() < 0.5 ? left : right;
            if (grid[below] === TYPE_EMPTY) {
              swapCells(state, idx, below);
            } else if (grid[crawlDir] === TYPE_EMPTY && Math.random() < 0.3) {
              swapCells(state, idx, crawlDir);
            }
          }
          break;
        }
      }
    }
  }

  state.activeParticles = active;
}

export function computeElementCensus(
  state: SimulationState
): Record<string, number> {
  const counts: Record<string, number> = {};
  Object.values(ELEMENTS).forEach((el) => {
    if (el.id !== TYPE_EMPTY) counts[el.name] = 0;
  });

  const grid = state.grid;
  for (let i = 0; i < grid.length; i++) {
    const t = grid[i];
    if (t === TYPE_EMPTY) continue;
    if (ELEMENTS[t]) {
      counts[ELEMENTS[t].name] = (counts[ELEMENTS[t].name] || 0) + 1;
    }
  }
  return counts;
}

export function computeShannonEntropy(counts: Record<string, number>): number {
  const total = Object.values(counts).reduce((acc, v) => acc + v, 0);
  if (total <= 0) return 0;
  let entropy = 0;
  for (const val of Object.values(counts)) {
    if (val > 0) {
      const p = val / total;
      entropy -= p * Math.log2(p);
    }
  }
  return Math.round(entropy * 100) / 100;
}

export function computeExothermicIndex(counts: Record<string, number>): number {
  const total = Object.values(counts).reduce((acc, v) => acc + v, 0);
  if (total <= 0) return 0;
  const hot =
    (counts['Fire'] || 0) * 2.5 +
    (counts['Lava'] || 0) * 2.0 +
    (counts['Plasma'] || 0) * 3.5 +
    (counts['Thermite'] || 0) * 3.0 +
    (counts['C-4'] || 0) * 2.8 +
    (counts['Acid'] || 0) * 1.4 +
    (counts['Vitriol'] || 0) * 1.6 +
    (counts['Powder'] || 0) * 1.2 +
    (counts['Plutonium'] || 0) * 2.2 +
    (counts['Antimatter'] || 0) * 4.0 -
    (counts['Liquid Nitrogen'] || 0) * 2.5 -
    (counts['Cryo-Gel'] || 0) * 1.8 -
    (counts['Ice'] || 0) * 1.2 -
    (counts['Water'] || 0) * 0.4;
  return Math.max(
    0,
    Math.min(100, Math.round((hot / Math.max(50, total)) * 100))
  );
}

export function evaluateDrugLikeness(props: {
  molecularWeight: number;
  xlogp: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
  rotatableBondCount: number;
  tpsa: number;
}): {
  lipinskiViolations: number;
  lipinskiPass: boolean;
  veberPass: boolean;
} {
  let violations = 0;
  if (props.molecularWeight > 500) violations++;
  if (props.xlogp > 5) violations++;
  if (props.hBondDonorCount > 5) violations++;
  if (props.hBondAcceptorCount > 10) violations++;

  const lipinskiPass = violations <= 1;
  const veberPass = props.rotatableBondCount <= 10 && props.tpsa <= 140;

  return {
    lipinskiViolations: violations,
    lipinskiPass,
    veberPass,
  };
}

export function buildCustomReportSnapshot(
  state: SimulationState,
  title: string,
  fps: number,
  basket: BasketItem[]
): CustomReportSnapshot {
  const counts = computeElementCensus(state);
  const totalNonWall = Object.entries(counts)
    .filter(([k]) => k !== 'Stone' && k !== 'Diamond')
    .reduce((acc, [, v]) => acc + v, 0);

  return {
    id: `REP-${Date.now().toString(36).toUpperCase()}`,
    title: title.trim() || `Reactor Run Telemetry`,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    fps: Math.round(fps),
    totalParticles: totalNonWall,
    shannonEntropy: computeShannonEntropy(counts),
    exothermicIndex: computeExothermicIndex(counts),
    containmentIntegrity: Math.round(state.containmentIntegrity),
    reactionScore: Math.round(state.reactionScore),
    elementCounts: counts,
    basketCount: basket.length,
  };
}

export function formatReportAsCSV(report: CustomReportSnapshot): string {
  const headers = [
    'Report ID',
    'Title',
    'Timestamp',
    'Version',
    'FPS',
    'Active Particles',
    'Shannon Entropy (bits)',
    'Exothermic Index',
    'Containment Integrity (%)',
    'Reaction Score',
    'Basket Reagents',
    ...Object.keys(report.elementCounts),
  ];
  const values = [
    report.id,
    `"${report.title.replace(/"/g, '""')}"`,
    report.timestamp,
    report.version,
    report.fps,
    report.totalParticles,
    report.shannonEntropy,
    report.exothermicIndex,
    report.containmentIntegrity,
    report.reactionScore,
    report.basketCount,
    ...Object.values(report.elementCounts),
  ];
  return `${headers.join(',')}\n${values.join(',')}`;
}

export function injectBasketIntoSimulation(
  state: SimulationState,
  basket: BasketItem[],
  callbacks?: PhysicsCallbacks
): number {
  let totalInjected = 0;
  if (basket.length === 0) return 0;

  const spacing = Math.floor((state.width - 40) / Math.max(1, basket.length));
  basket.forEach((item, idx) => {
    const cx = Math.min(
      state.width - 20,
      Math.max(20, 25 + idx * spacing + Math.floor(spacing / 2))
    );
    const cy = 28 + (idx % 3) * 14;
    for (let q = 0; q < item.quantity; q++) {
      const ox = cx + ((q * 7) % 15) - 7;
      const oy = cy + Math.floor(q / 3) * 4;
      totalInjected += paintBrush(
        state,
        ox,
        oy,
        item.brushRadius,
        item.elementType
      );
    }
    callbacks?.onSpark?.(cx, cy, 8, false);
  });

  state.reactionScore += basket.length * 15;
  return totalInjected;
}

export function getThermalHeatmapColor(elemId: number): number {
  if (elemId === TYPE_EMPTY) return 0;
  let temp = 22;
  const meta = ELEMENTS[elemId];
  if (meta) {
    temp = meta.temperature ?? 22;
  }
  if (elemId === TYPE_FIRE || elemId === TYPE_SPARK) temp = 1200;
  else if (elemId === TYPE_LAVA) temp = 1500;
  else if (elemId === TYPE_PLASMA) temp = 3500;
  else if (elemId === TYPE_NITROGEN) temp = -196;
  else if (elemId === TYPE_WATER) temp = 20;

  const tNorm = Math.max(0, Math.min(1, (temp + 200) / 2000));
  let r = 0, g = 0, b = 0, a = 150;
  if (tNorm < 0.25) {
    const f = tNorm / 0.25;
    r = 0;
    g = Math.floor(f * 220);
    b = 255;
  } else if (tNorm < 0.5) {
    const f = (tNorm - 0.25) / 0.25;
    r = 0;
    g = 255;
    b = Math.floor((1 - f) * 255);
  } else if (tNorm < 0.75) {
    const f = (tNorm - 0.5) / 0.25;
    r = Math.floor(f * 255);
    g = Math.floor((1 - f * 0.4) * 255);
    b = 0;
  } else {
    const f = (tNorm - 0.75) / 0.25;
    r = 255;
    g = Math.floor(f * 220);
    b = Math.floor(f * 220);
  }
  return (a << 24) | (b << 16) | (g << 8) | r;
}

