import React, { useEffect, useState } from 'react';
import {
  APP_VERSION,
  BasketItem,
  CustomReportSnapshot,
  ELEMENT_INTERACTIONS,
  ELEMENTS,
  ElementType,
  VERSION_HISTORY,
} from '../game/types';
import { formatReportAsCSV } from '../game/simulation';
import {
  lookupPubChemCompound,
  PubChemCompoundProfile,
  QUICK_REAGENT_CHIPS,
} from '../services/bioscienceApi';

export type WorkbenchTab = 'bioscience' | 'reporting' | 'guide';

interface BioscienceReportingDrawerProps {
  isOpen: boolean;
  activeTab: WorkbenchTab;
  onTabChange: (tab: WorkbenchTab) => void;
  onClose: () => void;
  basket: BasketItem[];
  onAddToBasket: (item: BasketItem) => void;
  onRemoveFromBasket: (id: string) => void;
  onClearBasket: () => void;
  onInjectBasket: () => void;
  reports: CustomReportSnapshot[];
  onGenerateReport: (title: string) => void;
  liveCensus: Record<string, number>;
  liveEntropy: number;
  liveExothermic: number;
  onSelectElementBrush: (elem: ElementType) => void;
}

export const BioscienceReportingDrawer: React.FC<
  BioscienceReportingDrawerProps
> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
  basket,
  onAddToBasket,
  onRemoveFromBasket,
  onClearBasket,
  onInjectBasket,
  reports,
  onGenerateReport,
  liveCensus,
  liveEntropy,
  liveExothermic,
  onSelectElementBrush,
}) => {
  const [searchQuery, setSearchQuery] = useState('imatinib');
  const [loadingCompound, setLoadingCompound] = useState(false);
  const [compoundError, setCompoundError] = useState<string | null>(null);
  const [compoundProfile, setCompoundProfile] =
    useState<PubChemCompoundProfile | null>(null);
  const [interactionSearch, setInteractionSearch] = useState('');
  const [imgError, setImgError] = useState(false);

  // Basket form controls
  const [customChargeName, setCustomChargeName] = useState('');
  const [selectedBrushRadius, setSelectedBrushRadius] = useState(5);
  const [selectedQuantity, setSelectedQuantity] = useState(3);
  const [reportTitleInput, setReportTitleInput] = useState(
    'Exothermic Containment Audit #1'
  );
  const [reportValidationError, setReportValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen && !compoundProfile && !loadingCompound) {
      handleLookup('imatinib');
    }
  }, [isOpen]);

  const handleLookup = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setCompoundError('Enter a valid compound name or PubChem CID.');
      return;
    }
    setLoadingCompound(true);
    setCompoundError(null);
    setImgError(false);
    try {
      const profile = await lookupPubChemCompound(trimmed);
      setCompoundProfile(profile);
      setCustomChargeName(`${profile.name} (${profile.mappedElementName})`);
    } catch (err: unknown) {
      setCompoundError(
        err instanceof Error ? err.message : 'Failed to resolve compound.'
      );
    } finally {
      setLoadingCompound(false);
    }
  };

  const handleCurateCurrentCompound = () => {
    if (!compoundProfile) return;
    const newItem: BasketItem = {
      id: `BSK-${Date.now().toString(36).toUpperCase()}`,
      name:
        customChargeName.trim() ||
        `${compoundProfile.name} (${compoundProfile.mappedElementName})`,
      elementType: compoundProfile.mappedElement,
      elementName: compoundProfile.mappedElementName,
      brushRadius: selectedBrushRadius,
      quantity: selectedQuantity,
      cid: compoundProfile.cid,
      formula: compoundProfile.molecularFormula,
      molecularWeight: compoundProfile.molecularWeight,
      xlogp: compoundProfile.xlogp,
      tpsa: compoundProfile.tpsa,
      lipinskiPass: compoundProfile.lipinskiPass,
      notes: `PubChem CID ${compoundProfile.cid} · TPSA ${compoundProfile.tpsa} Å²`,
      addedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    onAddToBasket(newItem);
  };

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitleInput.trim()) {
      setReportValidationError('Report title is required before capturing.');
      return;
    }
    setReportValidationError(null);
    onGenerateReport(reportTitleInput.trim());
  };

  const handleDownloadCSV = (report: CustomReportSnapshot) => {
    const csv = formatReportAsCSV(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id.toLowerCase()}-telemetry.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = (report: CustomReportSnapshot) => {
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.id.toLowerCase()}-telemetry.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Bioscience Reagent Synthesis, Custom Reporting & Basket Curation Workbench"
    >
      {/* Scientific Workbench Light-Mode Publication Surface */}
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-xl bg-[#F8FAFC] text-slate-900 border border-[#E2E8F0] shadow-2xl overflow-hidden">
        {/* Top Workbench Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-b border-[#E2E8F0]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono whitespace-nowrap">
              <span>QUANTUM POWDER WORKBENCH</span>
              <span aria-hidden="true">·</span>
              <span>{APP_VERSION}</span>
              <span aria-hidden="true">·</span>
              <span>PUBCHEM &amp; CHEMBL</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 font-display mt-0.5 truncate">
              Custom Reporting, Reagent Basket Curation &amp; Bioscience Lab
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Tab Controls */}
            <div
              className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
              role="tablist"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'bioscience'}
                onClick={() => onTabChange('bioscience')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'bioscience'
                    ? 'bg-[#0B57D0] text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                01. PubChem &amp; Basket Curation ({basket.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'reporting'}
                onClick={() => onTabChange('reporting')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'reporting'
                    ? 'bg-[#0B57D0] text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                02. Custom Reporting ({reports.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'guide'}
                onClick={() => onTabChange('guide')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === 'guide'
                    ? 'bg-[#0B57D0] text-white'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                03. How to Use &amp; Changelog
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Workbench"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer whitespace-nowrap shrink-0"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {/* Main Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'bioscience' && (
            <>
              {/* Quick-Try Example Reagent Bar */}
              <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-700">
                    Quick-Try Authoritative Compounds (PubChem PUG REST &amp; ChEMBL):
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Click any reagent to inspect structure &amp; curate into your Basket
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_REAGENT_CHIPS.map((chip) => (
                    <button
                      key={chip.cid}
                      type="button"
                      onClick={() => {
                        setSearchQuery(chip.query);
                        handleLookup(chip.query);
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-[#0B57D0] text-slate-800 rounded-md border border-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {chip.label} · CID {chip.cid}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split View: Left Compound Inspector + Right Reagent Basket Curation */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left 7 Cols: PubChem Search & Molecular Inspector */}
                <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between space-y-4">
                  <div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleLookup(searchQuery);
                      }}
                      className="flex gap-2 mb-4"
                    >
                      <label htmlFor="pubchem-search-input" className="sr-only">
                        Compound Name or PubChem CID
                      </label>
                      <input
                        id="pubchem-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search compound name (e.g., imatinib, aspirin, caffeine) or CID..."
                        className="flex-1 px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0B57D0]"
                      />
                      <button
                        type="submit"
                        disabled={loadingCompound}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {loadingCompound ? 'Querying...' : 'Fetch PubChem'}
                      </button>
                    </form>

                    {compoundError && (
                      <div
                        role="alert"
                        className="p-3 mb-4 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
                      >
                        {compoundError}
                      </div>
                    )}

                    {compoundProfile && (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start">
                          {/* 2D Chemical Depiction with Zero-Broken-Image Fallback */}
                          <div className="w-36 h-36 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center overflow-hidden p-2">
                            {!imgError ? (
                              <img
                                src={compoundProfile.image2dUrl}
                                alt={`2D chemical structure of ${compoundProfile.name}`}
                                referrerPolicy="no-referrer"
                                onError={() => setImgError(true)}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <svg
                                  viewBox="0 0 24 24"
                                  className="w-10 h-10 mx-auto text-[#0B57D0]"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={1.75}
                                >
                                  <polygon points="12 2 20 7 20 17 12 22 4 17 4 7" />
                                  <circle cx="12" cy="12" r="4" />
                                </svg>
                                <span className="block text-[11px] font-mono text-slate-600 mt-1">
                                  {compoundProfile.molecularFormula}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-mono">
                              <span>CID {compoundProfile.cid}</span>
                              <span aria-hidden="true">·</span>
                              <span>[{compoundProfile.provenanceBadge}]</span>
                              <span aria-hidden="true">·</span>
                              <a
                                href={compoundProfile.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0B57D0] underline hover:text-blue-900"
                              >
                                PubChem Record ↗
                              </a>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mt-1">
                              {compoundProfile.name}
                            </h3>
                            <p className="text-xs font-mono text-slate-700 mt-0.5 break-all">
                              Formula: {compoundProfile.molecularFormula} · MW:{' '}
                              {compoundProfile.molecularWeight.toFixed(2)} Da
                            </p>
                            <p className="text-xs font-mono text-slate-500 mt-1 truncate">
                              SMILES: {compoundProfile.canonicalSmiles}
                            </p>

                            {/* Lipinski & Veber Assessment */}
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                              <span
                                className={`font-semibold ${
                                  compoundProfile.lipinskiPass
                                    ? 'text-[#059669]'
                                    : 'text-[#D97706]'
                                }`}
                              >
                                Lipinski Ro5:{' '}
                                {compoundProfile.lipinskiPass
                                  ? `PASS (${compoundProfile.lipinskiViolations} violations)`
                                  : `WARN (${compoundProfile.lipinskiViolations} violations)`}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`font-semibold ${
                                  compoundProfile.veberPass
                                    ? 'text-[#059669]'
                                    : 'text-[#D97706]'
                                }`}
                              >
                                Veber Oral:{' '}
                                {compoundProfile.veberPass ? 'PASS' : 'HIGH TPSA/ROT'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Physicochemical Descriptor Table */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-200 text-center font-mono">
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">XLogP</div>
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {compoundProfile.xlogp}
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">TPSA</div>
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {compoundProfile.tpsa} Å²
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">HBD</div>
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {compoundProfile.hBondDonorCount}
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">HBA</div>
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {compoundProfile.hBondAcceptorCount}
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">RotBonds</div>
                            <div className="text-sm font-bold text-slate-900 tabular-nums">
                              {compoundProfile.rotatableBondCount}
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <div className="text-[11px] text-slate-500">Element</div>
                            <div className="text-sm font-bold text-[#0D9488]">
                              {compoundProfile.mappedElementName}
                            </div>
                          </div>
                        </div>

                        {compoundProfile.chemblBioactivity && (
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-slate-800">
                                ChEMBL Bioactivity Target:{' '}
                              </span>
                              <span className="text-slate-700">
                                {compoundProfile.chemblBioactivity.targetName} (
                                {compoundProfile.chemblBioactivity.targetChEMBLId})
                              </span>
                              <span className="mx-1.5 text-slate-400">·</span>
                              <span className="font-mono font-semibold text-[#0B57D0]">
                                {compoundProfile.chemblBioactivity.standardType} ={' '}
                                {compoundProfile.chemblBioactivity.standardValue}{' '}
                                {compoundProfile.chemblBioactivity.standardUnits} (pChEMBL{' '}
                                {compoundProfile.chemblBioactivity.pchemblValue})
                              </span>
                            </div>
                            <a
                              href={compoundProfile.chemblBioactivity.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[#0B57D0] underline"
                            >
                              ChEMBL Card ↗
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add to Curated Basket Form */}
                  {compoundProfile && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="text-xs font-bold text-slate-800">
                        Curate Compound into Synthesis Basket
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label
                            htmlFor="basket-charge-label"
                            className="block text-xs text-slate-600 mb-1"
                          >
                            Charge Label
                          </label>
                          <input
                            id="basket-charge-label"
                            type="text"
                            value={customChargeName}
                            onChange={(e) => setCustomChargeName(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-slate-300 rounded text-slate-900"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="basket-radius-input"
                            className="block text-xs text-slate-600 mb-1"
                          >
                            Dispense Radius ({selectedBrushRadius}px)
                          </label>
                          <input
                            id="basket-radius-input"
                            type="range"
                            min={2}
                            max={12}
                            value={selectedBrushRadius}
                            onChange={(e) =>
                              setSelectedBrushRadius(Number(e.target.value))
                            }
                            className="w-full mt-1.5"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="basket-qty-input"
                            className="block text-xs text-slate-600 mb-1"
                          >
                            Pulse Bursts ({selectedQuantity}x)
                          </label>
                          <input
                            id="basket-qty-input"
                            type="range"
                            min={1}
                            max={8}
                            value={selectedQuantity}
                            onChange={(e) =>
                              setSelectedQuantity(Number(e.target.value))
                            }
                            className="w-full mt-1.5"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCurateCurrentCompound}
                          className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Add to Reagent Basket
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectElementBrush(compoundProfile.mappedElement);
                            onClose();
                          }}
                          className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Equip {compoundProfile.mappedElementName} Brush Now
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right 5 Cols: Curated Reagent Basket */}
                <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-[#E2E8F0] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Curated Reagent Basket
                        </h3>
                        <p className="text-xs text-slate-500">
                          Batch-inject multi-compound charges into the sandbox
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#0B57D0] tabular-nums">
                        {basket.length} {basket.length === 1 ? 'Item' : 'Items'}
                      </span>
                    </div>

                    {basket.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500">
                        Your reagent basket is currently empty. Add compounds from
                        the PubChem inspector or select a preset below.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-200 max-h-72 overflow-y-auto mt-2">
                        {basket.map((item) => (
                          <div
                            key={item.id}
                            className="py-2.5 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 truncate">
                                {item.name}
                              </div>
                              <div className="text-slate-500 font-mono text-[11px]">
                                {item.elementName} · Radius {item.brushRadius}px ·{' '}
                                {item.quantity}x Burst · {item.notes}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveFromBasket(item.id)}
                              aria-label={`Remove ${item.name} from basket`}
                              className="px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 rounded border border-red-200 cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={basket.length === 0}
                        onClick={() => {
                          onInjectBasket();
                          onClose();
                        }}
                        className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-[#0B57D0] hover:bg-blue-800 disabled:opacity-40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Inject Curated Basket into Sandbox ({basket.length})
                      </button>
                      <button
                        type="button"
                        disabled={basket.length === 0}
                        onClick={onClearBasket}
                        className="px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg border border-slate-300 cursor-pointer whitespace-nowrap"
                      >
                        Clear Basket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'reporting' && (
            <div className="space-y-6">
              {/* Live Reactor Telemetry Summary + Snapshot Generator */}
              <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Live Cellular Automata Telemetry &amp; Snapshot Generator
                    </h3>
                    <p className="text-xs text-slate-500">
                      Capture deterministic particle distribution, Shannon entropy,
                      and exothermic activity into exportable CSV/JSON reports.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-xs">
                    <div>
                      <span className="text-slate-500">Shannon Entropy: </span>
                      <strong className="text-slate-900 tabular-nums">
                        {liveEntropy.toFixed(2)} bits
                      </strong>
                    </div>
                    <span aria-hidden="true">·</span>
                    <div>
                      <span className="text-slate-500">Exothermic Index: </span>
                      <strong className="text-[#E8710A] tabular-nums">
                        {liveExothermic}/100
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Live Element Census Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 font-mono">
                  {Object.entries(liveCensus).map(([elemName, count]) => (
                    <div
                      key={elemName}
                      className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
                    >
                      <span className="text-xs text-slate-600">{elemName}</span>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Capture Report Form */}
                <form
                  onSubmit={handleCreateSnapshot}
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                >
                  <div className="flex-1">
                    <label htmlFor="report-title-input" className="sr-only">
                      Custom Report Title
                    </label>
                    <input
                      id="report-title-input"
                      type="text"
                      value={reportTitleInput}
                      onChange={(e) => setReportTitleInput(e.target.value)}
                      placeholder="Enter custom report title (e.g., Exothermic Lava Quench Trial #2)..."
                      className="w-full px-3 py-2 text-sm bg-[#F8FAFC] border border-slate-300 rounded-lg text-slate-900"
                    />
                    {reportValidationError && (
                      <p className="text-xs text-red-600 mt-1">
                        {reportValidationError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0B57D0] hover:bg-blue-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Capture Custom Report Snapshot
                  </button>
                </form>
              </div>

              {/* Saved Custom Reports Table */}
              <div className="bg-white p-5 rounded-lg border border-[#E2E8F0]">
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Captured Custom Telemetry Reports ({reports.length})
                </h3>
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    No custom reports captured yet. Click &ldquo;Capture Custom
                    Report Snapshot&rdquo; above to log the current world state.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-mono">
                          <th className="py-2 pr-3">ID &amp; Version</th>
                          <th className="py-2 px-3">Report Title</th>
                          <th className="py-2 px-3 text-right">Particles</th>
                          <th className="py-2 px-3 text-right">Entropy</th>
                          <th className="py-2 px-3 text-right">Exothermic</th>
                          <th className="py-2 px-3 text-right">Score</th>
                          <th className="py-2 pl-3 text-right">Export Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono tabular-nums">
                        {reports.map((rep) => (
                          <tr key={rep.id} className="hover:bg-slate-50">
                            <td className="py-2.5 pr-3 text-slate-600">
                              {rep.id} · {rep.version}
                            </td>
                            <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                              {rep.title}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {rep.totalParticles}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {rep.shannonEntropy.toFixed(2)} b
                            </td>
                            <td className="py-2.5 px-3 text-right text-[#E8710A]">
                              {rep.exothermicIndex}/100
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#0B57D0]">
                              {rep.reactionScore}
                            </td>
                            <td className="py-2.5 pl-3 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => handleDownloadCSV(rep)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-[#0B57D0] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 cursor-pointer"
                              >
                                Download CSV
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadJSON(rep)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 cursor-pointer"
                              >
                                Download JSON
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Comprehensive Documentation on How to Use Custom Reporting & Basket Curation */}
              <div className="lg:col-span-7 bg-white p-6 rounded-lg border border-[#E2E8F0] space-y-5">
                <div>
                  <div className="text-xs font-mono text-[#0B57D0]">
                    OPERATOR MANUAL · {APP_VERSION}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    How to Use Custom Reporting &amp; Basket Curation
                  </h3>
                </div>

                <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-h-[58vh] overflow-y-auto pr-2">
                  <div>
                    <h4 className="font-bold text-slate-900">
                      01. Free Play Sandbox Mode vs. Reactor Challenge
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Quantum Powder boots into <strong>Sandbox Free Play Mode</strong> by default.
                      In Free Play mode, there are no game over triggers, containment integrity does not deplete,
                      and you have uninhibited freedom to experiment with all 35 cellular automata elements across
                      classical physics, TPT Ultimata mod, and the Alchemy mod.
                      Toggle <strong>Mode: Free Play / Reactor Challenge</strong> in the bottom drawer whenever you want
                      to test containment boundaries against autonomous anomaly incursions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      02. Complete Alchemy Mod Recipes &amp; Magnum Opus
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      The Alchemy engine simulates multi-reagent synthesis catalyzed by thermal energy:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Magnum Opus (Philosopher&apos;s Stone):</strong> Combine <em>Brimstone (Sulfur)</em> with <em>Liquid Mercury</em> under active flame, lava, or plasma to crystallize the legendary crimson catalyst.
                      </li>
                      <li>
                        <strong>Green Vitriol Synthesis:</strong> Combine <em>Brimstone (Sulfur)</em> with <em>Water</em> in the presence of <em>Fire</em> or <em>Lava</em> to produce aggressive alchemical acid.
                      </li>
                      <li>
                        <strong>Sulfur Combustion:</strong> Exposing <em>Brimstone</em> to heat or spark without water or mercury ignites it into blue/orange sulfur flame and dispersing sulfuric smoke.
                      </li>
                      <li>
                        <strong>Philosopher&apos;s Stone Transmutation:</strong> Transmutes base solids (<em>Sand</em>, <em>Wood</em>) into noble <em>Diamond</em> or restorative <em>Alchemical Elixir</em>; pacifies unstable explosives (<em>Gunpowder</em>, <em>C-4</em>) into inert diamonds; neutralizes acids into water; and transmutes <em>Mercury</em> into weightless <em>Aether</em>.
                      </li>
                      <li>
                        <strong>Alchemical Elixir (Aqua Vitae):</strong> Purifies toxic <em>Acid</em> and <em>Green Vitriol</em> into clean <em>Water</em>, quenches <em>Lava</em> into bedrock stone, melts <em>Ice</em> into water, and transforms <em>Fire</em> into celestial <em>Aether</em>.
                      </li>
                      <li>
                        <strong>Mercury Vaporization &amp; Solidification:</strong> Liquid <em>Mercury</em> vaporizes into glowing ascending <em>Aether</em> under high heat. When cooled by <em>Liquid Nitrogen (-196°C)</em>, it freezes into solid metallic silver stone.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      03. Thermal Phase Transitions &amp; Fluid Physics
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Elements exhibit realistic phase changes based on ambient contact:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Ice &amp; Freezing:</strong> <em>Water</em> flash-freezes into solid <em>Ice</em> when touching <em>Liquid Nitrogen (-196°C)</em> or <em>Cryo-Gel</em>.
                      </li>
                      <li>
                        <strong>Melting &amp; Evaporation:</strong> Solid <em>Ice</em> melts into liquid <em>Water</em> when exposed to <em>Fire</em>, <em>Lava</em>, <em>Plasma</em>, <em>Thermite</em>, or <em>Elixir</em>. <em>Water</em> boils into steam <em>Smoke</em> upon intense thermal exposure.
                      </li>
                      <li>
                        <strong>Extinguishing &amp; Smothering:</strong> <em>Water</em>, <em>Ice</em>, and <em>Liquid Nitrogen</em> immediately quench fire into steam. Pouring <em>Sand</em> over active flames smothers them into smoke.
                      </li>
                      <li>
                        <strong>Relative Density &amp; Buoyancy:</strong> <em>Mercury</em> (density 13,534 kg/m³) sinks through sand and all liquids. <em>Water</em> sinks through lighter <em>Oil</em> (800 kg/m³). Injected <em>Oil</em> actively rises and bubbles through water to form authentic surface slicks.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      04. Corrosives, Solvents, Wood &amp; Hardened Solids
                    </h4>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Wood Structure &amp; Flammability:</strong> Organic combustible solid with active burn progression. Ignites from flame, sparks, lava, thermite, or plasma, and dissolves in acid.
                      </li>
                      <li>
                        <strong>Acid &amp; Green Vitriol:</strong> Actively dissolve <em>Wood</em>, <em>Sand</em>, <em>Wire</em>, <em>Gunpowder</em>, <em>C-4</em>, <em>Ice</em>, and organic <em>Bio-Spores</em> on contact, emitting effervescent vapor and sparks.
                      </li>
                      <li>
                        <strong>Indestructible Diamond:</strong> Impervious to all acids, water, fire, and lava. Shields against neutron rays. Only destroyed by <em>Thermite</em> incendiary plasma, <em>Antimatter</em>, or <em>Singularity</em>.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      05. Electronics, Circuitry, Plasma &amp; Pyrotechnics
                    </h4>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Metal Wire:</strong> Conductive trace carrying sparks across all 8 neighbor directions.
                      </li>
                      <li>
                        <strong>Spark:</strong> Electrical pulse with 4-frame lifetime. Propagates along wires, electrifies conductive <em>Mercury</em> and <em>Water</em> (without destroying the liquid), detonates <em>C-4</em> and <em>Gunpowder</em>, and toggles logic gates.
                      </li>
                      <li>
                        <strong>Semiconductor Switch:</strong> Gated junction storing an internal binary state (0 = Open/Insulating, 1 = Closed/Conducting). Toggles state when pulsed with a spark, controlling circuit flow.
                      </li>
                      <li>
                        <strong>Proximity Sensor:</strong> Actively monitors surrounding 8 pixels for any passing matter; emits an electrical spark into connected wire circuits upon detection.
                      </li>
                      <li>
                        <strong>Plasma Ionization:</strong> High-energy plasma field induces electrical sparks along adjacent wire tracks.
                      </li>
                      <li>
                        <strong>Thermite Wall Boring:</strong> Burning thermite reaches 2500°C, melting through bedrock <em>Stone (Wall)</em> barriers into flowing lava, recreating the signature Powder Toy incendiary cutter mechanic.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      06. Nuclear Fission, Ballistics &amp; Exotics
                    </h4>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Neutron Rays:</strong> High-speed penetrating rays traversing in multi-directional vectors. Penetrate non-dense barriers; moderated and absorbed by <em>Water</em>; safely shielded by <em>Diamond</em>.
                      </li>
                      <li>
                        <strong>Explosive Induction:</strong> Fast neutrons induce spontaneous detonation upon colliding with <em>C-4</em> or <em>Gunpowder</em>.
                      </li>
                      <li>
                        <strong>Uranium &amp; Plutonium Criticality:</strong> Heavy fissile metals exhibiting spontaneous neutron emission. Contact with a <em>Neutron</em> or plasma induces nuclear fission, ejecting secondary neutrons and triggering catastrophic chain-reaction detonations.
                      </li>
                      <li>
                        <strong>Gravitational Accretion (Singularity):</strong> Micro black hole exerting radial inward gravitational pull on matter within a 5-pixel radius, devouring matter at the event horizon with relativistic gamma bursts.
                      </li>
                      <li>
                        <strong>Antimatter &amp; Dark Matter:</strong> <em>Antimatter</em> annihilates 1-to-1 against positive matter into high-energy plasma. <em>Dark Matter</em> exhibits inverted gravity (ascends) and undergoes catastrophic plasma bursts upon contacting antimatter.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      07. How to Use Custom Reporting &amp; Basket Curation
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Inspect the live 35-element census, <strong>Shannon Entropy</strong> (phase-mixing diversity in bits),
                      and <strong>Exothermic Index</strong> (0–100 thermal intensity driving the Three.js 3D Reactor Chamber).
                      Assemble custom reagents in the <strong>Curated Reagent Basket</strong> with personalized dispense radii and pulse quantities,
                      then inject them directly into the active simulation or export immutable telemetry snapshots via <strong>Download CSV</strong> or <strong>Download JSON</strong>.
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1.5 space-y-1">
                      <li>
                        <strong>PubChem Compound Search:</strong> Search bioactive reagents by name or formula to auto-populate molecular weight, XLogP, TPSA, and Lipinski rule-of-5 compliance.
                      </li>
                      <li>
                        <strong>Basket Injection:</strong> Click &ldquo;Inject Basket into Crucible&rdquo; from the side dock or workbench to dispense high-density multi-compound reagent charges at the crucible center with vector ignition sparks.
                      </li>
                      <li>
                        <strong>Telemetry Snapshots:</strong> Capture timestamped records containing elemental particle census, Shannon entropy, exothermic thermal rating, and simulation FPS.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      08. Resizable Play Area, Unified Side Dock &amp; 3D Orbital Vessel (v1.8.0)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Quantum Powder v1.8.0 introduces full viewport flexibility and a streamlined workspace layout:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Quick-Size Presets:</strong> Switch crucible dimensions instantly via top preset buttons: <em>Compact (200×120)</em>, <em>Standard (260×160)</em>, <em>Expanded (320×200)</em>, and <em>Cinematic (380×240)</em>. Existing active particles and reactions are preserved and re-centered smoothly.
                      </li>
                      <li>
                        <strong>Interactive Drag Handles:</strong> Click and drag the East (right edge), South (bottom edge), or South-East (bottom-right corner) handles to fluidly resize the simulation grid between 160×100 and 440×280 pixels.
                      </li>
                      <li>
                        <strong>Unified Collapsible Side Dock:</strong> Consolidates the element palette matrix, brush radius slider, simulation controls, and curated basket into a left-side panel. Click the arrow button or press <strong>[H]</strong> to toggle between the 56px collapsed icon strip and 320px expanded deck.
                      </li>
                      <li>
                        <strong>Compact 3D Corner Widget &amp; Orbital Modal:</strong> The 3D PBR reactor vessel is positioned as a lightweight 130×130px corner widget in the bottom-right. Click on the widget or press <strong>[V]</strong> to toggle visibility, or click the expand icon to open the full-screen 3D orbital inspection modal.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">
                      09. Minimizable Element Drawer, Proximity Thermodynamics &amp; Dynamic Wind Cooling (v1.9.0)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Quantum Powder v1.9.0 expands environmental dynamics and screen ergonomics:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Minimizable Element Drawer:</strong> Click the &ldquo;Minimize&rdquo; button in the element drawer header to collapse the toolbar into an unobtrusive, animated icon badge showing your current element swatch. Clicking the badge smoothly expands the drawer back into full view with fluid CSS transitions.
                      </li>
                      <li>
                        <strong>Proximity-Based Water Boiling:</strong> Water in proximity (radius 1–3 cells) to Fire, Lava, Plasma, Thermite, or Thermal Heat tools absorbs ambient thermal radiation and rapidly vaporizes into rising clouds of steam.
                      </li>
                      <li>
                        <strong>Proximity-Based Melting:</strong> High-melting-point solids (Ice, Wire, Tungsten, Quartz, and Bedrock under Thermite) melt into liquid water or molten lava depending on thermal proximity.
                      </li>
                      <li>
                        <strong>Dynamic Wind Cooling:</strong> Atmospheric Wind (WIND) actively chills and solidifies molten lava into stone bedrock, extinguishes flames into smoke, condenses steam into water droplets, and propels light powders horizontally.
                      </li>
                      <li>
                        <strong>Environmental Thermodynamic Brushes:</strong> Equip Dynamic Wind (WIND), Thermal Heat (HEAT), and Cryo-Cool (COOL) tools directly from the Thermodynamics category to actively manipulate ambient chamber conditions.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900">
                      10. Powder Toy Drawing Suite &amp; Environmental Modifiers (v2.2.0)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Quantum Powder v2.2.0 strictly focuses on authentic Powder Toy cellular automata physics and geometric drafting tools, accessible directly in the top canvas toolbar:
                    </p>
                    <ul className="text-xs text-slate-600 list-disc pl-5 mt-1 space-y-1">
                      <li>
                        <strong>Freehand Brush [B]:</strong> Standard circular particulate stamp with variable radius (1–24 pixels).
                      </li>
                      <li>
                        <strong>Straight Line Tool [L]:</strong> High-performance Bresenham rasterizer with live dashed preview. Click and drag across the canvas to draw perfectly straight beams, reinforced containment walls, or electrical circuit buses.
                      </li>
                      <li>
                        <strong>Box / Rectangle Tool:</strong> Click and drag to create clean rectangular pressure vessels, combustion vats, or bedrock enclosures with atomic undo.
                      </li>
                      <li>
                        <strong>Circle Tool:</strong> Click and drag from center to radius to draw circular reaction discs or containment rings with live dashed perimeter preview.
                      </li>
                      <li>
                        <strong>Flood Fill Bucket [G]:</strong> 4-way breadth-first scanline flood fill. Immediately fills any enclosed void or contiguous region of matter with the selected element without leaking.
                      </li>
                      <li>
                        <strong>Live Eyedropper Picker [I]:</strong> Click or drag across the canvas to sample any active element under the cursor and immediately assign it as the active paint brush.
                      </li>
                      <li>
                        <strong>Air Velocity Vector Brush [V]:</strong> Drag directional force vectors to generate aerodynamic wind currents that propel loose powders, particulate sand, and smoke along the vector path.
                      </li>
                      <li>
                        <strong>Precision Temperature Gun [T]:</strong> Thermal adjustment brush. Left-click rapidly heats local cells (+50°C), boiling water into steam and melting metals into lava; right-click quenches matter (-50°C), freezing liquids into ice and solidifying lava into stone.
                      </li>
                      <li>
                        <strong>Gravity Well Attractor:</strong> Local gravitational singularity brush. Left-click exerts radial gravity pulling surrounding particles into orbit; right-click exerts centrifugal antigravity repulsion.
                      </li>
                      <li>
                        <strong>Pixel Property &amp; Life Inspector:</strong> Click on any pixel on the grid to inspect its exact element name, ID, category, density, chemical formula, and life timer, with live +/- buttons to calibrate particle lifespan or clear the cell.
                      </li>
                      <li>
                        <strong>Pure Powder Toy Physics Fidelity:</strong> Excludes external mechanics to maintain 100% authentic Powder Toy physical reactions, thermal phase changes, nuclear fission, electronics, and alchemy.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Interactive Element Interaction Matrix Discovery Grid */}
              <div className="lg:col-span-5 bg-white p-6 rounded-lg border border-[#E2E8F0] space-y-4">
                <div>
                  <div className="text-xs font-mono text-[#0B57D0]">
                    DISCOVERY GRID · {APP_VERSION}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Element Interaction Matrix
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Search pairwise reactions, phase triggers, and alchemical synthesis outcomes.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Search reagent (e.g. Fire, Water, Uranium)..."
                    value={interactionSearch}
                    onChange={(e) => setInteractionSearch(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                  />
                </div>

                <div className="space-y-3 max-h-[48vh] overflow-y-auto pr-1">
                  {ELEMENT_INTERACTIONS
                    .filter(rule => 
                      rule.reagentA.toLowerCase().includes(interactionSearch.toLowerCase()) ||
                      rule.reagentB.toLowerCase().includes(interactionSearch.toLowerCase()) ||
                      rule.products.toLowerCase().includes(interactionSearch.toLowerCase())
                    )
                    .map((rule, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                          <span>{rule.reagentA} + {rule.reagentB}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200 uppercase font-sans">
                            {rule.category}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-700 font-semibold">
                          ↳ Result: {rule.products}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>{rule.condition}</span>
                          <span className="font-mono text-slate-600">{rule.enthalpy}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
