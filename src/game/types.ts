export const APP_VERSION = 'v2.3.0';

// Core Elements (0 - 12)
export const TYPE_EMPTY = 0;
export const TYPE_WALL = 1;
export const TYPE_SAND = 2;
export const TYPE_WATER = 3;
export const TYPE_FIRE = 4;
export const TYPE_WOOD = 5;
export const TYPE_OIL = 6;
export const TYPE_GUNPOWDER = 7;
export const TYPE_LAVA = 8;
export const TYPE_ACID = 9;
export const TYPE_SMOKE = 10;
export const TYPE_BIO_SPORE = 11;
export const TYPE_CRYO_GEL = 12;

// TPT Classics & Ultimata Mod Elements (13 - 19)
export const TYPE_C4 = 13;
export const TYPE_THERMITE = 14;
export const TYPE_PLASMA = 15;
export const TYPE_SINGULARITY = 16;
export const TYPE_NITROGEN = 17;
export const TYPE_DIAMOND = 18;
export const TYPE_ICE = 19;

// Nuclear & Exotic Physics (20 - 24)
export const TYPE_URANIUM = 20;
export const TYPE_PLUTONIUM = 21;
export const TYPE_DARK_MATTER = 22;
export const TYPE_ANTIMATTER = 23;
export const TYPE_NEUTRON = 24;

// Electronics & Circuitry (25 - 28)
export const TYPE_WIRE = 25;
export const TYPE_SPARK = 26;
export const TYPE_SWITCH = 27;
export const TYPE_SENSOR = 28;

// Alchemy Mod Elements (29 - 34)
export const TYPE_PHILOSOPHER_STONE = 29;
export const TYPE_ELIXIR = 30;
export const TYPE_MERCURY = 31;
export const TYPE_BRIMSTONE = 32;
export const TYPE_VITRIOL = 33;
export const TYPE_AETHER = 34;

// Thermodynamics & Pressure Elements (35 - 38)
export const TYPE_RFRG = 35;
export const TYPE_QRTZ = 36;
export const TYPE_TUNG = 37;
export const TYPE_C5 = 38;

// Electronics Logic & Ray Emitters (39 - 43)
export const TYPE_PSCN = 39;
export const TYPE_NSCN = 40;
export const TYPE_ARAY = 41;
export const TYPE_CRAY = 42;
export const TYPE_DRAY = 43;

// Sand:box Optics & Life Elements (44 - 46)
export const TYPE_MIRROR = 44;
export const TYPE_LENS = 45;
export const TYPE_CREATURE = 46;

// Dynamic Environmental & Thermodynamic Tools (47 - 49)
export const TYPE_WIND = 47;
export const TYPE_HEAT = 48;
export const TYPE_COOL = 49;

export type ElementType = number;

export type ElementCategory =
  | 'solids'
  | 'liquids'
  | 'gases'
  | 'explosives'
  | 'electronics'
  | 'nuclear'
  | 'alchemy'
  | 'bioscience'
  | 'thermodynamics'
  | 'ray_emitters'
  | 'optics'
  | 'biology';

export type DrawingToolMode =
  | 'brush'
  | 'line'
  | 'box'
  | 'circle'
  | 'bucket'
  | 'eyedropper'
  | 'wind_vector'
  | 'thermal'
  | 'gravity'
  | 'inspector';

export type ConductivityClass = 'conductor' | 'semiconductor_p' | 'semiconductor_n' | 'insulator' | 'generator';

export interface InspectedPixelData {
  x: number;
  y: number;
  elemId: number;
  elemName: string;
  category: string;
  density: number;
  life: number;
  color: string;
  chemicalFormula?: string;
  shortRole?: string;
  temperature?: number;
  flammability?: number;
  hardness?: number;
  conductivity?: ConductivityClass;
  reactivityNotes?: string;
}

export interface ElementMetadata {
  id: ElementType;
  name: string;
  category: ElementCategory;
  shortRole: string;
  keyBinding: string;
  color: string;
  isGas: boolean;
  glow: boolean;
  density: number;
  pubchemCid?: number;
  formula?: string;
  description: string;
  temperature?: number;
  flammability?: number;
  hardness?: number;
  conductivity?: ConductivityClass;
  reactivityNotes?: string;
}

export interface InteractionRule {
  reagentA: string;
  reagentB: string;
  products: string;
  condition: string;
  enthalpy: string;
  category: ElementCategory;
}

export const ELEMENT_INTERACTIONS: InteractionRule[] = [
  { reagentA: 'Fire', reagentB: 'Water', products: 'Steam + Empty', condition: 'Thermal quenching', enthalpy: 'Endothermic (-50 kJ)', category: 'thermodynamics' },
  { reagentA: 'Fire', reagentB: 'Wood', products: 'Smoke + Ash + Fire', condition: 'Combustion (T > 250°C)', enthalpy: 'Exothermic (-850 kJ)', category: 'explosives' },
  { reagentA: 'Fire', reagentB: 'Gunpowder', products: 'Explosion Blast + Spark', condition: 'Instantaneous ignition', enthalpy: 'Explosive Deflagration', category: 'explosives' },
  { reagentA: 'Acid', reagentB: 'Wood', products: 'Smoke + Empty', condition: 'Corrosive dissolution', enthalpy: 'Exothermic (-120 kJ)', category: 'liquids' },
  { reagentA: 'Acid', reagentB: 'Sand', products: 'Smoke + Empty', condition: 'Silica etching', enthalpy: 'Neutralizing (-45 kJ)', category: 'liquids' },
  { reagentA: 'Lava', reagentB: 'Water', products: 'Stone Bedrock + Steam', condition: 'Thermal phase quenching', enthalpy: 'Exothermic (-400 kJ)', category: 'thermodynamics' },
  { reagentA: 'Uranium', reagentB: 'Neutron', products: 'Fission Fragments + Thermal Plasma', condition: 'High-speed neutron impact', enthalpy: 'Nuclear Fission', category: 'nuclear' },
  { reagentA: 'Philosopher\'s Stone', reagentB: 'C-4', products: 'Diamond + Water', condition: 'Catalytic neutralization', enthalpy: 'Alchemical Transmutation', category: 'alchemy' },
  { reagentA: 'Brimstone', reagentB: 'Water', products: 'Green Vitriol', condition: 'Catalytic synthesis', enthalpy: 'Exothermic (-90 kJ)', category: 'alchemy' },
  { reagentA: 'Mercury', reagentB: 'Nitrogen', products: 'Solid Silver Stone', condition: 'Cryogenic freezing (-196°C)', enthalpy: 'Endothermic (-200 kJ)', category: 'alchemy' },
  { reagentA: 'Spark', reagentB: 'Wire', products: 'Electrical Conduction', condition: 'Low resistance contact', enthalpy: 'Electromotive Pulse', category: 'electronics' },
  { reagentA: 'PSCN', reagentB: 'NSCN', products: 'Semiconductor Diode Conduction', condition: 'Forward-bias pulse', enthalpy: 'Solid-State Switching', category: 'electronics' },
];

export const ELEMENTS: Record<number, ElementMetadata> = {
  [TYPE_EMPTY]: {
    id: TYPE_EMPTY,
    name: 'Eraser',
    category: 'solids',
    shortRole: 'Vacuum Void',
    keyBinding: '0',
    color: '#08090c',
    isGas: false,
    glow: false,
    density: 0,
    description: 'Clears matter and restores empty quantum void.',
  },
  [TYPE_WALL]: {
    id: TYPE_WALL,
    name: 'Stone',
    category: 'solids',
    shortRole: 'Inert Barrier',
    keyBinding: '9',
    color: '#475569',
    isGas: false,
    glow: false,
    density: 9999,
    pubchemCid: 10112,
    formula: 'CaCO3',
    description: 'Dense indestructible bedrock boundary.',
  },
  [TYPE_SAND]: {
    id: TYPE_SAND,
    name: 'Sand',
    category: 'solids',
    shortRole: 'Silica Granular',
    keyBinding: '1',
    color: '#eab308',
    isGas: false,
    glow: false,
    density: 1600,
    pubchemCid: 24261,
    formula: 'SiO2',
    description: 'Classic granular particulate, cascades into steep mounds.',
  },
  [TYPE_WATER]: {
    id: TYPE_WATER,
    name: 'Water',
    category: 'liquids',
    shortRole: 'Aqueous Solvent',
    keyBinding: '2',
    color: '#38bdf8',
    isGas: false,
    glow: false,
    density: 1000,
    pubchemCid: 962,
    formula: 'H2O',
    description: 'Fluid solvent; extinguishes fire and cools molten rock.',
  },
  [TYPE_FIRE]: {
    id: TYPE_FIRE,
    name: 'Fire',
    category: 'gases',
    shortRole: 'Exothermic Flame',
    keyBinding: '3',
    color: '#f97316',
    isGas: true,
    glow: true,
    density: -50,
    description: 'Flickering thermal plasma; ignites flammables and ascends.',
  },
  [TYPE_WOOD]: {
    id: TYPE_WOOD,
    name: 'Wood',
    category: 'solids',
    shortRole: 'Cellulose Organic',
    keyBinding: '5',
    color: '#854d0e',
    isGas: false,
    glow: false,
    density: 700,
    pubchemCid: 16211032,
    formula: '(C6H10O5)n',
    description: 'Combustible organic solid, burns down into smoke and ash.',
  },
  [TYPE_OIL]: {
    id: TYPE_OIL,
    name: 'Oil',
    category: 'liquids',
    shortRole: 'Hydrocarbon Fuel',
    keyBinding: '6',
    color: '#6b7280',
    isGas: false,
    glow: false,
    density: 800,
    pubchemCid: 356,
    formula: 'C8H18',
    description: 'Light hydrocarbon liquid that floats on water and burns fiercely.',
  },
  [TYPE_GUNPOWDER]: {
    id: TYPE_GUNPOWDER,
    name: 'Powder',
    category: 'explosives',
    shortRole: 'Granular Explosive',
    keyBinding: '7',
    color: '#a1a1aa',
    isGas: false,
    glow: false,
    density: 1700,
    pubchemCid: 24434,
    formula: 'KNO3+S+C',
    description: 'Deflagrates instantaneously on contact with fire, spark, or lava.',
  },
  [TYPE_LAVA]: {
    id: TYPE_LAVA,
    name: 'Lava',
    category: 'liquids',
    shortRole: 'Molten Magma',
    keyBinding: '4',
    color: '#ef4444',
    isGas: false,
    glow: true,
    density: 2800,
    formula: 'MgFeSiO4',
    description: 'Extreme thermal fluid that melts solids and cools to stone.',
  },
  [TYPE_ACID]: {
    id: TYPE_ACID,
    name: 'Acid',
    category: 'liquids',
    shortRole: 'Corrosive Reagent',
    keyBinding: '8',
    color: '#22c55e',
    isGas: false,
    glow: true,
    density: 1840,
    pubchemCid: 1118,
    formula: 'H2SO4',
    description: 'Dissolves almost all materials, producing sparks and energetic fizz.',
  },
  [TYPE_SMOKE]: {
    id: TYPE_SMOKE,
    name: 'Smoke',
    category: 'gases',
    shortRole: 'Thermal Vapor',
    keyBinding: '',
    color: '#64748b',
    isGas: true,
    glow: false,
    density: -20,
    description: 'Dispersing combustion product that rises into the atmosphere.',
  },
  [TYPE_BIO_SPORE]: {
    id: TYPE_BIO_SPORE,
    name: 'Bio-Spore',
    category: 'bioscience',
    shortRole: 'Proliferating Spore',
    keyBinding: 'B',
    color: '#a855f7',
    isGas: false,
    glow: true,
    density: 1100,
    pubchemCid: 5757,
    formula: 'C10H16N5O13P3',
    description: 'Living biomass that hydrates in water and spreads through organic matter.',
  },
  [TYPE_CRYO_GEL]: {
    id: TYPE_CRYO_GEL,
    name: 'Cryo-Gel',
    category: 'liquids',
    shortRole: 'Endothermic Coolant',
    keyBinding: 'C',
    color: '#06b6d4',
    isGas: false,
    glow: true,
    density: 950,
    formula: 'N2(gel)',
    description: 'Instant coolant gel that quenches lava, freezes water, and snuffs fire.',
  },

  // --- TPT Classics & Ultimata Mod ---
  [TYPE_C4]: {
    id: TYPE_C4,
    name: 'C-4',
    category: 'explosives',
    shortRole: 'Plastic High-Explosive',
    keyBinding: 'X',
    color: '#f43f5e',
    isGas: false,
    glow: false,
    density: 1600,
    pubchemCid: 8455,
    formula: 'RDX(C3H6N6O6)',
    description: 'Stable moldable plastic explosive. Detonates with immense shockwave upon spark or fire.',
  },
  [TYPE_THERMITE]: {
    id: TYPE_THERMITE,
    name: 'Thermite',
    category: 'explosives',
    shortRole: 'Pyrotechnic Fuel',
    keyBinding: 'T',
    color: '#ea580c',
    isGas: false,
    glow: true,
    density: 3500,
    formula: 'Fe2O3+2Al',
    description: 'High-temperature incendiary mixture that melts through stone, metal, and bedrock.',
  },
  [TYPE_PLASMA]: {
    id: TYPE_PLASMA,
    name: 'Plasma',
    category: 'gases',
    shortRole: 'Ionized Gas Field',
    keyBinding: 'Z',
    color: '#8b5cf6',
    isGas: true,
    glow: true,
    density: -100,
    description: 'Superheated ionized gas emitting radiant violet-blue photons and extreme thermal energy.',
  },
  [TYPE_SINGULARITY]: {
    id: TYPE_SINGULARITY,
    name: 'Singularity',
    category: 'nuclear',
    shortRole: 'Gravitational Well',
    keyBinding: 'K',
    color: '#1e1b4b',
    isGas: false,
    glow: true,
    density: 99999,
    description: 'Micro black hole that pulls all adjacent matter inward and collapses it into pure energy.',
  },
  [TYPE_NITROGEN]: {
    id: TYPE_NITROGEN,
    name: 'Liquid Nitrogen',
    category: 'liquids',
    shortRole: 'Cryogenic Liquid',
    keyBinding: 'N',
    color: '#38bdf8',
    isGas: false,
    glow: true,
    density: 808,
    pubchemCid: 947,
    formula: 'N2(liq)',
    description: 'Deep cryogenic fluid (-196°C) that flash-freezes water to ice and shatters solids.',
  },
  [TYPE_DIAMOND]: {
    id: TYPE_DIAMOND,
    name: 'Diamond',
    category: 'solids',
    shortRole: 'Crystal Carbon',
    keyBinding: 'D',
    color: '#bae6fd',
    isGas: false,
    glow: true,
    density: 3510,
    pubchemCid: 5462310,
    formula: 'C(sp3)',
    description: 'Ultimata crystal lattice. Impervious to acid; only destroyed by thermite, antimatter, or plasma.',
  },
  [TYPE_ICE]: {
    id: TYPE_ICE,
    name: 'Ice',
    category: 'solids',
    shortRole: 'Solid Water',
    keyBinding: '',
    color: '#a5f3fc',
    isGas: false,
    glow: false,
    density: 917,
    formula: 'H2O(s)',
    description: 'Solid frozen water. Melts into liquid water when exposed to warmth or fire.',
  },

  // --- Nuclear & Exotic Physics ---
  [TYPE_URANIUM]: {
    id: TYPE_URANIUM,
    name: 'Uranium',
    category: 'nuclear',
    shortRole: 'Fissile Heavy Metal',
    keyBinding: 'U',
    color: '#84cc16',
    isGas: false,
    glow: true,
    density: 19100,
    formula: 'U-235',
    description: 'Radioactive fissile material. Emits spontaneous neutrons and heats under pressure.',
  },
  [TYPE_PLUTONIUM]: {
    id: TYPE_PLUTONIUM,
    name: 'Plutonium',
    category: 'nuclear',
    shortRole: 'Transuranic Reactor Fuel',
    keyBinding: '',
    color: '#65a30d',
    isGas: false,
    glow: true,
    density: 19800,
    formula: 'Pu-239',
    description: 'Extremely volatile nuclear isotope. Triggers exponential chain reaction upon neutron bombardment.',
  },
  [TYPE_DARK_MATTER]: {
    id: TYPE_DARK_MATTER,
    name: 'Dark Matter',
    category: 'nuclear',
    shortRole: 'Non-Baryonic Particle',
    keyBinding: '',
    color: '#312e81',
    isGas: false,
    glow: true,
    density: -500,
    description: 'Exotic matter subject to inverted gravity, repelling normal baryonic particles upward.',
  },
  [TYPE_ANTIMATTER]: {
    id: TYPE_ANTIMATTER,
    name: 'Antimatter',
    category: 'nuclear',
    shortRole: 'CP-Inverted Matter',
    keyBinding: 'A',
    color: '#ec4899',
    isGas: false,
    glow: true,
    density: 2000,
    description: 'Annihilates 1-to-1 against any positive matter on contact, yielding pure gamma burst.',
  },
  [TYPE_NEUTRON]: {
    id: TYPE_NEUTRON,
    name: 'Neutron',
    category: 'nuclear',
    shortRole: 'Neutral Subatomic Ray',
    keyBinding: '',
    color: '#ffffff',
    isGas: true,
    glow: true,
    density: 0,
    description: 'High-speed subatomic particle that penetrates walls and induces fission in heavy metals.',
  },

  // --- Electronics & Circuitry ---
  [TYPE_WIRE]: {
    id: TYPE_WIRE,
    name: 'Metal Wire',
    category: 'electronics',
    shortRole: 'Conductive Trace',
    keyBinding: 'W',
    color: '#94a3b8',
    isGas: false,
    glow: false,
    density: 8900,
    formula: 'Cu',
    description: 'Conducts electrical sparks across 8 directions to build circuits and logic networks.',
  },
  [TYPE_SPARK]: {
    id: TYPE_SPARK,
    name: 'Spark',
    category: 'electronics',
    shortRole: 'Electrical Pulse',
    keyBinding: 'S',
    color: '#fef08a',
    isGas: false,
    glow: true,
    density: 0,
    description: 'Electrical charge that propagates through wires and triggers switches, explosives, and sensors.',
  },
  [TYPE_SWITCH]: {
    id: TYPE_SWITCH,
    name: 'Switch',
    category: 'electronics',
    shortRole: 'Gated Semiconductor',
    keyBinding: '',
    color: '#0284c7',
    isGas: false,
    glow: false,
    density: 4500,
    description: 'Semiconductor junction. Toggles between conducting and insulating states when sparked.',
  },
  [TYPE_SENSOR]: {
    id: TYPE_SENSOR,
    name: 'Sensor',
    category: 'electronics',
    shortRole: 'Proximity Detector',
    keyBinding: '',
    color: '#d97706',
    isGas: false,
    glow: true,
    density: 3000,
    description: 'Proximity detector. Emits a spark into connected wires whenever matter passes nearby.',
  },

  // --- Alchemy Mod Elements ---
  [TYPE_PHILOSOPHER_STONE]: {
    id: TYPE_PHILOSOPHER_STONE,
    name: "Philosopher's Stone",
    category: 'alchemy',
    shortRole: 'Magnum Opus Catalyst',
    keyBinding: 'P',
    color: '#e11d48',
    isGas: false,
    glow: true,
    density: 19300,
    formula: 'Lapis Philosophorum',
    description: 'The supreme alchemical catalyst. Transmutes common base materials into noble matter and pure aether.',
  },
  [TYPE_ELIXIR]: {
    id: TYPE_ELIXIR,
    name: 'Alchemical Elixir',
    category: 'alchemy',
    shortRole: 'Regenerative Aqua Vitae',
    keyBinding: 'E',
    color: '#10b981',
    isGas: false,
    glow: true,
    density: 1050,
    formula: 'Aqua Vitae',
    description: 'Mystical golden-emerald elixir that purifies acid, restores organic spore vitality, and quenches heat.',
  },
  [TYPE_MERCURY]: {
    id: TYPE_MERCURY,
    name: 'Mercury (Quicksilver)',
    category: 'alchemy',
    shortRole: 'Heavy Liquid Metal',
    keyBinding: 'M',
    color: '#cbd5e1',
    isGas: false,
    glow: false,
    density: 13534,
    pubchemCid: 23931,
    formula: 'Hg',
    description: 'Dense liquid metal. Conducts electricity and combines with brimstone under heat to form alchemical salts.',
  },
  [TYPE_BRIMSTONE]: {
    id: TYPE_BRIMSTONE,
    name: 'Brimstone (Sulfur)',
    category: 'alchemy',
    shortRole: 'Alchemical Sulfur',
    keyBinding: '',
    color: '#facc15',
    isGas: false,
    glow: false,
    density: 2070,
    pubchemCid: 22880,
    formula: 'S8',
    description: 'Yellow crystalline sulfur. Combines with water and flame to produce Green Vitriol.',
  },
  [TYPE_VITRIOL]: {
    id: TYPE_VITRIOL,
    name: 'Green Vitriol',
    category: 'alchemy',
    shortRole: 'Alchemical Acid',
    keyBinding: 'V',
    color: '#84cc16',
    isGas: false,
    glow: true,
    density: 1890,
    pubchemCid: 24393,
    formula: 'FeSO4·7H2O',
    description: 'Potent alchemical acid derived from sulfur and moisture. Corrodes metals into flammable vapor.',
  },
  [TYPE_AETHER]: {
    id: TYPE_AETHER,
    name: 'Aether',
    category: 'alchemy',
    shortRole: 'Fifth Element Vapor',
    keyBinding: '',
    color: '#67e8f9',
    isGas: true,
    glow: true,
    density: -300,
    formula: 'Quintessence',
    description: 'Weightless luminous gas. Floats to the top of the chamber, creating auroral photonic shimmer.',
  },
  [TYPE_RFRG]: {
    id: TYPE_RFRG,
    name: 'Refrigerant',
    category: 'thermodynamics',
    shortRole: 'Pressure-Coolant',
    keyBinding: '',
    color: '#06b6d4',
    isGas: false,
    glow: true,
    density: 980,
    description: 'Heats up significantly under positive pressure and cools down under negative pressure.',
  },
  [TYPE_QRTZ]: {
    id: TYPE_QRTZ,
    name: 'Quartz',
    category: 'thermodynamics',
    shortRole: 'Crystalline Mineral',
    keyBinding: '',
    color: '#e2e8f0',
    isGas: false,
    glow: true,
    density: 2650,
    pubchemCid: 462140,
    formula: 'SiO2(c)',
    description: 'Becomes weaker under low pressure but gains structural strength under high pressure.',
  },
  [TYPE_TUNG]: {
    id: TYPE_TUNG,
    name: 'Tungsten',
    category: 'thermodynamics',
    shortRole: 'High-Temp Metal',
    keyBinding: '',
    color: '#475569',
    isGas: false,
    glow: false,
    density: 19300,
    pubchemCid: 23932,
    formula: 'W',
    description: 'Extreme melting point refractory metal. Melts under extreme pressure combined with high temperature.',
  },
  [TYPE_C5]: {
    id: TYPE_C5,
    name: 'C-5 Explosive',
    category: 'explosives',
    shortRole: 'Cold-Triggered Plastic',
    keyBinding: '',
    color: '#fb7185',
    isGas: false,
    glow: false,
    density: 1700,
    description: 'Unique explosive triggered by cold temperatures or cryogenic freezing rather than heat.',
  },
  [TYPE_PSCN]: {
    id: TYPE_PSCN,
    name: 'Positive Conductor',
    category: 'electronics',
    shortRole: 'Positive Logic Gate',
    keyBinding: '',
    color: '#38bdf8',
    isGas: false,
    glow: true,
    density: 8900,
    description: 'Turns active circuits on and continuously transmits positive electrical states.',
  },
  [TYPE_NSCN]: {
    id: TYPE_NSCN,
    name: 'Negative Conductor',
    category: 'electronics',
    shortRole: 'Negative Logic Gate',
    keyBinding: '',
    color: '#f43f5e',
    isGas: false,
    glow: true,
    density: 8900,
    description: 'Turns active circuits off and inverts electrical signal states.',
  },
  [TYPE_ARAY]: {
    id: TYPE_ARAY,
    name: 'Laser Emitter',
    category: 'ray_emitters',
    shortRole: 'Photon Beam Ray',
    keyBinding: '',
    color: '#ef4444',
    isGas: false,
    glow: true,
    density: 5000,
    description: 'When powered by electricity, emits intense directed laser photon beams across the chamber.',
  },
  [TYPE_CRAY]: {
    id: TYPE_CRAY,
    name: 'Replicator Ray',
    category: 'ray_emitters',
    shortRole: 'Matter Replicator',
    keyBinding: '',
    color: '#a855f7',
    isGas: false,
    glow: true,
    density: 5000,
    description: 'When powered by electricity, replicates and projects lines of particles forward.',
  },
  [TYPE_DRAY]: {
    id: TYPE_DRAY,
    name: 'Destructive Ray',
    category: 'ray_emitters',
    shortRole: 'Annihilation Beam',
    keyBinding: '',
    color: '#10b981',
    isGas: false,
    glow: true,
    density: 5000,
    description: 'When powered by electricity, shoots a destructive ray that disintegrates matter on contact.',
  },
  [TYPE_MIRROR]: {
    id: TYPE_MIRROR,
    name: 'Optical Mirror',
    category: 'optics',
    shortRole: 'Reflective Barrier',
    keyBinding: '',
    color: '#e2e8f0',
    isGas: false,
    glow: true,
    density: 9999,
    description: 'Reflects laser beams and photon rays at precise 45-degree angles.',
  },
  [TYPE_LENS]: {
    id: TYPE_LENS,
    name: 'Glass Lens',
    category: 'optics',
    shortRole: 'Optical Refractor',
    keyBinding: '',
    color: '#a5f3fc',
    isGas: false,
    glow: true,
    density: 2500,
    pubchemCid: 10112,
    formula: 'SiO2(glass)',
    description: 'Refracts and concentrates light rays passing through its curved optical medium.',
  },
  [TYPE_CREATURE]: {
    id: TYPE_CREATURE,
    name: 'Amoeba Lifeform',
    category: 'biology',
    shortRole: 'Autonomous Organism',
    keyBinding: '',
    color: '#22c55e',
    isGas: false,
    glow: true,
    density: 1050,
    description: 'Autonomous biological micro-creature that crawls along walls, consumes bio-spores, and reproduces.',
  },
  [TYPE_WIND]: {
    id: TYPE_WIND,
    name: 'Dynamic Wind',
    category: 'thermodynamics',
    shortRole: 'Atmospheric Coolant Flow',
    keyBinding: '',
    color: '#67e8f9',
    isGas: true,
    glow: true,
    density: -80,
    description: 'Dynamic airflow current that rapidly cools hot lava into stone, snuffs fire, condenses steam into water, and propels powders.',
  },
  [TYPE_HEAT]: {
    id: TYPE_HEAT,
    name: 'Thermal Heat',
    category: 'thermodynamics',
    shortRole: 'Caloric Energy Beam',
    keyBinding: '',
    color: '#f97316',
    isGas: true,
    glow: true,
    density: -90,
    description: 'Intense thermal flux that rapidly melts solids, boils water into steam, and triggers pyrotechnic deflagration.',
  },
  [TYPE_COOL]: {
    id: TYPE_COOL,
    name: 'Cryo-Cool',
    category: 'thermodynamics',
    shortRole: 'Endothermic Chill',
    keyBinding: '',
    color: '#38bdf8',
    isGas: true,
    glow: true,
    density: -40,
    description: 'Sub-zero chill current that quenches lava, freezes liquids, snuffs flames, and detonates cold-sensitive C-5.',
  },
};

// Base Colors (RGBA in Little-Endian format: 0xAABBGGRR)
export const PALETTE: Record<number, number[]> = {
  [TYPE_WALL]: [0xff52453a, 0xff5e5043, 0xff473c33],
  [TYPE_SAND]: [0xff2db4e8, 0xff35c2fa, 0xff24a3d4, 0xff42cefd],
  [TYPE_WATER]: [0xffd47b1e, 0xffe2892b, 0xffc46f14],
  [TYPE_FIRE]: [0xff1055f7, 0xff157cfc, 0xff25adff, 0xff1035db],
  [TYPE_WOOD]: [0xff1c3559, 0xff1e3c63, 0xff182c47],
  [TYPE_OIL]: [0xff363c47, 0xff2d313b, 0xff414957],
  [TYPE_GUNPOWDER]: [0xff6b7280, 0xff5b616d, 0xff7b8291],
  [TYPE_LAVA]: [0xff1c45f5, 0xff1363fa, 0xff2085ff],
  [TYPE_ACID]: [0xff46e632, 0xff36cf24, 0xff5ffc4b],
  [TYPE_SMOKE]: [0x444b5563, 0x336b7280, 0x22374151],
  [TYPE_BIO_SPORE]: [0xfff755a8, 0xffea3393, 0xffff79c6],
  [TYPE_CRYO_GEL]: [0xffd4b606, 0xffe8cb15, 0xffb89b04],

  // Ultimata & Classics
  [TYPE_C4]: [0xff5e3ff4, 0xff714ff6, 0xff472be8],
  [TYPE_THERMITE]: [0xff0c58ea, 0xff176efc, 0xff0540b8],
  [TYPE_PLASMA]: [0xfff65c8b, 0xffff73a8, 0xffd9426f],
  [TYPE_SINGULARITY]: [0xff4b1b1e, 0xff311013, 0xff662429],
  [TYPE_NITROGEN]: [0xfff8bd38, 0xfffacd62, 0xffe0a820],
  [TYPE_DIAMOND]: [0xfffde6ba, 0xffffffff, 0xffe0f2fe],
  [TYPE_ICE]: [0xfffcf3a5, 0xffe0f7fe, 0xffc7f0fb],

  // Nuclear & Exotic
  [TYPE_URANIUM]: [0xff16cc84, 0xff25df95, 0xff0fa86b],
  [TYPE_PLUTONIUM]: [0xff0da365, 0xff15bc75, 0xff098450],
  [TYPE_DARK_MATTER]: [0xff812e31, 0xff6b2124, 0xff993d40],
  [TYPE_ANTIMATTER]: [0xff9948ec, 0xffaf5dfc, 0xff7e32d1],
  [TYPE_NEUTRON]: [0xffffffff, 0xfff1f5f9, 0xffe2e8f0],

  // Electronics
  [TYPE_WIRE]: [0xffb8a394, 0xffcbd5e1, 0xff94a3b8],
  [TYPE_SPARK]: [0xff8af0fe, 0xffffffff, 0xfffde047],
  [TYPE_SWITCH]: [0xffc78402, 0xff0284c7, 0xff0369a1],
  [TYPE_SENSOR]: [0xff0677d9, 0xffb45309, 0xfff59e0b],

  // Alchemy
  [TYPE_PHILOSOPHER_STONE]: [0xff481de1, 0xff5e28f0, 0xff3412b8],
  [TYPE_ELIXIR]: [0xff81b910, 0xff9fe024, 0xff6ba008],
  [TYPE_MERCURY]: [0xffe1d5cb, 0xfff1f5f9, 0xffcbd5e1],
  [TYPE_BRIMSTONE]: [0xff15ccfa, 0xff22dcfc, 0xff08b0dc],
  [TYPE_VITRIOL]: [0xff16cc84, 0xff36e09e, 0xff0fb06e],
  [TYPE_AETHER]: [0xfff9e867, 0xfffef08a, 0xff67e8f9],

  // Thermodynamics & Ray Emitters
  [TYPE_RFRG]: [0xffd4b606, 0xffe8cb15, 0xffb89b04],
  [TYPE_QRTZ]: [0xfff0e8e2, 0xffffffff, 0xffcbd5e1],
  [TYPE_TUNG]: [0xff475569, 0xff334155, 0xff64748b],
  [TYPE_C5]: [0xff8571fb, 0xff9fa8ff, 0xff6b4fe8],
  [TYPE_PSCN]: [0xfff8bd38, 0xfffacd62, 0xffe0a820],
  [TYPE_NSCN]: [0xff5e3ff4, 0xff714ff6, 0xff472be8],
  [TYPE_ARAY]: [0xff4444ef, 0xff6b6bfc, 0xff2525db],
  [TYPE_CRAY]: [0xfff755a8, 0xffff79c6, 0xffea3393],
  [TYPE_DRAY]: [0xff81b910, 0xff9fe024, 0xff6ba008],

  // Sand:box Optics & Life
  [TYPE_MIRROR]: [0xfff0e8f2, 0xffffffff, 0xffcbd5e1],
  [TYPE_LENS]: [0xfffcf3a5, 0xffe0f7fe, 0xffc7f0fb],
  [TYPE_CREATURE]: [0xff36e055, 0xff22c544, 0xff4ade80],

  // Environmental Tools & Wind
  [TYPE_WIND]: [0xfff9e867, 0xffa5f3fc, 0xffe0f7fe],
  [TYPE_HEAT]: [0xff1055f7, 0xff157cfc, 0xff25adff],
  [TYPE_COOL]: [0xfff8bd38, 0xffe0f7fe, 0xffbae6fd],
};

export interface SparkParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface HazardEntity {
  id: number;
  archetype: 'pyro_mite' | 'cryo_wisp' | 'acid_leech';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  windupTimer: number;
  attackCooldown: number;
  koTimer: number;
}

export interface BasketItem {
  id: string;
  name: string;
  elementType: ElementType;
  elementName: string;
  brushRadius: number;
  quantity: number;
  cid?: number;
  formula?: string;
  molecularWeight?: number;
  xlogp?: number;
  tpsa?: number;
  lipinskiPass?: boolean;
  notes: string;
  addedAt: string;
}

export interface CustomReportSnapshot {
  id: string;
  title: string;
  timestamp: string;
  version: string;
  fps: number;
  totalParticles: number;
  shannonEntropy: number;
  exothermicIndex: number;
  containmentIntegrity: number;
  reactionScore: number;
  elementCounts: Record<string, number>;
  basketCount: number;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
}

export const VERSION_HISTORY: ChangelogEntry[] = [
  {
    version: 'v2.3.0',
    date: '2026-11-05',
    title: 'Fast-Forward 3x Simulation, Reset Control, Unified Top HUD & Accurate Inspector Hotkey [I]',
    highlights: [
      'Fast-Forward 3x Simulation: Added a 3x Fast-Forward toggle in the top-left telemetry control cluster that accelerates simulation ticks for rapid chain-reaction and thermal state testing.',
      'Simulation Reset Control: Added a 1-click Reset button in the top HUD that clears the simulation grid and resets all counters instantly.',
      'Reorganized Compact Top HUD: Streamlined all top telemetry chips, playback controls (Pause, Fast-Forward, Reset), zoom controls, and drawing tools into a clean, zero-clutter floating top header.',
      'Accurate Property Inspector & Hotkeys: Mapped hotkey [I] for the Pixel Inspector and [Q] for the Live Eyedropper, ensuring pinpoint cellular property accuracy.',
      'Interactive Element Interaction Matrix: Built a robust discovery grid tab in the Guide & Reporting drawer detailing pairwise element reactions, phase triggers, and alchemical synthesis equations.',
      'Updated Operator Manual: Comprehensive updates to "How to Use Custom Reporting & Basket Curation" documenting telemetry snapshots, basket injections, and simulation playback controls.',
    ],
  },
  {
    version: 'v2.2.0',
    date: '2026-11-05',
    title: 'Pure Powder Toy Physics & Professional Drawing Suite',
    highlights: [
      'Excised Non-Powder Toy Mechanics: Removed Sandustry industrial automation (Conveyor Belts, Pipe Ducts, Particle Sorters) and People Playground entities (Ragdolls, Bones, Flesh, Blood, Syringes, Tesla Coils, Shockwaves, Disintegrators) per design brief.',
      '100% Authentic Powder Toy Elements: Preserved the full authentic Powder Toy ecosystem spanning Core solids/liquids/gases, TPT Ultimata high-explosives (C-4, Thermite, Plasma, Singularity, LN2, Diamond), Nuclear fission, Electronics, Alchemy, and Thermodynamics.',
      'Powder Toy Geometric Drawing Modes: Preserved the complete geometric drawing tool suite (Straight Line Bresenham rasterizer, Box/Rectangle, Circle Outline, Flood Fill Bucket, and Live Eyedropper element picker) on the top canvas toolbar.',
      'Environmental Physics Modifiers: Preserved Air Velocity Force Vector brush, Precision Temperature Gun (+/-50°C), Point Gravity Well Attractor, and Real-Time Pixel Property & Life Inspector HUD.',
      'Cleaned Category Hierarchy: Consolidated element drawer into standard Powder Toy categories with zero clutter and optimal performance.',
      'Updated Operator Manual: Revised "How to Use Custom Reporting & Basket Curation" to document the v2.2.0 drawing suite, thermal guns, and pure cellular physics.',
    ],
  },
  {
    version: 'v2.1.0',
    date: '2026-11-05',
    title: 'Powder Toy Drawing Suite, Environmental Modifiers & People Playground Physics',
    highlights: [
      'Powder Toy Geometric Drawing Modes: Added Straight Line (Bresenham rasterizer), Filled Box / Rectangle, Circle Outline, Flood Fill Bucket, and Live Eyedropper element picker directly on the canvas toolbar.',
      'Environmental Physics Modifiers: Added Air Velocity Force Vector brush, Precision Temperature Gun (Heating/Cooling), Point Gravity Well Attractor, and Real-Time Pixel Property & Life Inspector HUD.',
      'People Playground Physics & Entities: Added living Ragdoll Humanoid Spawner (skull, spine, ribs, arterial blood, flesh), Skeletal Bone Electrical Conduction, Arterial Blood Physics, Chemical Syringes (Life Serum & Death Serum), High-Voltage Tesla Coils, Kinetic Shockwave Blasters, and Disintegration Rays.',
      'Dedicated Playground Category: Added new "People Playground" category to the Element Drawer and Unified Side Dock.',
      'Top Canvas Toolbar Integration: Unified tool selection (10 drawing modes and physics modifiers), brush radius steppers, and viewport zoom controls directly above the simulation stage.',
      'Expanded Operator Manual: Comprehensive guide added to "How to Use Custom Reporting & Basket Curation" for geometric drafting, environmental physics calibration, and ragdoll experiments.',
    ],
  },
  {
    version: 'v2.0.0',
    date: '2026-11-05',
    title: 'Sandustry Industrial Automation & Automated Logistics Engine',
    highlights: [
      'Sandustry Conveyor Belts: Added Leftbound and Rightbound Conveyor tracks (TYPE_CONVEYOR_LEFT, TYPE_CONVEYOR_RIGHT) that autonomously transport granular powders, items, and sediments across production lines.',
      'Pipe Ducts: Added industrial hollow conduits (TYPE_PIPE) that channel pressurized fluids (water, oil, acid) and gases (smoke, steam) through pipe networks from entry to exit without leakage.',
      'Particle Sorters: Added phase-filtering sieves (TYPE_SORTER) that allow liquids and gases to drain straight through vertically while diverting solid granular particulates to lateral output shoots.',
      'Dedicated Industry Category: Added new "Industry" category to both the minimizable top Element Drawer and the Unified Side Dock.',
      'Updated Operator Manual: Comprehensive guide added to "How to Use Custom Reporting & Basket Curation" detailing automation layouts, fluid pumping, and sorting loops.',
    ],
  },
  {
    version: 'v1.9.0',
    date: '2026-11-05',
    title: 'Minimizable Element Drawer, Proximity Thermodynamics & Dynamic Wind Cooling',
    highlights: [
      'Minimizable Element Drawer: The top element drawer now features a full minimization toggle, collapsing smoothly into a compact floating icon badge with CSS transform animations to maximize canvas viewport.',
      'Proximity-Based Water Boiling: Water in proximity (radius 1–3 cells) to Fire, Lava, Plasma, Thermite, or Heat Tool rapidly boils and vaporizes into rising steam clouds.',
      'Proximity-Based Melting: Solids and metals (Ice, Wire, Metals, Quartz) melt dynamically into liquid water or molten lava depending on thermal proximity.',
      'Dynamic Wind Cooling: Wind currents (WIND) actively chill and solidify molten lava into stone bedrock, extinguish flames into smoke, and condense steam into water droplets.',
      'Environmental Thermodynamic Tools: Added Dynamic Wind, Thermal Heat, and Cryo-Cool brushes under the Thermodynamics category.',
    ],
  },
  {
    version: 'v1.8.0',
    date: '2026-11-04',
    title: 'Dynamic Resizable Play Area, Unified Side Dock & Compact 3D Reactor Widget',
    highlights: [
      'Interactive Canvas Drag Resizing: Drag handles on canvas edges (E, S) and corner (SE) allow continuous sizing between 160x100 and 420x260 pixels with boundary clamping.',
      'Quick-Size Resolution Presets: Instant switching between Compact (200x120), Standard (260x160), Expanded (320x200), Cinematic Max (380x240), and Fit Window auto-scale.',
      'State-Preserving Resizer: Resizing preserves all active particles, chemical reactions, circuits, and vessels in-place by dynamically centering matter and re-establishing bedrock containment.',
      'Unified Collapsible Side Dock: Replaced bottom drawer and scattered HUD buttons with a 1-click collapsible side console (icon strip or full parameter drawer) featuring element matrices, brush controls, simulation speeds, and basket dispatch.',
      'Compact 3D Reactor Corner Widget: Transformed the bulky PiP into an unobtrusive 120x120px corner orb displaying live PBR reactor vessel telemetry, with a 1-click modal expander for full 360° orbital inspection.',
      'Zero-Pill Minimalist Telemetry Ribbon: Clean unboxed monospace telemetry chips displaying active mode, particle counts, reaction score, Shannon entropy, exothermic index, and FPS.',
      'Expanded Operator Manual in "How to Use Custom Reporting & Basket Curation" detailing dynamic canvas geometry, dock workflows, and 3D modal controls.',
    ],
  },
  {
    version: 'v1.7.0',
    date: '2026-11-04',
    title: 'Comprehensive Element Interaction Review, Phase Consistency & Reaction Matrix',
    highlights: [
      'Comprehensive interaction review: fixed missing interactions across all 35 cellular automata elements for complete Powder Toy and mod fidelity.',
      'Wood Flammability & Structure: Added dedicated active wood simulation branch; catches fire from flames, lava, sparks, thermite, and plasma, and dissolves in vitriol/acid.',
      'Authentic Oil Buoyancy: Oil now actively rises and bubbles through water (density 800 vs 1000 kg/m³) to form surface slicks.',
      'Thermite & Plasma Incendiary Boring: Thermite and Plasma actively burn and bore through Stone (Wall) barriers into lava, recreating the signature TPT cutting mechanic.',
      'Plasma Ionization: Plasma induces electrical sparks along adjacent wire tracks.',
      'Fire Smothering & Cryo Quench: Pouring sand onto flames smothers them into smoke; Ice and Liquid Nitrogen immediately quench fire into steam.',
      'Cryogenic Quicksilver Solidification: Liquid Nitrogen (-196°C) freezes liquid Mercury (-38.8°C melting point) into solid metallic silver stone.',
      'Electrical Spark Safety: Fixed conductor conversion bug so sparking water or conductive solutions shock adjacent circuits without permanently transmuting the fluid into metal wire.',
      'Sulfur Combustion: Brimstone (Sulfur) exposed to flame or spark without water/mercury burns with a blue/yellow flame and produces pungent sulfuric smoke.',
      'Philosopher\'s Stone Neutralization: Transmutes unstable high explosives (C-4, Gunpowder) and corrosive acids into inert diamonds and clean water.',
      'Neutron High Explosive Induction: Fast neutrons induce detonation upon impacting C-4 and Gunpowder.',
      'Full documentation and reaction matrix added to "How to Use Custom Reporting & Basket Curation".',
    ],
  },
  {
    version: 'v1.6.0',
    date: '2026-11-04',
    title: 'Complete Element Interaction Physics Engine Overhaul & Operator Matrix',
    highlights: [
      'Comprehensive physics overhaul: implemented dedicated simulation branches for all 35 elements across core, Ultimata, and Alchemy mods.',
      'Thermal Phase Transitions: Ice melts to water on contact with fire, lava, plasma, or thermite; Water flash-freezes with Liquid Nitrogen and Cryo-Gel, and boils into steam (smoke) on extreme heat.',
      'Corrosives & Solvents: Acid and Green Vitriol actively dissolve wood, sand, wire, and bedrock into fizzing gases; impervious Diamond withstands all acids.',
      'Nuclear Fission & Ray Ballistics: Neutrons exhibit multi-directional flight and moderation in water; Uranium and Plutonium feature spontaneous neutron decay and critical runaway chain-reaction fission.',
      'Alchemy Magnum Opus: Mercury conducts electricity, boils into celestial Aether under heat, and crystallizes into the Philosopher\'s Stone when fused with Brimstone (Sulfur) under thermal plasma.',
      'Electronics Logic: Semiconductor Switch toggles conducting/insulating state on spark pulse; Proximity Sensors trigger connected circuitry.',
      'Gravitational Accretion: Micro Singularity exerts radial pull on surrounding matter, devouring matter and discharging relativistic gamma bursts.',
      'Expanded "How to Use Custom Reporting & Basket Curation" operator manual with complete interaction reference tables and reaction formulas.',
    ],
  },
  {
    version: 'v1.5.0',
    date: '2026-11-04',
    title: 'TPT Ultimata & Alchemy Mod Expansion + Sandbox Free Play',
    highlights: [
      'Added full Sandbox Free Play as default mode with optional Reactor Challenge Mode toggle.',
      'Added 22 new elements from The Powder Toy Ultimata and Alchemy Mods (C-4, Thermite, Plasma, Singularity, Nitrogen, Diamond, Ice, Uranium, Plutonium, Dark Matter, Antimatter, Neutrons, Wire, Spark, Switch, Sensor, Philosopher Stone, Elixir, Mercury, Brimstone, Vitriol, Aether).',
      'Implemented full electronics logic simulation (wire conduction, semiconductor switches, proximity sensors).',
      'Implemented alchemical transmutations (Philosopher Stone transmutation, Brimstone + Water -> Vitriol synthesis, Mercury vaporization).',
      'Redesigned bottom control deck into a categorized element drawer with search filtering, category badges, and quick-keys.',
      'Updated "How to Use Custom Reporting & Basket Curation" operator manual with Free Play, Alchemy recipes, and Circuitry guides.',
    ],
  },
  {
    version: 'v1.4.0',
    date: '2026-11-04',
    title: 'Custom Reporting, Reagent Basket Curation & 3D Reactor Vessel',
    highlights: [
      'Added Custom Reporting & Basket Curation Workbench with Shannon Entropy, Exothermic Index, and CSV/JSON export.',
      'Integrated Three.js 3D Volumetric Reactor Chamber with composite 8-part containment vessel, RoomEnvironment PBR lighting, and software-WebGL pacing.',
      'Connected live PubChem PUG REST & ChEMBL bioscience reagent lookup with Lipinski Rule-of-Five and Veber bioavailability evaluation.',
      'Added comprehensive in-app documentation for "How to Use Custom Reporting & Basket Curation".',
    ],
  },
  {
    version: 'v1.3.0',
    date: '2026-10-28',
    title: 'Bio-Spore, Cryo-Gel & Autonomous Reactor Anomalies',
    highlights: [
      'Introduced Bio-Spore (hydrating organic biomass) and Cryo-Gel (endothermic lava/fire quencher) elements.',
      'Added 3 autonomous reactor anomaly archetypes (Pyro-Mite, Cryo-Wisp, Acid-Leech) with visible windup telegraphs and hitstop.',
    ],
  },
  {
    version: 'v1.2.0',
    date: '2026-10-15',
    title: 'Dual-Pass Bloom Shaders & Sub-Pixel Vector Sparks',
    highlights: [
      'Implemented offscreen emissive glow extraction with dual-pass screen blur (6px + 2px) for Fire, Lava, and Acid.',
      'Added pooled zero-GC vector spark emitter with gravitational curves and alpha dissipation.',
    ],
  },
  {
    version: 'v1.1.0',
    date: '2026-10-02',
    title: 'Volumetric Normal Highlights & Ambient Occlusion',
    highlights: [
      'Added real-time 4-neighbor normal evaluation for top-left crest highlights (+45 RGB) and bottom-right cavity shadows (-35 RGB).',
      'Added dynamic sine-wave translucency and surface tension shimmer to Water and Oil.',
    ],
  },
  {
    version: 'v1.0.0',
    date: '2026-09-18',
    title: 'Initial Quantum Powder Cellular Automata Engine',
    highlights: [
      'Core 260x160 cellular automata physics grid with bottom-up randomized horizontal sweeps.',
      'Implemented Sand, Water, Fire, Lava, Wood, Oil, Gunpowder, Acid, Smoke, and Stone.',
    ],
  },
];
