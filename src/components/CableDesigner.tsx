import React, { useState, useEffect } from 'react';
import { Settings, FileText, Package, Download, Zap, Info, Plus, Trash2, List, DollarSign, BarChart3 } from 'lucide-react';
import {
  calculateCable,
  CableDesignParams,
  CalculationResult,
  CABLE_SIZES,
  ConductorMaterial,
  ConductorType,
  InsulationMaterial,
  ArmorType,
  SheathMaterial,
  CableStandard,
  MvScreenType,
} from '../utils/cableCalculations';
import CableCrossSection from './CableCrossSection';

export default function CableDesigner() {
  const [params, setParams] = useState<CableDesignParams>({
    cores: 3,
    size: 50,
    conductorMaterial: 'Cu',
    conductorType: 'rm',
    insulationMaterial: 'XLPE',
    armorType: 'SWA',
    sheathMaterial: 'PVC',
    voltage: '0.6/1 kV',
    standard: 'IEC 60502-1',
    braidCoverage: 90,
    mvScreenType: 'None',
    mvScreenSize: 16,
    hasMgt: false,
  });

  const [activeTab, setActiveTab] = useState<'config' | 'prices'>('config');
  const [materialPrices, setMaterialPrices] = useState({
    Cu: 155000,
    Al: 45000,
    XLPE: 35000,
    PVC: 25000,
    PE: 30000,
    LSZH: 45000,
    Steel: 18000,
    SemiCond: 65000,
    MGT: 120000,
  });

  const [projectItems, setProjectItems] = useState<{params: CableDesignParams, result: CalculationResult}[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const res = calculateCable(params);
    setResult(res);
  }, [params]);

  const handleParamChange = (key: keyof CableDesignParams, value: any) => {
    setParams((prev) => {
      const newParams = { ...prev, [key]: value };
      
      // Validation rules
      if (newParams.cores === 1 && newParams.armorType === 'SWA') {
        newParams.armorType = 'AWA'; // Single core AC systems use AWA
      }
      if (newParams.cores > 1 && newParams.armorType === 'AWA') {
        newParams.armorType = 'SWA'; // Multi core uses SWA
      }
      if (newParams.cores === 1 && newParams.conductorType === 'sm') {
        newParams.conductorType = 'rm'; // Sector only for multi-core
      }
      if (newParams.size < 25 && newParams.conductorType === 'sm') {
        newParams.conductorType = 'rm'; // Sector usually for larger sizes
      }

      // Standard specific overrides
      if (newParams.standard === 'IEC 60502-2') {
        newParams.conductorType = 'cm';
        newParams.insulationMaterial = 'XLPE';
        if (newParams.mvScreenType === 'None' || !newParams.mvScreenType) {
          newParams.mvScreenType = 'CTS';
        }
        if (!['3.6/6 kV', '6/10 kV', '8.7/15 kV', '12/20 kV', '18/30 kV'].includes(newParams.voltage)) {
          newParams.voltage = '6/10 kV';
        }
      } else {
        newParams.mvScreenType = 'None';
        if (newParams.standard.includes('NYAF')) {
          newParams.cores = 1;
          newParams.conductorType = 'f';
          newParams.armorType = 'Unarmored';
        } else if (newParams.standard.includes('NYMHY') || newParams.standard.includes('NYYHY')) {
          newParams.conductorType = 'f';
          newParams.armorType = 'Unarmored';
        } else if (newParams.standard.includes('NYM')) {
          newParams.armorType = 'Unarmored';
        }
      }

      return newParams;
    });
  };

  const handleDownloadReport = () => {
    if (!result) return;
    
    const report = {
      projectName: "MULTI KABEL Project Report",
      date: new Date().toISOString(),
      items: projectItems.length > 0 ? projectItems.map(item => ({
        designation: `${item.params.conductorMaterial}${item.params.hasMgt ? '/MGT' : ''}/${item.params.insulationMaterial}/${item.params.armorType === 'Unarmored' ? '' : item.params.armorType + '/'}${item.params.sheathMaterial} ${item.params.cores} x ${item.params.size} mm² (${item.params.conductorType}) ${item.result.electrical.voltageRating}`,
        parameters: item.params,
        result: item.result
      })) : [{
        designation: `${params.conductorMaterial}${params.hasMgt ? '/MGT' : ''}/${params.insulationMaterial}/${params.armorType === 'Unarmored' ? '' : params.armorType + '/'}${params.sheathMaterial} ${params.cores} x ${params.size} mm² (${params.conductorType}) ${result.electrical.voltageRating}`,
        parameters: params,
        result: result
      }]
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cable_Design_${params.cores}x${params.size}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addToProject = () => {
    if (!result) return;
    setProjectItems(prev => [...prev, { params: { ...params, id: crypto.randomUUID() }, result }]);
  };

  const removeFromProject = (id: string) => {
    setProjectItems(prev => prev.filter(item => item.params.id !== id));
  };

  const calculateHPP = (bom: CalculationResult['bom'], params: CableDesignParams) => {
    const condPrice = params.conductorMaterial === 'Cu' ? materialPrices.Cu : materialPrices.Al;
    const insPrice = params.insulationMaterial === 'XLPE' ? materialPrices.XLPE : materialPrices.PVC;
    const armorPrice = materialPrices.Steel;
    const sheathPrice = materialPrices[params.sheathMaterial as keyof typeof materialPrices] || materialPrices.PVC;
    const innerPrice = materialPrices.PVC;
    const semiPrice = materialPrices.SemiCond;
    const screenPrice = materialPrices.Cu; // Copper screen
    const mgtPrice = materialPrices.MGT;

    const totalCostKm = 
      (bom.conductorWeight * condPrice) +
      (bom.insulationWeight * insPrice) +
      (bom.armorWeight * armorPrice) +
      (bom.sheathWeight * sheathPrice) +
      (bom.innerCoveringWeight * innerPrice) +
      (bom.semiCondWeight * semiPrice) +
      (bom.mvScreenWeight * screenPrice) +
      (bom.mgtWeight * mgtPrice);
    
    return totalCostKm / 1000; // per meter
  };

  const currentHPP = result ? calculateHPP(result.bom, params) : 0;

  if (!result) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              MULTI KABEL
            </h1>
            <div className="text-[10px] text-slate-400 mt-1 font-medium ml-1 uppercase tracking-wider">PT. Multi Kencana Niagatama</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
              Standard: {params.standard}
            </div>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Report</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Configuration & Prices Panel */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'config' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Config
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'prices' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Prices
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'config' ? (
                  <div className="space-y-4">
                    {/* Standard Selection */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Standard Reference</label>
                      <select
                        value={params.standard}
                        onChange={(e) => handleParamChange('standard', e.target.value as CableStandard)}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        <option value="IEC 60502-1">IEC 60502-1 (Low Voltage)</option>
                        <option value="IEC 60502-2">IEC 60502-2 (Medium Voltage)</option>
                        <option value="SNI 04-6629.4 (NYM)">SNI 04-6629.4 (NYM)</option>
                        <option value="SNI 04-6629.3 (NYAF)">SNI 04-6629.3 (NYAF)</option>
                        <option value="SNI 04-6629.5 (NYMHY)">SNI 04-6629.5 (NYMHY)</option>
                        <option value="SNI 04-6629.5 (NYYHY)">SNI 04-6629.5 (NYYHY)</option>
                      </select>
                    </div>

                    {/* Voltage Selection (Dynamic) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Voltage Rating (Uo/U)</label>
                      <select
                        value={params.voltage}
                        onChange={(e) => handleParamChange('voltage', e.target.value)}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        {params.standard === 'IEC 60502-2' ? (
                          <>
                            <option value="3.6/6 kV">3.6/6 kV</option>
                            <option value="6/10 kV">6/10 kV</option>
                            <option value="8.7/15 kV">8.7/15 kV</option>
                            <option value="12/20 kV">12/20 kV</option>
                            <option value="18/30 kV">18/30 kV</option>
                          </>
                        ) : params.standard.includes('NYM') || params.standard.includes('NYMHY') ? (
                          <option value="300/500 V">300/500 V</option>
                        ) : params.standard.includes('NYAF') || params.standard.includes('NYYHY') ? (
                          <option value="450/750 V">450/750 V</option>
                        ) : (
                          <option value="0.6/1 kV">0.6/1 kV</option>
                        )}
                      </select>
                    </div>

                    <button
                      onClick={addToProject}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-[0.98]"
                    >
                      <Plus className="w-5 h-5" />
                      Add to Project List
                    </button>

                    {/* Number of Cores */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Number of Cores</label>
                      <select
                        value={params.cores}
                        onChange={(e) => handleParamChange('cores', Number(e.target.value))}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        {[1, 2, 3, 4, 5].map((c) => (
                          <option key={c} value={c}>{c} Core{c > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Cross Section */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cross Section (mm²)</label>
                      <select
                        value={params.size}
                        onChange={(e) => handleParamChange('size', Number(e.target.value))}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        {CABLE_SIZES.map((s) => (
                          <option key={s} value={s}>{s} mm²</option>
                        ))}
                      </select>
                    </div>

                    {/* Conductor Material */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Conductor Material</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Cu', 'Al'] as ConductorMaterial[]).map((mat) => (
                          <button
                            key={mat}
                            onClick={() => handleParamChange('conductorMaterial', mat)}
                            className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                              params.conductorMaterial === mat
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {mat === 'Cu' ? 'Copper (Cu)' : 'Aluminum (Al)'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Conductor Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Conductor Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['re', 'rm', 'cm', 'sm', 'f'] as ConductorType[]).map((type) => {
                          const isDisabled = (type === 'sm' && (params.cores === 1 || params.size < 25));
                          return (
                            <button
                              key={type}
                              disabled={isDisabled}
                              onClick={() => handleParamChange('conductorType', type)}
                              className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                                params.conductorType === type
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : isDisabled
                                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title={type === 're' ? 'Solid Circular' : type === 'rm' ? 'Stranded Circular' : type === 'cm' ? 'Compacted Stranded' : type === 'sm' ? 'Sector Stranded' : 'Flexible Class 5'}
                            >
                              {type === 're' ? 'Solid (re)' : type === 'rm' ? 'Stranded (rm)' : type === 'cm' ? 'Compacted (cm)' : type === 'sm' ? 'Sector (sm)' : 'Flexible (f)'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Insulation Material */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Insulation Material</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['XLPE', 'PVC'] as InsulationMaterial[]).map((mat) => (
                          <button
                            key={mat}
                            onClick={() => handleParamChange('insulationMaterial', mat)}
                            className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                              params.insulationMaterial === mat
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {mat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Armor Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Armor Type</label>
                      <select
                        value={params.armorType}
                        onChange={(e) => handleParamChange('armorType', e.target.value as ArmorType)}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        <option value="Unarmored">Unarmored</option>
                        {params.cores === 1 ? (
                          <option value="AWA">AWA (Aluminum Wire)</option>
                        ) : (
                          <>
                            <option value="SWA">SWA (Steel Wire)</option>
                            <option value="STA">STA (Steel Tape)</option>
                            <option value="SFA">SFA (Steel Flat & Tape)</option>
                            <option value="RGB">RGB (Steel Wire & Tape)</option>
                            <option value="GSWB">GSWB (Steel Wire Braided)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Braid Coverage Input (GSWB only) */}
                    {params.armorType === 'GSWB' && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Braid Coverage (%)</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <input
                            type="range"
                            min="70"
                            max="95"
                            step="1"
                            value={params.braidCoverage || 90}
                            onChange={(e) => handleParamChange('braidCoverage', Number(e.target.value))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <span className="text-sm font-mono font-bold text-indigo-600 w-10 text-right">{params.braidCoverage || 90}%</span>
                        </div>
                      </div>
                    )}

                    {/* Sheath Material */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Outer Sheath Material</label>
                      <select
                        value={params.sheathMaterial}
                        onChange={(e) => handleParamChange('sheathMaterial', e.target.value as SheathMaterial)}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        <option value="PVC">PVC</option>
                        <option value="PE">PE</option>
                        <option value="LSZH">LSZH</option>
                      </select>
                    </div>

                    {/* Fire Resistant MGT Toggle */}
                    {params.standard === 'IEC 60502-1' && (
                      <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={params.hasMgt}
                              onChange={(e) => handleParamChange('hasMgt', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${params.hasMgt ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.hasMgt ? 'translate-x-4' : ''}`}></div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700 group-hover:text-orange-600 transition-colors">Fire Resistant (MGT)</span>
                            <span className="text-[10px] text-slate-400">Add Mica Glass Tape over conductor</span>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* MV Screen Selection */}
                    {params.standard === 'IEC 60502-2' && (
                      <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Metallic Screen Type</label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['CTS', 'CWS'] as MvScreenType[]).map((type) => (
                              <button
                                key={type}
                                onClick={() => handleParamChange('mvScreenType', type)}
                                className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                                  params.mvScreenType === type
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {type === 'CTS' ? 'Copper Tape (CTS)' : 'Copper Wire (CWS)'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {params.mvScreenType === 'CWS' && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Screen Size (mm²)</label>
                            <select
                              value={params.mvScreenSize}
                              onChange={(e) => handleParamChange('mvScreenSize', Number(e.target.value))}
                              className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                            >
                              {[16, 25, 35, 50, 70, 95].map((s) => (
                                <option key={s} value={s}>{s} mm²</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Update material prices (IDR/kg) to calculate the estimated HPP per meter.
                      </p>
                    </div>
                    
                    <PriceInput label="Copper (Cu)" value={materialPrices.Cu} onChange={(v) => setMaterialPrices(p => ({...p, Cu: v}))} />
                    <PriceInput label="Aluminum (Al)" value={materialPrices.Al} onChange={(v) => setMaterialPrices(p => ({...p, Al: v}))} />
                    <PriceInput label="XLPE" value={materialPrices.XLPE} onChange={(v) => setMaterialPrices(p => ({...p, XLPE: v}))} />
                    <PriceInput label="PVC" value={materialPrices.PVC} onChange={(v) => setMaterialPrices(p => ({...p, PVC: v}))} />
                    <PriceInput label="PE" value={materialPrices.PE} onChange={(v) => setMaterialPrices(p => ({...p, PE: v}))} />
                    <PriceInput label="LSZH" value={materialPrices.LSZH} onChange={(v) => setMaterialPrices(p => ({...p, LSZH: v}))} />
                    <PriceInput label="Steel (Armour)" value={materialPrices.Steel} onChange={(v) => setMaterialPrices(p => ({...p, Steel: v}))} />
                    <PriceInput label="Semi-Conductive" value={materialPrices.SemiCond} onChange={(v) => setMaterialPrices(p => ({...p, SemiCond: v}))} />
                    <PriceInput label="Mica Glass Tape (MGT)" value={materialPrices.MGT} onChange={(v) => setMaterialPrices(p => ({...p, MGT: v}))} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Cable Designation */}
            <div className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-6">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
              
              <div className="flex-1 text-center md:text-left z-10">
                <h3 className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">Cable Designation</h3>
                <div className="text-2xl md:text-4xl font-bold tracking-tight font-mono">
                  {params.conductorMaterial}{params.hasMgt ? '/MGT' : ''}/{params.insulationMaterial}/{params.armorType === 'Unarmored' ? '' : params.armorType + '/'}{params.sheathMaterial} {params.cores} x {params.size} mm² ({params.conductorType}) {result.electrical.voltageRating}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                  Overall Diameter: <span className="font-bold">{result.spec.overallDiameter} mm</span>
                </div>
              </div>

              <div className="z-10 bg-white/10 rounded-full backdrop-blur-sm p-4">
                <CableCrossSection 
                  cores={params.cores} 
                  armorType={params.armorType} 
                  conductorType={params.conductorType} 
                  standard={params.standard}
                  mvScreenType={params.mvScreenType}
                  hasMgt={params.hasMgt}
                  conductorMaterial={params.conductorMaterial}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Specification */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Technical Specification
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label="Conductor Diameter" value={result.spec.conductorDiameter} unit="mm" />
                  {result.spec.mgtThickness && (
                    <SpecRow label="Mica Glass Tape (MGT)" value={result.spec.mgtThickness} unit="mm" />
                  )}
                  {result.spec.conductorScreenThickness && (
                    <SpecRow label="Conductor Screen Thickness" value={result.spec.conductorScreenThickness} unit="mm" />
                  )}
                  <SpecRow label="Insulation Thickness" value={result.spec.insulationThickness} unit="mm" />
                  {result.spec.insulationScreenThickness && (
                    <SpecRow label="Insulation Screen Thickness" value={result.spec.insulationScreenThickness} unit="mm" />
                  )}
                  <SpecRow label="Core Diameter" value={result.spec.coreDiameter} unit="mm" />
                  
                  {result.spec.mvScreenDiameter && (
                    <SpecRow label={`Metallic Screen (${params.mvScreenType})`} value={result.spec.mvScreenDiameter} unit="mm" />
                  )}

                  {params.cores > 1 && (
                    <SpecRow label="Laid Up Diameter" value={result.spec.laidUpDiameter} unit="mm" />
                  )}
                  
                  {params.armorType !== 'Unarmored' && params.cores > 1 && (
                    <SpecRow label="Inner Covering Thickness" value={result.spec.innerCoveringThickness} unit="mm" />
                  )}
                  
                  {params.armorType !== 'Unarmored' && (
                    <>
                      <SpecRow label="Diameter Under Armor" value={result.spec.diameterUnderArmor} unit="mm" />
                      {result.spec.braidWireDiameter ? (
                        <>
                          <SpecRow label="Braid Wire Diameter" value={result.spec.braidWireDiameter} unit="mm" />
                          {result.spec.braidCoverage && (
                            <SpecRow label="Braid Coverage" value={result.spec.braidCoverage} unit="%" precision={0} />
                          )}
                        </>
                      ) : (
                        <SpecRow label="Armor Wire/Tape Thickness" value={result.spec.armorThickness} unit="mm" />
                      )}
                      <SpecRow label="Diameter Over Armor" value={result.spec.diameterOverArmor} unit="mm" />
                    </>
                  )}
                  
                  <SpecRow label="Outer Sheath Thickness" value={result.spec.sheathThickness} unit="mm" />
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <SpecRow label="Overall Diameter (Approx)" value={result.spec.overallDiameter} unit="mm" isBold />
                  </div>
                </div>
              </div>

              {/* Bill of Material */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    Bill of Material (per km)
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label={`Conductor (${params.conductorMaterial})`} value={result.bom.conductorWeight} unit="kg/km" />
                  {result.bom.mgtWeight > 0 && (
                    <SpecRow label="Mica Glass Tape (MGT)" value={result.bom.mgtWeight} unit="kg/km" />
                  )}
                  {result.bom.semiCondWeight > 0 && (
                    <SpecRow label="Semi-conductive Layers" value={result.bom.semiCondWeight} unit="kg/km" />
                  )}
                  <SpecRow label={`Insulation (${params.insulationMaterial})`} value={result.bom.insulationWeight} unit="kg/km" />
                  
                  {result.bom.mvScreenWeight > 0 && (
                    <SpecRow label={`Metallic Screen (${params.mvScreenType})`} value={result.bom.mvScreenWeight} unit="kg/km" />
                  )}

                  {params.armorType !== 'Unarmored' && params.cores > 1 && (
                    <SpecRow label="Inner Covering (PVC)" value={result.bom.innerCoveringWeight} unit="kg/km" />
                  )}
                  
                  {params.armorType !== 'Unarmored' && (
                    <SpecRow label={`Armor (${params.armorType})`} value={result.bom.armorWeight} unit="kg/km" />
                  )}
                  
                  <SpecRow label={`Outer Sheath (${params.sheathMaterial})`} value={result.bom.sheathWeight} unit="kg/km" />
                  
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <SpecRow label="Total Cable Weight (Approx)" value={result.bom.totalWeight} unit="kg/km" isBold />
                  </div>
                </div>
              </div>

              {/* Electrical Properties */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Electrical Properties
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label="Max DC Resistance @ 20°C" value={result.electrical.maxDcResistance} unit="Ω/km" precision={4} />
                  <SpecRow label="Current Capacity (In Air)" value={result.electrical.currentCapacityAir} unit="A" precision={0} />
                  <SpecRow label="Current Capacity (In Ground)" value={result.electrical.currentCapacityGround} unit="A" precision={0} />
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Test Voltage (5 min)</span>
                    <span className="font-mono text-slate-900">{result.electrical.testVoltage}</span>
                  </div>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Cost Analysis (HPP)
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Estimated HPP per Meter</div>
                    <div className="text-3xl font-bold text-indigo-600 font-mono">
                      Rp {currentHPP.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Conductor Cost:</span>
                      <span className="font-mono">Rp {((result.bom.conductorWeight * (params.conductorMaterial === 'Cu' ? materialPrices.Cu : materialPrices.Al)) / 1000).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Insulation Cost:</span>
                      <span className="font-mono">Rp {((result.bom.insulationWeight * (params.insulationMaterial === 'XLPE' ? materialPrices.XLPE : materialPrices.PVC)) / 1000).toLocaleString('id-ID')}</span>
                    </div>
                    {result.bom.armorWeight > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Armor Cost:</span>
                        <span className="font-mono">Rp {((result.bom.armorWeight * materialPrices.Steel) / 1000).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {result.bom.mvScreenWeight > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Screen Cost:</span>
                        <span className="font-mono">Rp {((result.bom.mvScreenWeight * materialPrices.Cu) / 1000).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {result.bom.mgtWeight > 0 && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>MGT Cost:</span>
                        <span className="font-mono">Rp {((result.bom.mgtWeight * materialPrices.MGT) / 1000).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Sheath Cost:</span>
                      <span className="font-mono">Rp {((result.bom.sheathWeight * (materialPrices[params.sheathMaterial as keyof typeof materialPrices] || materialPrices.PVC)) / 1000).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* General Data */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    General Data
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label="Max Operating Temperature" value={result.general.maxOperatingTemp} unit="°C" precision={0} />
                  <SpecRow label="Max Short Circuit Temp" value={result.general.shortCircuitTemp} unit="°C" precision={0} />
                  <SpecRow label="Min Bending Radius" value={result.general.minBendingRadius} unit="mm" />
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Standard Compliance</span>
                    <span className="font-mono text-slate-900 text-xs">{result.general.standardReference}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Flame Retardant</span>
                    <span className="font-mono text-slate-900 text-xs">{result.general.flameRetardant}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project List Section (Right Side) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <List className="w-6 h-6 text-indigo-600" />
                  Project List
                </h2>
                {projectItems.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    {projectItems.length}
                  </span>
                )}
              </div>

              {projectItems.length > 0 ? (
                <div className="space-y-4">
                  {projectItems.map((item) => (
                    <div key={item.params.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group relative">
                      <button
                        onClick={() => removeFromProject(item.params.id!)}
                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="font-mono text-xs font-bold text-slate-900 mb-1 pr-6">
                        {item.params.conductorMaterial}{item.params.hasMgt ? '/MGT' : ''}/{item.params.insulationMaterial}/{item.params.armorType === 'Unarmored' ? '' : item.params.armorType + '/'}{item.params.sheathMaterial} {item.params.cores} x {item.params.size} mm² ({item.params.conductorType}) {item.result.electrical.voltageRating}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100">
                          {item.params.standard}
                        </span>
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 font-mono">
                          OD: {item.result.spec.overallDiameter} mm
                        </span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Conductor ({item.params.conductorMaterial}):</span>
                          <span className="font-mono">{item.result.bom.conductorWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Insulation ({item.params.insulationMaterial}):</span>
                          <span className="font-mono">{item.result.bom.insulationWeight} kg/km</span>
                        </div>
                        {item.result.bom.armorWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Armor ({item.params.armorType}):</span>
                            <span className="font-mono">{item.result.bom.armorWeight} kg/km</span>
                          </div>
                        )}
                        {item.result.bom.mvScreenWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Screen ({item.params.mvScreenType}):</span>
                            <span className="font-mono">{item.result.bom.mvScreenWeight} kg/km</span>
                          </div>
                        )}
                        {item.result.bom.mgtWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>MGT:</span>
                            <span className="font-mono">{item.result.bom.mgtWeight} kg/km</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Sheath ({item.params.sheathMaterial}):</span>
                          <span className="font-mono">{item.result.bom.sheathWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 col-span-2 mt-1 pt-1 border-t border-slate-50">
                          <span>Total Weight:</span>
                          <span className="font-mono">{item.result.bom.totalWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-indigo-600 col-span-2 mt-1">
                          <span>HPP per Meter:</span>
                          <span className="font-mono">Rp {calculateHPP(item.result.bom, item.params).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={handleDownloadReport}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-all shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      Download Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <List className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">No items added yet.<br/>Configure a cable and click "Add to Project".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ label, value, unit, isBold = false, precision = 2 }: { label: string; value: number; unit: string; isBold?: boolean; precision?: number }) {
  return (
    <div className={`flex justify-between items-center py-1 ${isBold ? 'font-bold text-slate-900' : 'text-sm text-slate-600'}`}>
      <span>{label}</span>
      <span className="font-mono text-slate-900">
        {value.toFixed(precision)} <span className="text-slate-400 text-xs ml-1">{unit}</span>
      </span>
    </div>
  );
}

function PriceInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-slate-400 text-xs">Rp</span>
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
        />
      </div>
    </div>
  );
}
