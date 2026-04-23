import React, { useState } from 'react';
import { 
  FilePlus, Save, FolderOpen, LogOut, Check, X, 
  Settings, ChevronRight, Download, Trash2, Edit3, 
  Layers, Database, Search, PlusCircle, Monitor
} from 'lucide-react';
import { CableDesignParams, CalculationResult } from '../../utils/cableCalculations';
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
}

const LAYERS = [
  { id: 'conductor', label: 'Conductor' },
  { id: 'conductor_shield', label: 'Conductor shield' },
  { id: 'insulation', label: 'Insulation' },
  { id: 'insulation_screen', label: 'Insulation screen' },
  { id: 'sheath', label: 'Sheath' },
  { id: 'sheath_tape', label: 'Sheath reinforcing tape' },
  { id: 'neutral', label: 'Concentric neutral' },
  { id: 'bedding', label: 'Armour bedding' },
  { id: 'armour', label: 'Armour' },
  { id: 'jacket', label: 'Jacket/Serving' },
];

export function CableEditorMode({
  params,
  result,
  onParamChange,
  onNew,
  onSave,
  onOpen,
  onExport,
  activeLayer,
  setActiveLayer
}: CableEditorModeProps) {
  
  const isLayerActive = (id: string) => {
    switch (id) {
      case 'conductor': return true;
      case 'conductor_shield': return !!result.spec.conductorScreenThickness;
      case 'insulation': return true;
      case 'insulation_screen': return !!result.spec.insulationScreenThickness;
      case 'sheath': return params.hasInnerSheath;
      case 'sheath_tape': return false; // Not implemented yet
      case 'neutral': return params.hasScreen;
      case 'bedding': return params.armorType !== 'Unarmored' && result.spec.innerCoveringThickness > 0;
      case 'armour': return params.armorType !== 'Unarmored';
      case 'jacket': return params.hasOuterSheath !== false;
      default: return false;
    }
  };

  const toggleLayer = (id: string) => {
    switch (id) {
      case 'conductor_shield': 
        // Logic for screens varies, this is just a mockup toggle
        break;
      case 'insulation_screen':
        break;
      case 'sheath':
        onParamChange('hasInnerSheath', !params.hasInnerSheath);
        break;
      case 'neutral':
        onParamChange('hasScreen', !params.hasScreen);
        break;
      case 'armour':
        onParamChange('armorType', params.armorType === 'Unarmored' ? 'SWA' : 'Unarmored');
        break;
      case 'jacket':
        onParamChange('hasOuterSheath', params.hasOuterSheath === false);
        break;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] text-slate-700 font-sans overflow-hidden border border-slate-300 shadow-2xl rounded-lg">
      {/* OS Bar Title */}
      <div className="h-8 bg-[#e5e7eb] flex items-center px-3 justify-between border-b border-slate-300 select-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-indigo-600 rounded flex items-center justify-center">
            <Layers className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-600">Cable Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-6 hover:bg-slate-200 flex items-center justify-center rounded transition-colors cursor-pointer group">
            <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="h-14 bg-[#f9fafb] border-b border-slate-200 flex items-center px-4 gap-1">
        <ToolbarButton icon={<FilePlus className="w-5 h-5" />} onClick={onNew} title="New project" />
        <ToolbarButton icon={<Save className="w-5 h-5" />} onClick={onSave} title="Save" />
        <ToolbarButton icon={<FolderOpen className="w-5 h-5" />} onClick={onOpen} title="Open" />
        <div className="w-px h-8 bg-slate-300 mx-2" />
        <ToolbarButton icon={<LogOut className="w-5 h-5" />} onClick={onExport} title="Exit/Export" />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Panel: Layers Selection */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4">
          <h3 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-4">Select cable layers:</h3>
          <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-2">
            {LAYERS.map(layer => (
              <div 
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                  activeLayer === layer.id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div onClick={(e) => { e.stopPropagation(); toggleLayer(layer.id); }} className="cursor-pointer">
                  {isLayerActive(layer.id) ? (
                    <div className="w-5 h-5 bg-blue-50 border border-blue-200 rounded flex items-center justify-center">
                       <Check className="w-3.5 h-3.5 text-blue-600 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                       <X className="w-3.5 h-3.5 text-red-600 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isLayerActive(layer.id) ? 'text-slate-700' : 'text-slate-400'}`}>
                  {layer.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: Cable Preview */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden p-6 gap-4">
           {/* General Settings Link */}
           <div className="flex justify-center">
              <button className="text-[11px] font-bold text-indigo-600 underline hover:text-indigo-800 transition-colors">
                General Settings
              </button>
           </div>
           
           <div className="flex-1 border border-slate-100 rounded-xl bg-slate-50 relative overflow-hidden group">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
              <CableCrossSection params={params} result={result} />
           </div>

           {/* Click to change ordering */}
           <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center bg-white cursor-pointer hover:border-indigo-500 transition-colors">
                 <Monitor className="w-4 h-4 text-slate-400" />
              </div>
              <button className="text-[10px] font-bold text-indigo-600 underline hover:text-indigo-800 transition-colors">
                Click to change ordering
              </button>
           </div>
        </div>

        {/* Right Panel: Layer Details */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{activeLayer.replace('_', ' ')}</h2>
          </div>
          
          <div className="p-6 flex flex-col gap-6">
             {/* Material Selection */}
             <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material</label>
                <select 
                  value={activeLayer === 'conductor' ? params.conductorMaterial : (activeLayer === 'insulation' ? params.insulationMaterial : (activeLayer === 'jacket' ? params.sheathMaterial : ''))}
                  onChange={(e) => {
                    const val = (e.target as HTMLSelectElement).value;
                    if (activeLayer === 'conductor') onParamChange('conductorMaterial', val);
                    if (activeLayer === 'insulation') onParamChange('insulationMaterial', val);
                    if (activeLayer === 'jacket') onParamChange('sheathMaterial', val);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7' /%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem' }}
                >
                  <option value="Copper">Copper</option>
                  <option value="Aluminium">Aluminium</option>
                  <option value="XLPE">XLPE_Unfilled_gre..</option>
                  <option value="PVC">Polyethylene</option>
                  <option value="HDPE">HDPE</option>
                </select>
             </div>

             {/* Dimensions */}
             <div className="p-6 border-2 border-orange-400 rounded-xl relative space-y-4">
                <div className="absolute -top-3 left-4 bg-white px-2">
                   <span className="text-[11px] font-black text-slate-800">Dimensions</span>
                </div>
                
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-500">Thickness (mm)</label>
                   <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        className="w-24 p-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={(() => {
                           if (activeLayer === 'insulation') return result.spec.phaseCore.insulationThickness;
                           if (activeLayer === 'jacket') return result.spec.sheathThickness;
                           if (activeLayer === 'conductor_shield') return result.spec.conductorScreenThickness;
                           if (activeLayer === 'insulation_screen') return result.spec.insulationScreenThickness;
                           return 0;
                        })()}
                        onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           if (activeLayer === 'insulation') onParamChange('manualInsulationThickness', val);
                           if (activeLayer === 'jacket') onParamChange('manualSheathThickness', val);
                           if (activeLayer === 'conductor_shield') onParamChange('manualConductorScreenThickness', val);
                           if (activeLayer === 'insulation_screen') onParamChange('manualInsulationScreenThickness', val);
                        }}
                      />
                      <div className="flex flex-col gap-0.5">
                         <button className="w-5 h-3.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 flex items-center justify-center cursor-pointer rounded-sm">
                            <PlusCircle className="w-2.5 h-2.5 text-slate-400" />
                         </button>
                         <button className="w-5 h-3.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 flex items-center justify-center cursor-pointer rounded-sm">
                            <Trash2 className="w-2.5 h-2.5 text-slate-400" />
                         </button>
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-500">Diameter (mm)</label>
                   <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        className="w-24 p-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-400 outline-none"
                        value={(() => {
                           if (activeLayer === 'conductor') return result.spec.phaseCore.conductorDiameter;
                           if (activeLayer === 'insulation') return result.spec.phaseCore.coreDiameter;
                           if (activeLayer === 'jacket') return result.spec.overallDiameter;
                           return 0;
                        })()}
                        readOnly
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Summary Footer Bar (Optional extra) */}
      <div className="h-8 bg-[#e5e7eb] border-t border-slate-300 flex items-center px-4 justify-between">
         <div className="flex gap-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Design: {params.cores}C x {params.size}mm²</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Voltage: {params.voltage}</span>
         </div>
         <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Ready</span>
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50 hover:shadow-md transition-all active:scale-95 group relative"
      title={title}
    >
      <div className="text-slate-600 group-hover:text-indigo-600 transition-colors">
        {icon}
      </div>
    </button>
  );
}
