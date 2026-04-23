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

  const activeStep = activeLayer;
  const setActiveStep = setActiveLayer;

  const getSteps = () => {
    const steps = [
      { id: 'general', label: 'GENERAL', icon: Settings },
      { id: 'properties', label: 'PROPERTIES', icon: Zap },
      { id: 'conductor', label: 'CONDUCTOR', icon: Layers },
    ];

    const isAAC = params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)';
    const isNYA = params.standard.includes('(NYAF)') || params.standard.includes('(NYA)');

    if (!isAAC && !isNYA) {
      steps.push({ id: 'earthing', label: 'EARTHING', icon: Shield });
    }

    steps.push({ id: 'insulation', label: 'INSULATION', icon: Package });

    if (params.standard === 'IEC 60502-2') {
      steps.push({ id: 'screen', label: 'INSULATION SCREEN', icon: Activity });
    }

    if (params.standard !== 'IEC 60092-353' && !isAAC && !isNYA) {
      steps.push({ id: 'innerCovering', label: 'INNER COVERING', icon: Layers });
    }

    if (params.standard === 'BS EN 50288-7' || (params.standard === 'Manufacturing Specification' && params.hasScreen)) {
        steps.push({ id: 'overallScreen', label: 'OVERALL SCREEN', icon: Shield });
    }

    steps.push({ id: 'innerLayers', label: 'INNER LAYERS', icon: Database });
    steps.push({ id: 'outerLayers', label: 'OUTER LAYERS', icon: Package });

    steps.push({ id: 'advanced', label: 'ADVANCED', icon: Maximize2 });

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
          </div>
        );

      case 'properties':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Fireguard</span>
                  <span className="text-[10px] text-slate-400 italic">Mica Glass Tape</span>
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
          </div>
        );

      case 'outerLayers':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <FormField label="Armor Type">
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
               </select>
             </FormField>
             <FormField label="Outer Sheath material">
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
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Use Separator Tape</span>
                      <span className="text-[9px] text-slate-400 italic">Between armor and sheath</span>
                   </div>
                   <Toggle checked={params.hasSeparator || false} onChange={(val) => onParamChange('hasSeparator', val)} color="bg-slate-500" />
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
      <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-2 shadow-sm relative z-20">
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
        <div className="flex-1"></div>
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
           <div className="flex flex-col text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Overall Dia</span>
              <span className="text-lg font-black text-indigo-600 leading-none">{result.spec.overallDiameter.toFixed(1)}<span className="text-[10px] ml-0.5">mm</span></span>
           </div>
           <div className="w-px h-8 bg-slate-200"></div>
           <div className="flex flex-col text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Weight</span>
              <span className="text-lg font-black text-indigo-600 leading-none">{Math.round(result.bom.totalWeight)}<span className="text-[10px] ml-0.5">kg</span></span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Dynamic Steps */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col p-5 shadow-[4px_0_20px_rgba(0,0,0,0.02)] relative z-10">
          <div className="mb-6">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Design Path</h3>
             <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
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
        <div className="flex-1 flex flex-col bg-slate-50 relative p-12 overflow-hidden">
           {/* Grid Pattern Background */}
           <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center relative">
              {/* Outer Glow Circle */}
              <div className="absolute w-[600px] h-[600px] bg-indigo-500/5 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>
              
              <div className="relative w-full max-w-lg aspect-square bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1),inset_0_-2px_20px_rgba(0,0,0,0.05)] border border-white p-12 flex items-center justify-center group overflow-hidden animate-in zoom-in duration-700">
                 <div className="absolute inset-0 bg-gradient-to-tr from-slate-50/80 to-white/50 pointer-events-none"></div>
                 
                 <div className="relative z-10 w-full h-full transform hover:scale-[1.03] transition-transform duration-500 cursor-zoom-in">
                    <CableCrossSection params={params} result={result} />
                 </div>
                 
                 {/* Corner Accents */}
                 <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-slate-200 rounded-tl-xl opacity-50"></div>
                 <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-slate-200 rounded-tr-xl opacity-50"></div>
                 <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-slate-200 rounded-bl-xl opacity-50"></div>
                 <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-slate-200 rounded-br-xl opacity-50"></div>
              </div>
           </div>
           
           <div className="mt-12 flex justify-center gap-3">
              <ActionButton icon={<Monitor className="w-4 h-4" />} label="Reset View" />
              <ActionButton icon={<Maximize2 className="w-4 h-4" />} label="Actual Size" />
           </div>
        </div>

        {/* Right Panel: Step Editor */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.02)] relative z-10">
          <div className="p-6 border-b border-slate-100/50 bg-slate-50/30">
             <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Configuration</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                   <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
             </div>
             <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
               {steps.find(s => s.id === activeStep)?.label}
             </h2>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
             {renderEditor()}
          </div>

          <div className="p-6 bg-slate-50/80 border-t border-slate-100 backdrop-blur-sm">
             <button
               onClick={onSave}
               className="w-full relative group overflow-hidden py-4 bg-slate-900 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:bg-black active:scale-[0.98]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                   <Save className="w-4 h-4" /> 
                   <span>Sync & Save</span>
                </div>
             </button>
          </div>
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
  return 'Standard Edition';
}
