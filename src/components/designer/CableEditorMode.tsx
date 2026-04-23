import React from 'react';
import { 
  FilePlus, Save, FolderOpen, LogOut, Check, X, 
  Settings, ChevronRight, Download, Trash2, Edit3, 
  Layers, Database, Search, PlusCircle, Monitor,
  Zap, Package, List, TrendingUp, Shield, Activity,
  Maximize2
} from 'lucide-react';
import { 
  CableDesignParams, 
  CalculationResult, 
  CABLE_SIZES,
  CableStandard
} from '../../utils/cableCalculations';
import { CABLE_STANDARDS } from '../../utils/designerData';
import { CableCrossSection } from './CableCrossSection';

interface CableEditorModeProps {
  params: CableDesignParams;
  result: CalculationResult;
  onParamChange: (key: keyof CableDesignParams, value: any) => void;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onExport: () => void;
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  materialPrices: Record<string, number>;
  materialCategories: Record<string, string>;
  materialDensities: Record<string, number>;
  lmeParams: any;
}

export function CableEditorMode({
  params,
  result,
  onParamChange,
  onNew,
  onSave,
  onOpen,
  onExport,
  activeLayer,
  setActiveLayer,
  materialPrices,
  materialCategories
}: CableEditorModeProps) {
  const [mobileView, setMobileView] = React.useState<'preview' | 'editor' | 'steps'>('preview');

  const activeStep = activeLayer;
  const setActiveStep = (step: string) => {
    setActiveLayer(step);
    setMobileView('editor');
  };

  const getSteps = () => {
    const isAAC = params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)';
    const isNYA = params.standard.includes('(NYAF)') || params.standard.includes('(NYA)');

    const steps = [
      { id: 'general', label: 'General', icon: Settings },
      { id: 'bulk', label: 'Bulk Calculation', icon: List },
      { id: 'conductor', label: 'Conductor', icon: Layers },
    ];

    if (!isAAC && !isNYA) {
      steps.push({ id: 'earthing', label: 'Earthing', icon: Shield });
    }

    steps.push({ id: 'insulation', label: 'Insulation', icon: Package });

    if (!isAAC && !isNYA && params.standard !== 'IEC 60092-353') {
      steps.push({ id: 'innerSheath', label: 'Inner Sheath', icon: Layers });
    }

    // Screen (Always show if not AAC/NYA so user can enable it)
    if (!isAAC && !isNYA) {
      steps.push({ id: 'screen', label: 'Screen', icon: Activity });
    }
    
    if (!isAAC) {
      steps.push({ id: 'separator', label: 'Separator', icon: Layers });
    }

    if (!isAAC && !isNYA) {
      steps.push({ id: 'armour', label: 'Armour', icon: Shield });
    }

    if (!isAAC && !isNYA) {
      steps.push({ id: 'outerSheath', label: 'Outer Sheath', icon: Package });
    }

    return steps;
  };

  const steps = getSteps();

  const FormField = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );

  const renderEditor = () => {
    switch (activeStep) {
      case 'general':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField label="Standard Reference">
              <select
                value={params.standard}
                onChange={(e) => onParamChange('standard', e.target.value as CableStandard)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {CABLE_STANDARDS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Voltage Rating (Uo/U)">
              <select
                value={params.voltage}
                onChange={(e) => onParamChange('voltage', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                 <option value="0.6/1 kV">0.6/1 kV</option>
                 <option value="300/500 V">300/500 V</option>
                 <option value="450/750 V">450/750 V</option>
                 <option value="3.6/6 kV">3.6/6 kV</option>
                 <option value="6/10 kV">6/10 kV</option>
                 <option value="8.7/15 kV">8.7/15 kV</option>
                 <option value="12/20 kV">12/20 kV</option>
                 <option value="18/30 kV">18/30 kV</option>
              </select>
            </FormField>
            <FormField label="Design Mode">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => onParamChange('mode', 'standard')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    params.mode === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => onParamChange('mode', 'advance')}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                    params.mode === 'advance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Advance
                </button>
              </div>
            </FormField>
            <div className="pt-4 border-t border-slate-100">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Properties</h4>
               <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">Fireguard</span>
                      <span className="text-[10px] text-slate-400 italic">MGT Tape</span>
                    </div>
                    <Toggle checked={params.fireguard || false} onChange={(val) => onParamChange('fireguard', val)} />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">Stopfire</span>
                      <span className="text-[10px] text-slate-400 italic">FR Compound</span>
                    </div>
                    <Toggle checked={params.stopfire || false} onChange={(val) => onParamChange('stopfire', val)} color="bg-red-500" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">Auto Switch to RGB</span>
                      <span className="text-[10px] text-slate-400 italic">Small Size Optimization</span>
                    </div>
                    <Toggle checked={params.autoSwitchSfaToRgb || false} onChange={(val) => onParamChange('autoSwitchSfaToRgb', val)} />
                  </label>
                </div>
            </div>
          </div>
        );

      case 'bulk':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-8">
             <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                <List className="w-8 h-8 text-indigo-400" />
             </div>
             <h3 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">Bulk Mode</h3>
             <p className="text-[10px] text-slate-500 italic max-w-[200px] mx-auto leading-relaxed">
                Bulk calculation input is optimized for the modern layout. Please use the modern view to enter multi-core/size data.
             </p>
          </div>
        );

      case 'conductor':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Number of Cores">
                <input 
                  type="number"
                  value={params.cores}
                  min={1}
                  onChange={(e) => onParamChange('cores', Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                />
              </FormField>
              <FormField label="Size (mm²)">
                <select
                  value={params.size}
                  onChange={(e) => onParamChange('size', Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {CABLE_SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Conductor Material">
              <select
                value={params.conductorMaterial}
                onChange={(e) => onParamChange('conductorMaterial', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="Cu">Copper (CU)</option>
                <option value="Al">Aluminium (AL)</option>
              </select>
            </FormField>
            <FormField label="Construction Type">
              <select
                value={params.conductorType}
                onChange={(e) => onParamChange('conductorType', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="rm">rm (Round Stranded)</option>
                <option value="re">re (Round Solid)</option>
                <option value="sm">sm (Sector Stranded)</option>
                <option value="f">f (Flexible Class 5)</option>
                <option value="cm">cm (Compact Stranded)</option>
              </select>
            </FormField>
          </div>
        );

      case 'earthing':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Use Earthing Core</span>
                  <Toggle checked={params.hasEarthing || false} onChange={(val) => onParamChange('hasEarthing', val)} color="bg-emerald-500" />
                </label>
                
                {params.hasEarthing && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <FormField label="E. Core Count">
                       <select 
                         value={params.earthingCores || 0}
                         onChange={(e) => onParamChange('earthingCores', Number(e.target.value))}
                         className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700"
                       >
                         <option value={1}>1 Core</option>
                         <option value={2}>2 Cores</option>
                         <option value={3}>3 Cores</option>
                       </select>
                    </FormField>
                    <FormField label="E. Core Size (mm²)">
                       <select 
                         value={params.earthingSize || 0}
                         onChange={(e) => onParamChange('earthingSize', Number(e.target.value))}
                         className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700"
                       >
                         {CABLE_SIZES.map(s => (
                           <option key={s} value={s}>{s} mm²</option>
                         ))}
                       </select>
                    </FormField>
                  </div>
                )}
             </div>
          </div>
        );

      case 'insulation':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <FormField label="Material">
              <select
                value={params.insulationMaterial}
                onChange={(e) => onParamChange('insulationMaterial', e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {Object.keys(materialPrices).filter(m => materialCategories[m]?.includes('Insulation')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </FormField>
            <div className="p-5 border-2 border-orange-400 bg-orange-50/30 rounded-2xl relative space-y-4">
                <div className="absolute -top-3 left-4 bg-white px-2 ring-1 ring-orange-400 rounded-full">
                   <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.1em]">Calculated Data</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField label="Thickness (mm)">
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        step={0.1}
                        value={params.manualInsulationThickness || (result.spec.phaseCore?.insulationThickness || 0).toFixed(2)}
                        onChange={(e) => onParamChange('manualInsulationThickness', Number(e.target.value))}
                        className="w-full p-2 bg-white border border-orange-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                  </FormField>
                  <FormField label="Core Dia (mm)">
                    <div className="p-2 bg-slate-100/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-400 text-center">
                       {(result.spec.phaseCore?.coreDiameter || 0).toFixed(2)}
                    </div>
                  </FormField>
                </div>
            </div>
          </div>
        );

      case 'screen':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             {params.standard === 'IEC 60502-2' ? (
                <>
                   <FormField label="MV Screen Type">
                      <select
                        value={params.mvScreenType || 'None'}
                        onChange={(e) => onParamChange('mvScreenType', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="None">None</option>
                        <option value="CTS">CTS (Copper Tape)</option>
                        <option value="CWS">CWS (Copper Wire)</option>
                      </select>
                   </FormField>
                   {params.mvScreenType !== 'None' && (
                     <FormField label="Screen Area (mm²)">
                        <select
                          value={params.mvScreenSize || 16}
                          onChange={(e) => onParamChange('mvScreenSize', Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                        >
                          {[16, 25, 35, 50, 70, 95].map(s => (
                            <option key={s} value={s}>{s} mm²</option>
                          ))}
                        </select>
                     </FormField>
                   )}
                </>
             ) : (
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-4">
                   <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-slate-700">Apply Screen</span>
                      <Toggle checked={params.hasScreen || false} onChange={(val) => onParamChange('hasScreen', val)} color="bg-sky-500" />
                   </label>
                   {params.hasScreen && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                         <FormField label="Screen Type">
                            <select
                              value={params.screenType || 'CTS'}
                              onChange={(e) => onParamChange('screenType', e.target.value)}
                              className="w-full p-2 bg-white border border-sky-200 rounded-lg text-xs font-bold"
                            >
                               <option value="CTS">CTS (Copper Tape)</option>
                               <option value="CWS">CWS (Copper Wire)</option>
                            </select>
                         </FormField>
                         <FormField label="Screen Area (mm²)">
                            <select
                              value={params.screenSize || 16}
                              onChange={(e) => onParamChange('screenSize', Number(e.target.value))}
                              className="w-full p-2 bg-white border border-sky-200 rounded-lg text-xs font-bold"
                            >
                               {[1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70].map(s => (
                                 <option key={s} value={s}>{s} mm²</option>
                               ))}
                            </select>
                         </FormField>
                      </div>
                   )}
                </div>
             )}
          </div>
        );

      case 'innerSheath':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold text-slate-700">Apply Inner Sheath</span>
                  <Toggle checked={params.hasInnerSheath !== false} onChange={(val) => onParamChange('hasInnerSheath', val)} color="bg-rose-500" />
                </label>
                {params.hasInnerSheath !== false && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                       <FormField label="Material">
                          <select
                            value={params.innerSheathMaterial || 'PVC'}
                            onChange={(e) => onParamChange('innerSheathMaterial', e.target.value)}
                            className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold"
                          >
                            {Object.keys(materialPrices).filter(m => materialCategories[m]?.includes('Sheath') || materialCategories[m]?.includes('Filler')).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                       </FormField>
                       <FormField label="Thickness (mm)">
                          <input 
                            type="number"
                            step={0.1}
                            value={params.manualInnerSheathThickness || (result.spec.innerCoveringThickness || 0).toFixed(1)}
                            onChange={(e) => onParamChange('manualInnerSheathThickness', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs font-bold"
                          />
                       </FormField>
                   </div>
                )}
             </div>
          </div>
        );

      case 'separator':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-bold text-slate-700">Use Separator Tape</span>
                  <Toggle checked={params.hasSeparator || false} onChange={(val) => onParamChange('hasSeparator', val)} color="bg-slate-500" />
                </label>
                {params.hasSeparator && (
                   <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <FormField label="Material">
                         <select
                           value={params.separatorMaterial || 'PVC'}
                           onChange={(e) => onParamChange('separatorMaterial', e.target.value)}
                           className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                         >
                           {Object.keys(materialPrices).filter(m => materialCategories[m]?.includes('Sheath')).map(m => (
                             <option key={m} value={m}>{m}</option>
                           ))}
                         </select>
                      </FormField>
                      <FormField label="Thickness (mm)">
                          <input 
                            type="number"
                            step={0.05}
                            value={params.manualSeparatorThickness || (result.spec.separatorThickness || 0).toFixed(2)}
                            onChange={(e) => onParamChange('manualSeparatorThickness', Number(e.target.value))}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                       </FormField>
                   </div>
                )}
             </div>
          </div>
        );

      case 'armour':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
             <FormField label="Armour Type">
               <select
                 value={params.armorType}
                 onChange={(e) => onParamChange('armorType', e.target.value)}
                 className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
               >
                 <option value="Unarmored">Unarmored</option>
                 <option value="SWA">SWA (Steel Wire)</option>
                 <option value="STA">STA (Steel Tape)</option>
                 <option value="AWA">AWA (Alum Wire)</option>
                 <option value="SFA">SFA (Steel Flat)</option>
                 <option value="RGB">RGB (Round Galv. Bead)</option>
                 <option value="GSWB">GSWB (Steel Braid)</option>
                 <option value="TCWB">TCWB (Tin Copper Braid)</option>
               </select>
             </FormField>
             {params.armorType !== 'Unarmored' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                   <FormField label="Armor Wire/Tape Size (mm)">
                      <input 
                        type="number"
                        step={0.01}
                        value={params.manualArmorWireDiameter || params.manualArmorTapeThickness || (result.spec.armorWireDiameter || result.spec.armorTapeThickness || 0).toFixed(2)}
                        onChange={(e) => {
                           if (['SWA', 'AWA', 'RGB'].includes(params.armorType)) {
                              onParamChange('manualArmorWireDiameter', Number(e.target.value));
                           } else {
                              onParamChange('manualArmorTapeThickness', Number(e.target.value));
                           }
                        }}
                        className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-bold transition-all focus:ring-2 focus:ring-amber-500"
                      />
                   </FormField>
                </div>
             )}
          </div>
        );

      case 'outerSheath':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <FormField label="Material">
                <select
                  value={params.sheathMaterial}
                  onChange={(e) => onParamChange('sheathMaterial', e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  {Object.keys(materialPrices).filter(m => materialCategories[m]?.includes('Sheath')).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
             </FormField>
             <FormField label="Thickness (mm)">
                <input 
                  type="number"
                  step={0.1}
                  value={params.manualSheathThickness || (result.spec.sheathThickness || 0).toFixed(1)}
                  onChange={(e) => onParamChange('manualSheathThickness', Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
                />
             </FormField>
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
                <label className="flex items-center justify-between cursor-pointer group">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">Apply Outer Sheath</span>
                   </div>
                   <Toggle checked={params.hasOuterSheath !== false} onChange={(val) => onParamChange('hasOuterSheath', val)} />
                </label>
             </div>
          </div>
        );

      case 'advanced':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <Maximize2 className="w-4 h-4 text-amber-600" />
                   <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Manual Overrides</h4>
                </div>
                <FormField label="Target Diameter (mm)">
                   <input 
                     type="number"
                     placeholder={result.spec.overallDiameter.toFixed(1)}
                     className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900"
                   />
                </FormField>
                <div className="pt-2">
                   <p className="text-[9px] text-amber-600 italic">Note: Advanced manual overrides for specific layer thicknesses can be found in the modern mode's footer section.</p>
                </div>
             </div>
          </div>
        );

      default:
        return (
          <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 animate-in zoom-in duration-500">
             <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Activity className="w-8 h-8 text-slate-200" />
             </div>
             <h4 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] mb-2">Editor Ready</h4>
             <p className="text-[10px] font-medium text-slate-400 italic max-w-[200px] mx-auto leading-relaxed">
                This design step is being optimized. You can configure it using the modern interface or standard parameters.
             </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-700 font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="h-8 bg-slate-100 flex items-center px-4 justify-between border-b border-slate-200 select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded-md flex items-center justify-center shadow-lg shadow-indigo-100">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cable Designer Pro</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{layoutModeLabel(params)}</span>
          </div>
          <div className="w-px h-3 bg-slate-300"></div>
          <button className="hover:text-rose-500 transition-colors" onClick={() => window.location.reload()}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 gap-2 shadow-sm relative z-20 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <ToolbarGroup title="Project">
            <ToolbarButton icon={<FilePlus className="w-4 h-4" />} onClick={onNew} title="New project" />
            <ToolbarButton icon={<FolderOpen className="w-4 h-4" />} onClick={onOpen} title="Open" />
            <ToolbarButton icon={<Save className="w-4 h-4" />} onClick={onSave} title="Save project" />
          </ToolbarGroup>
          <div className="w-px h-8 bg-slate-200 mx-1" />
          <ToolbarGroup title="Actions">
            <ToolbarButton icon={<Download className="w-4 h-4" />} onClick={onExport} title="Export to Excel" />
            <ToolbarButton icon={<LogOut className="w-4 h-4" />} onClick={() => {}} title="Return to home" />
          </ToolbarGroup>
        </div>
        <div className="flex-1 md:block hidden"></div>
        <div className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 rounded-2xl border border-slate-200 min-w-max ml-auto">
           <div className="flex flex-col text-right">
              <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Overall Dia</span>
              <span className="text-sm md:text-lg font-black text-indigo-600 leading-none">{result.spec.overallDiameter.toFixed(1)}<span className="text-[10px] ml-0.5">mm</span></span>
           </div>
           <div className="w-px h-8 bg-slate-200"></div>
           <div className="flex flex-col text-right">
              <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Weight</span>
              <span className="text-sm md:text-lg font-black text-indigo-600 leading-none">{Math.round(result.bom.totalWeight)}<span className="text-[10px] ml-0.5">kg</span></span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Dynamic Steps */}
        <div className={`
          ${mobileView === 'steps' ? 'flex w-full absolute inset-0 z-50 bg-white' : 'hidden'} 
          md:relative md:flex md:w-72 md:z-10
          bg-white border-r border-slate-200 flex-col p-5 shadow-[4px_0_20px_rgba(0,0,0,0.02)]
        `}>
          <div className="mb-6 flex justify-between items-center">
             <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Design Path</h3>
                <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
             </div>
             <button className="md:hidden p-2 text-slate-400" onClick={() => setMobileView('preview')}>
                <X className="w-5 h-5" />
             </button>
          </div>
          <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 flex-1 pb-4">
            {steps.map(step => (
              <div 
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-4 p-3.5 rounded-2xl cursor-pointer transition-all border group relative ${
                  activeStep === step.id 
                    ? 'bg-indigo-600 border-indigo-700 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] scale-[1.02]' 
                    : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all ${activeStep === step.id ? 'bg-indigo-500 text-white rotate-6' : 'bg-slate-50 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'}`}>
                   <step.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black tracking-[0.15em] border-b-2 transition-colors duration-300 ${activeStep === step.id ? 'text-white border-indigo-400' : 'text-slate-500 border-transparent'}`}>
                    {step.label}
                  </span>
                </div>
                {activeStep === step.id && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: Visualizer */}
        <div className={`
          ${mobileView === 'preview' ? 'flex' : 'hidden md:flex'} 
          flex-1 flex-col bg-slate-50 relative p-4 md:p-12 overflow-hidden
        `}>
           {/* Grid Pattern Background */}
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Outer Glow Circle */}
              <div className="absolute w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-500/5 blur-[50px] md:blur-[100px] rounded-full animate-pulse pointer-events-none"></div>
              
              <div className="relative w-full max-w-[280px] md:max-w-lg aspect-square bg-white rounded-[2rem] md:rounded-[3rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),inset_0_-2px_20px_rgba(0,0,0,0.05)] border border-white p-6 md:p-12 flex items-center justify-center group overflow-hidden animate-in zoom-in duration-700">
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/80 to-white/50 pointer-events-none"></div>
                 
                 <div className="relative z-10 w-full h-full transform hover:scale-[1.03] transition-transform duration-500 cursor-zoom-in">
                    <CableCrossSection params={params} result={result} />
                 </div>
                 
                 {/* Corner Accents */}
                 <div className="absolute top-4 md:top-8 left-4 md:left-8 w-6 md:w-8 h-6 md:h-8 border-t-2 border-l-2 border-slate-200 rounded-tl-lg md:rounded-tl-xl opacity-50"></div>
                 <div className="absolute top-4 md:top-8 right-4 md:right-8 w-6 md:w-8 h-6 md:h-8 border-t-2 border-r-2 border-slate-200 rounded-tr-lg md:rounded-tr-xl opacity-50"></div>
                 <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 w-6 md:w-8 h-6 md:h-8 border-b-2 border-l-2 border-slate-200 rounded-bl-lg md:rounded-bl-xl opacity-50"></div>
                 <div className="absolute bottom-4 md:bottom-8 right-4 md:right-8 w-6 md:w-8 h-6 md:h-8 border-b-2 border-r-2 border-slate-200 rounded-br-lg md:rounded-br-xl opacity-50"></div>
              </div>
           </div>
           
           <div className="mt-6 md:mt-12 flex justify-center gap-2 md:gap-3">
              <ActionButton icon={<Monitor className="w-4 h-4" />} label="Reset" />
              <ActionButton icon={<Maximize2 className="w-4 h-4" />} label="Full" />
           </div>
        </div>

        {/* Right Panel: Step Editor */}
        <div className={`
          ${mobileView === 'editor' ? 'flex w-full absolute inset-0 z-50 bg-white' : 'hidden'} 
          md:relative md:flex md:w-80 md:z-10
          bg-white border-l border-slate-200 flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)]
        `}>
          <div className="p-4 md:p-6 border-b border-slate-100/50 bg-slate-50/30 flex items-center justify-between">
             <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                   <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Configuration</span>
                   <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                   </div>
                </div>
                <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">
                  {steps.find(s => s.id === activeStep)?.label}
                </h2>
             </div>
             <button className="md:hidden p-2 text-slate-400" onClick={() => setMobileView('preview')}>
                <X className="w-5 h-5" />
             </button>
          </div>
          
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
             {renderEditor()}
          </div>

          <div className="p-4 md:p-6 bg-slate-50/80 border-t border-slate-100 backdrop-blur-sm">
             <button
               onClick={onSave}
               className="w-full relative group overflow-hidden py-3 md:py-4 bg-slate-900 text-white rounded-xl md:rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:bg-black active:scale-[0.98]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                   <Save className="w-4 h-4" /> 
                   <span>Sync & Save</span>
                </div>
             </button>
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="md:hidden h-16 bg-white border-t border-slate-200 flex items-center justify-around px-4 fixed bottom-0 left-0 right-0 z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
           <button 
             onClick={() => setMobileView('steps')}
             className={`flex flex-col items-center gap-1 transition-colors ${mobileView === 'steps' ? 'text-indigo-600' : 'text-slate-400'}`}
           >
              <List className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Path</span>
           </button>
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center -mt-8 shadow-xl shadow-indigo-200 border-4 border-white" onClick={() => setMobileView('preview')}>
              <Monitor className={`w-6 h-6 text-white transition-transform ${mobileView === 'preview' ? 'scale-110' : 'scale-90 opacity-80'}`} />
           </div>
           <button 
             onClick={() => setMobileView('editor')}
             className={`flex flex-col items-center gap-1 transition-colors ${mobileView === 'editor' ? 'text-indigo-600' : 'text-slate-400'}`}
           >
              <Edit3 className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">Edit</span>
           </button>
        </div>
      </div>
    </div>
  );
}

function ToolbarGroup({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 items-center">
       <div className="flex gap-1">
          {children}
       </div>
       <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</span>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:border-indigo-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-all active:scale-[0.85] group relative"
      title={title}
    >
      <div className="transition-transform group-hover:scale-110">
        {icon}
      </div>
    </button>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-3 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 group">
       <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">{icon}</div>
       <span>{label}</span>
    </button>
  );
}

function Toggle({ checked, onChange, color = 'bg-indigo-600' }: { checked: boolean, onChange: (val: boolean) => void, color?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${checked ? color : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5.5' : 'translate-x-1'}`} />
    </button>
  );
}

function layoutModeLabel(p: CableDesignParams) {
  if (p.standard === 'IEC 60502-2') return 'Medium Voltage System';
  if (p.standard === 'BS EN 50288-7') return 'Instrumentation Mode';
  if (!p.standard) return 'Unknown Standard';
  return 'Standard Edition';
}
