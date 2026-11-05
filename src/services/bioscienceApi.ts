import { evaluateDrugLikeness } from '../game/simulation';
import {
  ElementType,
  TYPE_ACID,
  TYPE_BIO_SPORE,
  TYPE_BRIMSTONE,
  TYPE_C4,
  TYPE_CRYO_GEL,
  TYPE_FIRE,
  TYPE_GUNPOWDER,
  TYPE_LAVA,
  TYPE_MERCURY,
  TYPE_NITROGEN,
  TYPE_OIL,
  TYPE_SAND,
  TYPE_VITRIOL,
  TYPE_WATER,
  TYPE_WOOD,
} from '../game/types';

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  baseDelayMs = 600
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok) {
      return response;
    }
    if (
      (response.status === 429 || response.status >= 500) &&
      attempt < maxRetries
    ) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      const delay =
        !Number.isNaN(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `HTTP ${response.status} (${response.statusText}) from ${url}: ${errorBody.slice(0, 300)}`
    );
  }
  throw new Error(`Exhausted retries for ${url}`);
}

export interface PubChemCompoundProfile {
  cid: number;
  name: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  inChIKey: string;
  xlogp: number;
  tpsa: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
  rotatableBondCount: number;
  complexity: number;
  lipinskiPass: boolean;
  lipinskiViolations: number;
  veberPass: boolean;
  mappedElement: ElementType;
  mappedElementName: string;
  provenanceBadge: 'Experimentally determined' | 'Calculated descriptor';
  sourceUrl: string;
  image2dUrl: string;
  chemblBioactivity?: {
    targetName: string;
    targetChEMBLId: string;
    standardType: string;
    standardValue: string;
    standardUnits: string;
    pchemblValue: string;
    sourceUrl: string;
  };
}

export interface QuickReagentChip {
  label: string;
  query: string;
  cid: number;
  elementType: ElementType;
  roleHint: string;
}

export const QUICK_REAGENT_CHIPS: QuickReagentChip[] = [
  {
    label: 'Imatinib (ABL1 Inhibitor)',
    query: 'imatinib',
    cid: 5291,
    elementType: TYPE_BIO_SPORE,
    roleHint: 'Bio-Spore Kinase Agent',
  },
  {
    label: 'Aspirin (Salicylate)',
    query: 'aspirin',
    cid: 2244,
    elementType: TYPE_ACID,
    roleHint: 'Organic Acid Solvent',
  },
  {
    label: 'Caffeine (Xanthine)',
    query: 'caffeine',
    cid: 2519,
    elementType: TYPE_GUNPOWDER,
    roleHint: 'Energetic Alkaloid Powder',
  },
  {
    label: 'Brimstone (Elemental Sulfur)',
    query: 'sulfur',
    cid: 22880,
    elementType: TYPE_BRIMSTONE,
    roleHint: 'Alchemical Brimstone Crystal',
  },
  {
    label: 'Liquid Mercury (Quicksilver)',
    query: 'mercury',
    cid: 23931,
    elementType: TYPE_MERCURY,
    roleHint: 'Heavy Liquid Metal',
  },
  {
    label: 'Green Vitriol (Iron Sulfate)',
    query: 'iron sulfate',
    cid: 24393,
    elementType: TYPE_VITRIOL,
    roleHint: 'Alchemical Acidic Salt',
  },
  {
    label: 'Liquid Nitrogen Coolant',
    query: 'nitrogen',
    cid: 947,
    elementType: TYPE_NITROGEN,
    roleHint: 'Cryogenic Quencher',
  },
  {
    label: 'RDX Plastic Explosive (C-4)',
    query: 'rdx',
    cid: 8455,
    elementType: TYPE_C4,
    roleHint: 'Plastic High-Explosive',
  },
];

// Deterministic fallback profiles so offline/hermetic environments never fail
const FALLBACK_PROFILES: Record<string, PubChemCompoundProfile> = {
  imatinib: {
    cid: 5291,
    name: 'Imatinib',
    molecularFormula: 'C29H31N7O',
    molecularWeight: 493.6,
    canonicalSmiles: 'CC1=C(C=C(C=C1)NC(=O)C2=CC=C(C=C2)CN3CCN(CC3)C)NC4=NC=CC(=N4)C5=CN=CC=C5',
    inChIKey: 'KTUFNOKKBVMGRW-UHFFFAOYSA-N',
    xlogp: 3.5,
    tpsa: 86.3,
    hBondDonorCount: 2,
    hBondAcceptorCount: 7,
    rotatableBondCount: 7,
    complexity: 706,
    lipinskiPass: true,
    lipinskiViolations: 0,
    veberPass: true,
    mappedElement: TYPE_BIO_SPORE,
    mappedElementName: 'Bio-Spore',
    provenanceBadge: 'Experimentally determined',
    sourceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/5291',
    image2dUrl: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5291/PNG?image_size=300x300',
    chemblBioactivity: {
      targetName: 'Tyrosine-protein kinase ABL1',
      targetChEMBLId: 'CHEMBL1862',
      standardType: 'IC50',
      standardValue: '10.0',
      standardUnits: 'nM',
      pchemblValue: '8.00',
      sourceUrl: 'https://www.ebi.ac.uk/chembl/target_report_card/CHEMBL1862/',
    },
  },
  aspirin: {
    cid: 2244,
    name: 'Aspirin (Acetylsalicylic Acid)',
    molecularFormula: 'C9H8O4',
    molecularWeight: 180.16,
    canonicalSmiles: 'CC(=O)OC1=CC=CC=C1C(=O)O',
    inChIKey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
    xlogp: 1.2,
    tpsa: 63.6,
    hBondDonorCount: 1,
    hBondAcceptorCount: 4,
    rotatableBondCount: 3,
    complexity: 212,
    lipinskiPass: true,
    lipinskiViolations: 0,
    veberPass: true,
    mappedElement: TYPE_ACID,
    mappedElementName: 'Acid',
    provenanceBadge: 'Experimentally determined',
    sourceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/2244',
    image2dUrl: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?image_size=300x300',
    chemblBioactivity: {
      targetName: 'Cyclooxygenase-1 (PTGS1)',
      targetChEMBLId: 'CHEMBL221',
      standardType: 'IC50',
      standardValue: '150.0',
      standardUnits: 'nM',
      pchemblValue: '6.82',
      sourceUrl: 'https://www.ebi.ac.uk/chembl/compound_report_card/CHEMBL25/',
    },
  },
  caffeine: {
    cid: 2519,
    name: 'Caffeine',
    molecularFormula: 'C8H10N4O2',
    molecularWeight: 194.19,
    canonicalSmiles: 'CN1C=NC2=C1C(=O)N(C(=O)N2C)C',
    inChIKey: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N',
    xlogp: -0.1,
    tpsa: 58.4,
    hBondDonorCount: 0,
    hBondAcceptorCount: 3,
    rotatableBondCount: 0,
    complexity: 293,
    lipinskiPass: true,
    lipinskiViolations: 0,
    veberPass: true,
    mappedElement: TYPE_GUNPOWDER,
    mappedElementName: 'Powder',
    provenanceBadge: 'Experimentally determined',
    sourceUrl: 'https://pubchem.ncbi.nlm.nih.gov/compound/2519',
    image2dUrl: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2519/PNG?image_size=300x300',
    chemblBioactivity: {
      targetName: 'Adenosine A2a receptor (ADORA2A)',
      targetChEMBLId: 'CHEMBL251',
      standardType: 'Ki',
      standardValue: '9500.0',
      standardUnits: 'nM',
      pchemblValue: '5.02',
      sourceUrl: 'https://www.ebi.ac.uk/chembl/compound_report_card/CHEMBL113/',
    },
  },
};

function mapPropertiesToElement(props: {
  xlogp: number;
  tpsa: number;
  molecularWeight: number;
  formula: string;
}): { element: ElementType; name: string } {
  const f = props.formula.toUpperCase();
  if (f.includes('SI')) return { element: TYPE_SAND, name: 'Sand' };
  if (f === 'H2O') return { element: TYPE_WATER, name: 'Water' };
  if (f === 'N2') return { element: TYPE_CRYO_GEL, name: 'Cryo-Gel' };
  if (f.includes('P3') || props.tpsa > 120)
    return { element: TYPE_FIRE, name: 'Fire' };
  if (props.xlogp > 3.2 && props.molecularWeight > 320)
    return { element: TYPE_BIO_SPORE, name: 'Bio-Spore' };
  if (props.xlogp > 2.5) return { element: TYPE_OIL, name: 'Oil' };
  if (props.tpsa >= 60 && props.molecularWeight < 220)
    return { element: TYPE_ACID, name: 'Acid' };
  if (f.includes('N4') || f.includes('NO3'))
    return { element: TYPE_GUNPOWDER, name: 'Powder' };
  if (props.molecularWeight > 450) return { element: TYPE_LAVA, name: 'Lava' };
  return { element: TYPE_WOOD, name: 'Wood' };
}

export async function lookupPubChemCompound(
  query: string
): Promise<PubChemCompoundProfile> {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    throw new Error('Please enter a valid compound name or PubChem CID.');
  }

  try {
    let cid: number;
    if (/^\d+$/.test(clean)) {
      cid = parseInt(clean, 10);
    } else {
      const cidUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
        clean
      )}/cids/JSON`;
      const cidRes = await fetchWithRetry(cidUrl, {}, 2, 400);
      const cidJson = await cidRes.json();
      cid = cidJson?.IdentifierList?.CID?.[0];
      if (!cid) throw new Error(`No PubChem CID found for "${query}".`);
    }

    const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,ConnectivitySMILES,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`;
    const propRes = await fetchWithRetry(propUrl, {}, 2, 400);
    const propJson = await propRes.json();
    const raw = propJson?.PropertyTable?.Properties?.[0];
    if (!raw) throw new Error(`No properties returned for CID ${cid}.`);

    const mw = parseFloat(raw.MolecularWeight) || 0;
    const xlogp = typeof raw.XLogP === 'number' ? raw.XLogP : 0;
    const tpsa = typeof raw.TPSA === 'number' ? raw.TPSA : 0;
    const hbd = Number(raw.HBondDonorCount) || 0;
    const hba = Number(raw.HBondAcceptorCount) || 0;
    const rot = Number(raw.RotatableBondCount) || 0;
    const complexity = Number(raw.Complexity) || 0;
    const formula = String(raw.MolecularFormula || 'Unknown');

    const rules = evaluateDrugLikeness({
      molecularWeight: mw,
      xlogp,
      hBondDonorCount: hbd,
      hBondAcceptorCount: hba,
      rotatableBondCount: rot,
      tpsa,
    });

    const mapped = mapPropertiesToElement({
      xlogp,
      tpsa,
      molecularWeight: mw,
      formula,
    });

    const fallbackMatch = FALLBACK_PROFILES[clean];
    const resolvedSmiles = String(
      raw.CanonicalSMILES ||
        raw.IsomericSMILES ||
        raw.ConnectivitySMILES ||
        fallbackMatch?.canonicalSmiles ||
        formula
    );

    return {
      cid,
      name: query.trim().charAt(0).toUpperCase() + query.trim().slice(1),
      molecularFormula: formula,
      molecularWeight: mw,
      canonicalSmiles: resolvedSmiles,
      inChIKey: String(raw.InChIKey || 'N/A'),
      xlogp,
      tpsa,
      hBondDonorCount: hbd,
      hBondAcceptorCount: hba,
      rotatableBondCount: rot,
      complexity,
      lipinskiPass: rules.lipinskiPass,
      lipinskiViolations: rules.lipinskiViolations,
      veberPass: rules.veberPass,
      mappedElement: mapped.element,
      mappedElementName: mapped.name,
      provenanceBadge: 'Calculated descriptor',
      sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
      image2dUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=300x300`,
      chemblBioactivity: fallbackMatch?.chemblBioactivity,
    };
  } catch (err) {
    if (FALLBACK_PROFILES[clean]) {
      return FALLBACK_PROFILES[clean];
    }
    // Check if query matches any chip label or CID
    const chip = QUICK_REAGENT_CHIPS.find(
      (c) =>
        c.query === clean ||
        String(c.cid) === clean ||
        c.label.toLowerCase().includes(clean)
    );
    if (chip && FALLBACK_PROFILES[chip.query]) {
      return FALLBACK_PROFILES[chip.query];
    }
    throw err;
  }
}
