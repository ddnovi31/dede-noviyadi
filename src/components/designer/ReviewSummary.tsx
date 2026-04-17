import React from 'react';
import { List, Package, Printer, BarChart3, Settings, Maximize2, Minimize2, Trash2, Plus } from 'lucide-react';
import { CableDesignParams, CalculationResult } from '../../utils/cableCalculations';
import { 
  getCableDesignation, 
  calculateCostBreakdown, 
  calculatePacking, 
  calculateHPP,
  calculateSellingPrice
} from '../../utils/designerUtils';
import { DrumData } from '../../utils/drumData';

interface ReviewSummaryProps {
  projectItems: { params: CableDesignParams; result: CalculationResult }[];
  totalProjectPrice: number;
  lmeParams: { kurs: number; lmeCu: number; lmeAl: number };
  materialPrices: Record<string, number>;
  drumData: DrumData[];
  setProjectItems: React.Dispatch<React.SetStateAction<{ params: CableDesignParams; result: CalculationResult }[]>>;
  loadedProjectConfig: any;
  expandedItemId: string | null;
  setExpandedItemId: (v: string | null) => void;
  updateProjectItemParam: (idx: number, key: keyof CableDesignParams, value: any) => void;
  updateProjectItemCustomPrice: (idx: number, material: string, price: number) => void;
  setReviewTab: (v: 'summary' | 'specifications') => void;
}

export default function ReviewSummary({
  projectItems,
  totalProjectPrice,
  lmeParams,
  materialPrices,
  drumData,
  setProjectItems,
  loadedProjectConfig,
  expandedItemId,
  setExpandedItemId,
  updateProjectItemParam,
  updateProjectItemCustomPrice,
  setReviewTab
}: ReviewSummaryProps) {
  return (
    <div className="block print:block space-y-6 print-landscape-page">
      {/* Project Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print-scale">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Items</div>
            <div className="text-3xl font-bold text-slate-900">{projectItems.length} Cables</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimated Project HPP (per meter sum)</div>
            <div className="text-3xl font-bold text-indigo-600 font-mono">
              Rp {totalProjectPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">LME & Exchange Rate</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">Kurs USD:</span>
                <span className="text-xs font-bold text-slate-700">Rp {lmeParams.kurs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">LME Cu:</span>
                <span className="text-xs font-bold text-orange-600">${lmeParams.lmeCu}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500">LME Al:</span>
                <span className="text-xs font-bold text-slate-600">${lmeParams.lmeAl}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Detailed Items Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 print-scale">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <List className="w-5 h-5 text-indigo-600" />
            Cable Specifications & Costs
          </h2>
          <div className="flex items-center gap-4 print:hidden">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Set All OH:</label>
              <input 
                type="number" 
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                placeholder="%"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setProjectItems(prev => prev.map(item => ({
                      ...item,
                      params: { ...item.params, overhead: val }
                    })));
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500">Set All MG:</label>
              <input 
                type="number" 
                className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                placeholder="%"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setProjectItems(prev => prev.map(item => ({
                      ...item,
                      params: { ...item.params, margin: val }
                    })));
                  }
                }}
              />
            </div>
            <button 
              onClick={() => {
                setReviewTab('summary');
                setTimeout(() => window.print(), 100);
              }}
              className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Summary
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4 border-b border-slate-100">Designation</th>
                <th className="px-6 py-4 border-b border-slate-100">Dimensions</th>
                <th className="px-6 py-4 border-b border-slate-100">Weight</th>
                <th className="px-6 py-4 border-b border-slate-100">Packing</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Cond. Price</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Order Length (m)</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">OH (%)</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">MG (%)</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Old HPP</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Current HPP</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Deviasi</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">Target Price</th>
                <th className="px-6 py-4 border-b border-slate-100 text-center">MG vs Target</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Selling Price</th>
                <th className="px-6 py-4 border-b border-slate-100 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectItems.map((item, idx) => {
                const hpp = calculateHPP(item.result, item.params, materialPrices, drumData);
                const oldHpp = loadedProjectConfig?.materialPrices ? calculateHPP(item.result, item.params, loadedProjectConfig.materialPrices, drumData) : hpp;
                const deviation = hpp - oldHpp;
                const targetPrice = item.params.targetPrice || 0;
                const marginVsTarget = targetPrice > 0 ? ((targetPrice - hpp) / targetPrice) * 100 : 0;
                
                const sellingPrice = calculateSellingPrice(hpp, item.params.margin);
                const breakdown = calculateCostBreakdown(item.result.bom, item.params, materialPrices);
                const conductorPrice = breakdown.conductor + (breakdown.earthingConductor || 0) + (breakdown.earthingAl || 0) + (breakdown.earthingSteel || 0);
                const itemId = item.params.id || idx.toString();
                const isExpanded = expandedItemId === itemId;
                
                const isNY = item.params.standard.includes('(NYA)') || item.params.standard.includes('(NYAF)');
                const isNFA = item.params.standard.includes('NFA2X');
                const hasOuterSheath = !isNY && !isNFA && item.params.standard !== 'SPLN 41-6 : 1981 AAC' && item.params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && item.params.hasOuterSheath !== false;
                const hasAssembly = (item.params.cores > 1 && !isNFA) || item.params.hasInnerSheath || item.params.hasSeparator;
                const hasArmor = item.params.armorType !== 'Unarmored';
                
                return (
                  <React.Fragment key={itemId}>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td 
                        className="px-6 py-4 cursor-pointer hover:bg-slate-100"
                        onClick={() => setExpandedItemId(isExpanded ? null : itemId)}
                      >
                        <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
                          {isExpanded ? <Minimize2 className="w-3 h-3 text-slate-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
                          {getCableDesignation(item.params, item.result)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 ml-5">{item.params.standard}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600">OD: <span className="font-mono text-slate-900">{item.result.spec.overallDiameter.toFixed(2)} mm</span></div>
                        <div className="text-[10px] text-slate-400">Core: {item.result.spec.coreDiameter.toFixed(2)} mm</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-900 font-mono">{Math.round(item.result.bom.totalWeight).toLocaleString()} kg/km</div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
                          return (
                            <div className="text-[10px] text-slate-600">
                              <div className="font-bold text-indigo-600">{packing.selectedDrum.type}</div>
                              <div className="text-slate-400">{packing.standardLength} m</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-bold text-slate-600 font-mono">Rp {Math.round(conductorPrice).toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                          value={item.params.orderLength || 1000}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setProjectItems(prev => prev.map((pItem, pIdx) => 
                                (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, orderLength: val } } : pItem
                              ));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                          value={item.params.overhead || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setProjectItems(prev => prev.map((pItem, pIdx) => 
                                (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, overhead: val } } : pItem
                              ));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                          value={item.params.margin || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setProjectItems(prev => prev.map((pItem, pIdx) => 
                                (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, margin: val } } : pItem
                              ));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-[10px] font-bold text-slate-400 font-mono">Rp {oldHpp.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-[10px] font-bold text-slate-900 font-mono">Rp {hpp.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`text-[10px] font-bold font-mono ${deviation > 0 ? 'text-red-600' : (deviation < 0 ? 'text-emerald-600' : 'text-slate-400')}`}>
                          {deviation > 0 ? '+' : ''}{deviation.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="number" 
                          className="w-24 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                          value={item.params.targetPrice || ''}
                          placeholder="Target Price"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setProjectItems(prev => prev.map((pItem, pIdx) => 
                                (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, targetPrice: val } } : pItem
                              ));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`text-xs font-bold font-mono ${marginVsTarget >= (item.params.margin || 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                          {marginVsTarget.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-indigo-600 font-mono">Rp {sellingPrice.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-bold text-emerald-600 font-mono">Rp {(sellingPrice * (item.params.orderLength || 1000)).toLocaleString('id-ID')}</div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/80 border-b border-slate-200 print:hidden">
                        <td colSpan={15} className="p-6">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                              <Settings className="w-4 h-4 text-indigo-500" />
                              Adjustments
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {/* 1. Conductor & Core */}
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Conductor & Core</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Cond. Dia (mm)</label>
                                    <input 
                                      type="number" step="0.01"
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                      value={item.params.manualConductorDiameter || ''}
                                      placeholder="Auto"
                                      onChange={e => updateProjectItemParam(idx, 'manualConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Wire Count</label>
                                    <input 
                                      type="number"
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                      value={item.params.manualWireCount || ''}
                                      placeholder="Auto"
                                      onChange={e => updateProjectItemParam(idx, 'manualWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Wire Dia (mm)</label>
                                    <input 
                                      type="number" step="0.01"
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                      value={item.params.manualWireDiameter || ''}
                                      placeholder="Auto"
                                      onChange={e => updateProjectItemParam(idx, 'manualWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </div>
                                  {item.params.hasMgt && (
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">MGT Thick (mm)</label>
                                      <input 
                                        type="number" step="0.01"
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                        value={item.params.manualMgtThickness || ''}
                                        placeholder="Auto"
                                        onChange={e => updateProjectItemParam(idx, 'manualMgtThickness', e.target.value ? Number(e.target.value) : undefined)}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 2. Insulation & Screen */}
                              <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Insulation & Screen</h5>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Insul. Thick (mm)</label>
                                    <input 
                                      type="number" step="0.01"
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                      value={item.params.manualInsulationThickness || ''}
                                      placeholder="Auto"
                                      onChange={e => updateProjectItemParam(idx, 'manualInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                  </div>
                                  {parseFloat(item.params.voltage.replace(/[^0-9.]/g, '')) >= 3.6 && (
                                    <>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Cond Screen (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualConductorScreenThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualConductorScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Insul Screen (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualInsulationScreenThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualInsulationScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">MV Scr Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualMvScreenThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualMvScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">MV Scr Wire Cnt</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualMvScreenWireCount || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualMvScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">MV Scr Wire Dia</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualMvScreenWireDiameter || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualMvScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    </>
                                  )}
                                  {item.params.hasScreen && (
                                    <>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Screen Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualScreenThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Scr Wire Count</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualScreenWireCount || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Scr Wire Dia (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualScreenWireDiameter || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 3. Assembly & Inner Sheath */}
                              {hasAssembly && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Assembly & Inner</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Laid-up Dia (mm)</label>
                                      <input 
                                        type="number" step="0.01"
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                        value={item.params.manualLaidUpDiameter || ''}
                                        placeholder="Auto"
                                        onChange={e => updateProjectItemParam(idx, 'manualLaidUpDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                      />
                                    </div>
                                    {item.params.hasInnerSheath && (
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Inner Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualInnerSheathThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualInnerSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    )}
                                    {item.params.hasSeparator && (
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Sep. Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualSeparatorThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualSeparatorThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 4. Armor & Outer Sheath */}
                              {(hasArmor || hasOuterSheath) && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Armor & Outer</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {hasArmor && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Dia Under Arm (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualDiameterUnderArmor || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualDiameterUnderArmor', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Armor Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualArmorThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualArmorThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        {['SWA', 'AWA', 'GSWB', 'TCWB'].includes(item.params.armorType) && (
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Arm Wire Dia (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualArmorWireDiameter || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualArmorWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        )}
                                        {item.params.armorType === 'STA' && (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Arm Tape Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualArmorTapeThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualArmorTapeThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">STA Overlap (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.staOverlap || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'staOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                        {item.params.armorType === 'RGB' && (
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Arm Flat Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualArmorFlatThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualArmorFlatThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        )}
                                        {['GSWB', 'TCWB'].includes(item.params.armorType) && (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Braid Coverage (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.braidCoverage || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'braidCoverage', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Braid Wire Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualBraidWireDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualBraidWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">GSWB Carriers</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualGswbCarriers || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualGswbCarriers', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">GSWB Wires/Carr</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualGswbWiresPerCarrier || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualGswbWiresPerCarrier', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">GSWB Lay Pitch (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualGswbLayPitch || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualGswbLayPitch', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Dia Over Arm (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualDiameterOverArmor || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualDiameterOverArmor', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </>
                                    )}
                                    {hasOuterSheath && (
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Sheath Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualSheathThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    )}
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Overall Dia (mm)</label>
                                      <input 
                                        type="number" step="0.01"
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                        value={item.params.manualOverallDiameter || ''}
                                        placeholder="Auto"
                                        onChange={e => updateProjectItemParam(idx, 'manualOverallDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 5. Instrumentation (IS/OS) */}
                              {item.params.formationType && item.params.formationType !== 'Core' && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Instrumentation</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.params.hasIndividualScreen && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Al Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsAluminiumThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Al Overlap (%)</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsAluminiumOverlap || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Drain Count</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsDrainWireCount || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Drain Size (mm²)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsDrainWireSize || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireSize', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Drain Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsDrainWireDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Poly Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsPolyesterThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">IS Poly Overlap (%)</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualIsPolyesterOverlap || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualIsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </>
                                    )}
                                    {item.params.hasOverallScreen && (
                                      <>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Al Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsAluminiumThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Al Overlap (%)</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsAluminiumOverlap || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Drain Count</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsDrainWireCount || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Drain Size (mm²)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsDrainWireSize || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireSize', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Drain Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsDrainWireDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Poly Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsPolyesterThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">OS Poly Overlap (%)</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOsPolyesterOverlap || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 6. Earthing / Messenger */}
                              {item.params.hasEarthing && (
                                <div className="space-y-3">
                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Earthing / Messenger</h5>
                                  <div className="grid grid-cols-2 gap-2">
                                    {item.params.standard.includes('NFA2X-T') ? (
                                      <>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Msgr Al Wires</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualEarthingWireCount || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualEarthingWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Msgr Al Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualEarthingWireDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualEarthingWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Msgr Steel Wires</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualEarthingSteelWireCount ?? ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualEarthingSteelWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Msgr Steel Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualEarthingSteelWireDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualEarthingSteelWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Earth Cond Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualEarthingConductorDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualEarthingConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </>
                                    )}
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Earth Insul Thick (mm)</label>
                                      <input 
                                        type="number" step="0.01"
                                        className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                        value={item.params.manualEarthingInsulationThickness || ''}
                                        placeholder="Auto"
                                        onChange={e => updateProjectItemParam(idx, 'manualEarthingInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* BOM Summary & Footer */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-slate-300 print-scale">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-emerald-600" />
          Consolidated Bill of Materials (Project Total)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Conductor & Screen */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Conductor & Screen</h3>
            {Object.entries(projectItems.reduce((acc, item) => {
              const condMat = item.params.conductorMaterial === 'Cu' ? 'Copper (Cu)' : 'Aluminum (Al)';
              acc[condMat] = (acc[condMat] || 0) + item.result.bom.conductorWeight;
              if (item.result.bom.mvScreenWeight > 0) {
                const screenMat = item.params.armorType === 'TCWB' ? 'Tinned Copper (TCWB)' : 'Copper Tape/Wire';
                acc[screenMat] = (acc[screenMat] || 0) + item.result.bom.mvScreenWeight;
              }
              if (item.result.bom.screenWeight > 0) {
                if (item.params.standard === 'SPLN 43-4 (NYCY)') {
                  acc['Overall Screen (Copper Wire)'] = (acc['Overall Screen (Copper Wire)'] || 0) + (item.result.bom.copperWireWeight || 0);
                  acc['Overall Screen (Copper Tape)'] = (acc['Overall Screen (Copper Tape)'] || 0) + (item.result.bom.copperTapeWeight || 0);
                  acc['Overall Screen (Polyester Tape)'] = (acc['Overall Screen (Polyester Tape)'] || 0) + (item.result.bom.polyesterTapeWeight || 0);
                } else {
                  const screenMat = `Overall Screen (${item.params.screenType})`;
                  acc[screenMat] = (acc[screenMat] || 0) + item.result.bom.screenWeight;
                }
              }
              return acc;
            }, {} as Record<string, number>)).map(([mat, weight]) => (
              <div key={mat} className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{mat}</span>
                <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
              </div>
            ))}
          </div>

          {/* Insulation & MGT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Insulation, Tapes & Screens</h3>
            {Object.entries(projectItems.reduce((acc, item) => {
              const insMat = item.params.insulationMaterial;
              acc[insMat] = (acc[insMat] || 0) + item.result.bom.insulationWeight;
              if (item.result.bom.mgtWeight > 0) {
                acc['Mica Glass Tape (MGT)'] = (acc['Mica Glass Tape (MGT)'] || 0) + item.result.bom.mgtWeight;
              }
              if (item.result.bom.semiCondWeight > 0) {
                acc['Semi-conductive Layers'] = (acc['Semi-conductive Layers'] || 0) + item.result.bom.semiCondWeight;
              }
              // IS-OS/OS Materials
              const isOsWeight = (item.result.bom.isAlWeight || 0) + (item.result.bom.osAlWeight || 0);
              if (isOsWeight > 0) acc['Aluminium Foil (IS-OS/OS)'] = (acc['Aluminium Foil (IS-OS/OS)'] || 0) + isOsWeight;
              
              const drainWeight = (item.result.bom.isDrainWeight || 0) + (item.result.bom.osDrainWeight || 0);
              if (drainWeight > 0) acc['Drain Wire (IS-OS/OS)'] = (acc['Drain Wire (IS-OS/OS)'] || 0) + drainWeight;
              
              const petWeight = (item.result.bom.isPetWeight || 0) + (item.result.bom.osPetWeight || 0);
              if (petWeight > 0) acc['Polyester Tape (IS-OS/OS)'] = (acc['Polyester Tape (IS-OS/OS)'] || 0) + petWeight;
              
              return acc;
            }, {} as Record<string, number>)).map(([mat, weight]) => (
              <div key={mat} className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{mat}</span>
                <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
              </div>
            ))}
          </div>

          {/* Sheaths & Armour */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Sheaths & Armour</h3>
            {Object.entries(projectItems.reduce((acc, item) => {
              // Binder Tape
              if (item.result.bom.binderTapeWeight && item.result.bom.binderTapeWeight > 0) {
                const btMat = `Polyester Tape (Binder Tape)`;
                acc[btMat] = (acc[btMat] || 0) + item.result.bom.binderTapeWeight;
              }
              // Binder Tape Over Armor
              if (item.result.bom.binderTapeOverArmorWeight && item.result.bom.binderTapeOverArmorWeight > 0) {
                const btArmMat = `Polyester Tape (Over Armor)`;
                acc[btArmMat] = (acc[btArmMat] || 0) + item.result.bom.binderTapeOverArmorWeight;
              }
              // Inner Sheath
              if (item.result.bom.innerCoveringWeight > 0) {
                const isMat = `${item.params.innerSheathMaterial || 'PVC'} (Inner Sheath / Filler)`;
                acc[isMat] = (acc[isMat] || 0) + item.result.bom.innerCoveringWeight;
              }
              // Armour
              if (item.result.bom.armorWeight > 0) {
                const armType = `Armour (${item.params.armorType})`;
                acc[armType] = (acc[armType] || 0) + item.result.bom.armorWeight;
              }
              // Outer Sheath
              const shMat = `${item.params.sheathMaterial} (Outer)`;
              acc[shMat] = (acc[shMat] || 0) + item.result.bom.sheathWeight;
              return acc;
            }, {} as Record<string, number>)).map(([mat, weight]) => (
              <div key={mat} className="flex justify-between items-center">
                <span className="text-sm text-slate-600">{mat}</span>
                <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
              </div>
            ))}
          </div>

          {/* Other Items */}
          {projectItems.some(item => item.params.otherItems && item.params.otherItems.length > 0) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Other Items</h3>
              {Object.entries(projectItems.reduce((acc, item) => {
                (item.params.otherItems || []).forEach(other => {
                  const key = other.description || 'Other Item';
                  acc[key] = (acc[key] || 0) + (other.unitPrice * other.quantity);
                });
                return acc;
              }, {} as Record<string, number>)).map(([desc, cost]) => (
                <div key={desc} className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">{desc}</span>
                  <span className="text-sm font-bold font-mono">Rp {Math.round(cost as number).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          {(() => {
            const totalWeight = projectItems.reduce((acc, item) => acc + item.result.bom.totalWeight, 0);
            const totalHPP = projectItems.reduce((acc, item) => acc + calculateHPP(item.result, item.params, materialPrices, drumData), 0);
            const totalSellingPrice = projectItems.reduce((acc, item) => {
              const hpp = calculateHPP(item.result, item.params, materialPrices, drumData);
              return acc + calculateSellingPrice(hpp, item.params.margin);
            }, 0);
            const totalMargin = totalSellingPrice - totalHPP;
            const marginPercentage = totalSellingPrice > 0 ? (totalMargin / totalSellingPrice) * 100 : 0;

            return (
              <>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Total Project Material Weight</span>
                  <span className="text-xl font-bold text-indigo-600 font-mono">
                    {Math.round(totalWeight).toLocaleString()} kg
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">Total Project Cost (HPP)</span>
                  <span className="text-xl font-bold text-emerald-600 font-mono">
                    Rp {Math.round(totalHPP).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">Total Project Selling Price</span>
                  <span className="text-xl font-bold text-indigo-600 font-mono">
                    Rp {Math.round(totalSellingPrice).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-900">Total Project Margin</span>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-bold text-emerald-600 font-mono">
                      Rp {Math.round(totalMargin).toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">
                      ({marginPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
