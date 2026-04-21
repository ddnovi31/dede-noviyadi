import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft, MoveUp, MoveDown, Layout, FileJson, Settings, Database, BarChart3 } from 'lucide-react';
import { CABLE_STANDARDS } from '../../utils/designerData';
import { safeLocalStorage } from '../../utils/safeLocalStorage';

export interface TDSRowConfig {
  id: string;
  index: string;
  label: string;
  unit: string;
  valueKey: string; // e.g., "result.spec.overallDiameter"
  isHeader?: boolean;
  bold?: boolean;
  uppercase?: boolean;
  color?: string;
  colSpan?: number;
}

export interface TDSSection {
  text: string;
  image?: string; // Base64 or URL
}

export interface TDSLetterhead {
  header: {
    left: TDSSection;
    center: TDSSection;
    right: TDSSection;
  };
  footer: {
    left: TDSSection;
    center: TDSSection;
    right: TDSSection;
  };
  // Compatibility fields
  companyName: string;
  address: string;
  title: string;
  subtitle: string;
}

export interface TDSLayoutConfig {
  standard: string;
  rows: TDSRowConfig[];
  letterhead: TDSLetterhead;
}

const DEFAULT_LETTERHEAD: TDSLetterhead = {
  header: {
    left: { text: '' },
    center: { text: 'PT. MULTI KABEL\nJl. Kawasan Industri No. 1, Jakarta' },
    right: { text: '' }
  },
  footer: {
    left: { text: '' },
    center: { text: '' },
    right: { text: '' }
  },
  companyName: 'PT. MULTI KABEL',
  address: 'Jl. Kawasan Industri No. 1, Jakarta, Indonesia',
  title: 'TECHNICAL DATA SHEET',
  subtitle: 'Power Cable Specifications'
};

const DEFAULT_ROWS: TDSRowConfig[] = [
  { id: '1', index: '1', label: 'Manufactured', unit: '-', valueKey: 'const:MULTI KABEL', bold: true, uppercase: true },
  { id: '2', index: '2', label: 'Reference Standard', unit: '-', valueKey: 'params.standard' },
  { id: '3', index: '3', label: 'Type', unit: '-', valueKey: 'designation', bold: true, color: 'text-blue-700' },
  { id: '4', index: '4', label: 'Dimensions', unit: 'mm²', valueKey: 'params.size', bold: true },
  { id: '5', index: '5', label: 'Rated Voltage', unit: 'kV', valueKey: 'params.voltage' },
  { id: 'h1', index: '6', label: 'CONSTRUCTIONAL DATA', unit: '', valueKey: '', isHeader: true },
  { id: '6.1', index: '6.1', label: 'Material Conductor', unit: '-', valueKey: 'params.conductorMaterial' },
  { id: '6.2', index: '6.2', label: 'Overall Diameter (Approx.)', unit: 'mm', valueKey: 'result.spec.overallDiameter', bold: true },
  { id: 'h2', index: '7', label: 'TECHNICAL DATA', unit: '', valueKey: '', isHeader: true },
  { id: '7.1', index: '7.1', label: 'Max. DC Resistance at 20°C', unit: 'Ohm/km', valueKey: 'result.electrical.maxDcResistance' },
  { id: '8', index: '8', label: 'NET WEIGHT (APPROX.)', unit: 'kg/km', valueKey: 'result.bom.totalWeight', bold: true, color: 'text-indigo-700' },
];

const AVAILABLE_KEYS = [
  { label: '--- Static & Special ---', value: 'group:static' },
  { label: 'Static Text (use const:Prefix)', value: 'const:' },
  { label: 'Cable Designation', value: 'designation' },
  { label: 'Packing Length (Drum)', value: 'packing.standardLength' },
  { label: 'Drum Type', value: 'packing.selectedDrum.type' },
  
  { label: '--- Parameters ---', value: 'group:params' },
  { label: 'Standard', value: 'params.standard' },
  { label: 'Voltage', value: 'params.voltage' },
  { label: 'Cores', value: 'params.cores' },
  { label: 'Size', value: 'params.size' },
  { label: 'Conductor Material', value: 'params.conductorMaterial' },
  { label: 'Conductor Type', value: 'params.conductorType' },
  { label: 'Insulation Material', value: 'params.insulationMaterial' },
  { label: 'Armor Type', value: 'params.armorType' },
  { label: 'Sheath Material', value: 'params.sheathMaterial' },
  
  { label: '--- Construction (Spec) ---', value: 'group:spec' },
  { label: 'Conductor Diameter', value: 'result.spec.conductorDiameter' },
  { label: 'Wire Count', value: 'result.spec.wireCount' },
  { label: 'Insulation Thickness', value: 'result.spec.insulationThickness' },
  { label: 'Core Diameter', value: 'result.spec.coreDiameter' },
  { label: 'Laid up Diameter', value: 'result.spec.laidUpDiameter' },
  { label: 'Inner Sheath Thickness', value: 'result.spec.innerCoveringThickness' },
  { label: 'Armor Thickness', value: 'result.spec.armorThickness' },
  { label: 'Outer Sheath Thickness', value: 'result.spec.sheathThickness' },
  { label: 'Overall Diameter', value: 'result.spec.overallDiameter' },
  { label: 'Overall Diameter (Min)', value: 'result.spec.overallDiameterMin' },
  { label: 'Overall Diameter (Max)', value: 'result.spec.overallDiameterMax' },
  
  { label: '--- Electrical Data ---', value: 'group:elec' },
  { label: 'DC Resistance 20°C', value: 'result.electrical.maxDcResistance' },
  { label: 'AC Resistance 70/90°C', value: 'result.electrical.maxAcResistance' },
  { label: 'Current Air', value: 'result.electrical.currentCapacityAir' },
  { label: 'Current Ground', value: 'result.electrical.currentCapacityGround' },
  { label: 'Short Circuit Capacity (1s)', value: 'result.electrical.shortCircuitCapacity' },
  
  { label: '--- Weights (BOM) ---', value: 'group:bom' },
  { label: 'Conductor Weight', value: 'result.bom.conductorWeight' },
  { label: 'Insulation Weight', value: 'result.bom.insulationWeight' },
  { label: 'Armor Weight', value: 'result.bom.armorWeight' },
  { label: 'Sheath Weight', value: 'result.bom.sheathWeight' },
  { label: 'Total Weight', value: 'result.bom.totalWeight' },
  
  { label: '--- Detailed Spec ---', value: 'group:det' },
  { label: 'Diameter Under Armor', value: 'result.spec.diameterUnderArmor' },
  { label: 'Diameter Over Armor', value: 'result.spec.diameterOverArmor' },
  { label: 'Average Core Diameter', value: 'params.coreDiameter' },
  { label: 'Earthing Size', value: 'params.earthingSize' },
  { label: 'Packing ID', value: 'packing.selectedDrum.id' },
];

export default function TDSLayoutDesigner() {
  const [selectedStandard, setSelectedStandard] = useState(CABLE_STANDARDS[0].value);
  const [layouts, setLayouts] = useState<Record<string, TDSLayoutConfig>>(() => {
    try {
      const saved = safeLocalStorage.getItem('tds_layouts');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Error loading TDS layouts:", e);
      return {};
    }
  });

  // Helper to ensure letterhead has all new fields
  const normalizeLetterhead = (lh: any): TDSLetterhead => {
    return {
      ...DEFAULT_LETTERHEAD,
      ...lh,
      header: { ...DEFAULT_LETTERHEAD.header, ...(lh?.header || {}) },
      footer: { ...DEFAULT_LETTERHEAD.footer, ...(lh?.footer || {}) }
    };
  };

  const rawLayout = layouts[selectedStandard];
  const currentLayout: TDSLayoutConfig = rawLayout 
    ? { ...rawLayout, letterhead: normalizeLetterhead(rawLayout.letterhead) }
    : { 
        standard: selectedStandard, 
        rows: JSON.parse(JSON.stringify(DEFAULT_ROWS)),
        letterhead: normalizeLetterhead({})
      };

  const saveLayout = (newRows: TDSRowConfig[], newLetterhead?: TDSLetterhead) => {
    setLayouts(prev => {
      const existing = prev[selectedStandard] || { 
        standard: selectedStandard, 
        rows: JSON.parse(JSON.stringify(DEFAULT_ROWS)),
        letterhead: normalizeLetterhead({}) 
      };
      const updated = { 
        ...prev, 
        [selectedStandard]: { 
          standard: selectedStandard, 
          rows: newRows,
          letterhead: normalizeLetterhead(newLetterhead || existing.letterhead)
        } 
      };
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  const addRow = () => {
    setLayouts(prev => {
      const existing = prev[selectedStandard] || { 
        standard: selectedStandard, 
        rows: JSON.parse(JSON.stringify(DEFAULT_ROWS)),
        letterhead: normalizeLetterhead({}) 
      };
      
      const newRow: TDSRowConfig = {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        index: (existing.rows.length + 1).toString(),
        label: 'New Technical Row',
        unit: '-',
        valueKey: 'params.size',
        colSpan: 1
      };
      
      const updated = {
        ...prev,
        [selectedStandard]: {
          ...existing,
          rows: [...existing.rows, newRow]
        }
      };
      
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
      
      // Scroll into view logic (using timeout to ensure DOM update)
      setTimeout(() => {
        const table = document.querySelector('table');
        if (table) {
          table.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);

      return updated;
    });
  };

  const updateRow = (id: string, updates: Partial<TDSRowConfig>) => {
    setLayouts(prev => {
      const existing = prev[selectedStandard];
      if (!existing) return prev;
      const newRows = existing.rows.map(r => r.id === id ? { ...r, ...updates } : r);
      const updated = {
        ...prev,
        [selectedStandard]: { ...existing, rows: newRows }
      };
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteRow = (id: string) => {
    setLayouts(prev => {
      const existing = prev[selectedStandard];
      if (!existing) return prev;
      const newRows = existing.rows.filter(r => r.id !== id);
      const updated = {
        ...prev,
        [selectedStandard]: { ...existing, rows: newRows }
      };
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
      return updated;
    });
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    setLayouts(prev => {
      const existing = prev[selectedStandard];
      if (!existing) return prev;
      const newRows = [...existing.rows];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target >= 0 && target < newRows.length) {
        [newRows[index], newRows[target]] = [newRows[target], newRows[index]];
        const updated = {
          ...prev,
          [selectedStandard]: { ...existing, rows: newRows }
        };
        safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  const exportToDisk = () => {
    const dataStr = JSON.stringify(layouts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'cable_tds_layouts.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importFromDisk = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (confirm('Replace current layouts with imported file?')) {
          setLayouts(imported);
          safeLocalStorage.setItem('tds_layouts', JSON.stringify(imported));
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const resetToDefault = () => {
    if (confirm('Reset to default layout for this standard?')) {
      const { [selectedStandard]: _, ...rest } = layouts;
      setLayouts(rest);
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(rest));
    }
  };

  const updateLetterhead = (updates: Partial<TDSLetterhead>) => {
    saveLayout(currentLayout.rows, { ...currentLayout.letterhead, ...updates });
  };

  const handleImageUpload = (section: 'header' | 'footer', pos: 'left' | 'center' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const lh = { ...currentLayout.letterhead };
      lh[section] = { ...lh[section], [pos]: { ...lh[section][pos], image: base64 } };
      updateLetterhead(lh);
    };
    reader.readAsDataURL(file);
  };

  const updateSectionText = (section: 'header' | 'footer', pos: 'left' | 'center' | 'right', text: string) => {
    const lh = { ...currentLayout.letterhead };
    lh[section] = { ...lh[section], [pos]: { ...lh[section][pos], text } };
    updateLetterhead(lh);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">TDS Layout Designer</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure Technical Data Sheet Table</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 cursor-pointer">
              <Database className="w-4 h-4" />
              Load Layout
              <input type="file" accept=".json" onChange={importFromDisk} className="hidden" />
            </label>
            <button 
              onClick={exportToDisk} 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save to Hardisk
            </button>
            <button 
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.hash = '';
                }
              }} 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Designer
            </button>
            <button 
              onClick={resetToDefault} 
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
            >
              Reset Default
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sidebar - Standards Select */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 sticky top-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Standards
              </h3>
              <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
                {CABLE_STANDARDS.map((std) => (
                  <button
                    key={std.value}
                    onClick={() => setSelectedStandard(std.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                      selectedStandard === std.value 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 italic' 
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {std.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-10 space-y-6">
            {/* 1. Konfigurasi Kop Surat */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <FileJson className="w-3 h-3" />
                 KONFIGURASI KOP SURAT
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Header Sections */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                     Header Sections
                   </h4>
                   <div className="grid grid-cols-3 gap-3">
                     {['left', 'center', 'right'].map((pos) => (
                       <div key={pos} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block">{pos} Side</label>
                         <textarea
                           value={currentLayout.letterhead?.header?.[pos as 'left'|'center'|'right']?.text || ''}
                           onChange={(e) => updateSectionText('header', pos as 'left'|'center'|'right', e.target.value)}
                           placeholder="Text..."
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold h-20 mb-2"
                         />
                         <div className="flex flex-col gap-1.5">
                           <label className="flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[8px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                             {currentLayout.letterhead?.header?.[pos as 'left'|'center'|'right']?.image ? 'CHANGE IMG' : 'UPLOAD IMG'}
                             <input type="file" accept="image/*" onChange={(e) => handleImageUpload('header', pos as 'left'|'center'|'right', e)} className="hidden" />
                           </label>
                           {currentLayout.letterhead?.header?.[pos as 'left'|'center'|'right']?.image && (
                             <button 
                               onClick={() => {
                                 const lh = { ...currentLayout.letterhead };
                                 if (lh.header?.[pos as 'left'|'center'|'right']) lh.header[pos as 'left'|'center'|'right'].image = undefined;
                                 updateLetterhead(lh);
                               }}
                               className="text-[8px] text-rose-500 font-bold hover:underline"
                             >
                               Remove
                             </button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Footer Sections */}
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-rose-600 rounded-full"></div>
                     Footer Sections
                   </h4>
                   <div className="grid grid-cols-3 gap-3">
                     {['left', 'center', 'right'].map((pos) => (
                       <div key={pos} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                         <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block">{pos} Side</label>
                         <textarea
                           value={currentLayout.letterhead?.footer?.[pos as 'left'|'center'|'right']?.text || ''}
                           onChange={(e) => updateSectionText('footer', pos as 'left'|'center'|'right', e.target.value)}
                           placeholder="Text..."
                           className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-bold h-20 mb-2"
                         />
                         <label className="flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black cursor-pointer hover:bg-rose-100 transition-colors">
                           UPLOAD IMG
                           <input type="file" accept="image/*" onChange={(e) => handleImageUpload('footer', pos as 'left'|'center'|'right', e)} className="hidden" />
                         </label>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
            </div>

            {/* 2. Table Labels */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <Settings className="w-3 h-3" />
                 TABLE LABEL
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Main Title (e.g. TECHNICAL DATA SHEET)</label>
                   <input 
                     type="text" 
                     value={currentLayout.letterhead?.title || ''} 
                     onChange={(e) => updateLetterhead({ title: e.target.value })}
                     placeholder="Table Main Title..."
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Subtitle (e.g. Low Voltage Cable)</label>
                   <input 
                     type="text" 
                     value={currentLayout.letterhead?.subtitle || ''} 
                     onChange={(e) => updateLetterhead({ subtitle: e.target.value })}
                     placeholder="Table Subtitle..."
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                 </div>
               </div>
            </div>

            {/* 3. Layout Configuration (Row Editor) */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
                <FileJson className="w-24 h-24 text-indigo-600" />
              </div>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">{selectedStandard}</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-[0.2em]">LAYOUT CONFIGURATION</p>
                  </div>
                </div>
                
                <button 
                  onClick={addRow}
                  type="button"
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-100 cursor-pointer border-0"
                >
                  <Plus className="w-4 h-4" />
                  ADD NEW ROW
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Index</th>
                      <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-1/4">Label Description</th>
                      <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Unit</th>
                      <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Source Value Mapping</th>
                      <th className="p-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Style</th>
                      <th className="p-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLayout.rows.map((row, idx) => (
                      <tr key={row.id} className={`group hover:bg-slate-50/80 transition-all ${row.isHeader ? 'bg-indigo-50/20' : ''}`}>
                        <td className="p-4 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.index} 
                            onChange={(e) => updateRow(row.id, { index: e.target.value })}
                            className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-900 p-2 focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.label} 
                            onChange={(e) => updateRow(row.id, { label: e.target.value })}
                            className={`w-full bg-white border border-slate-200 rounded-lg text-[10px] font-bold p-2 focus:ring-1 focus:ring-indigo-500 ${row.isHeader ? 'text-indigo-700 uppercase' : 'text-slate-700'}`}
                          />
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          {!row.isHeader && (
                            <input 
                              type="text" 
                              value={row.unit} 
                              onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                              className="w-16 bg-white border border-slate-200 rounded-lg text-[10px] text-slate-500 p-2 font-bold"
                            />
                          )}
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          {!row.isHeader && (
                            <div className="flex flex-col gap-1">
                              <select 
                                value={AVAILABLE_KEYS.some(k => k.value === row.valueKey) ? (row.valueKey.startsWith('const:') ? 'const:' : row.valueKey) : 'const:'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val.startsWith('group:')) return;
                                  if (val === 'const:') {
                                    updateRow(row.id, { valueKey: 'const:' });
                                  } else {
                                    updateRow(row.id, { valueKey: val });
                                  }
                                }}
                                className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold p-2 outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {AVAILABLE_KEYS.map(k => (
                                  <option key={k.value} value={k.value} disabled={k.value.startsWith('group:')}>
                                    {k.label}
                                  </option>
                                ))}
                              </select>
                              {(row.valueKey.startsWith('const:') || !AVAILABLE_KEYS.some(k => k.value === row.valueKey)) && (
                                <input 
                                  type="text" 
                                  value={row.valueKey.startsWith('const:') ? row.valueKey.substring(6) : row.valueKey}
                                  onChange={(e) => updateRow(row.id, { valueKey: `const:${e.target.value}` })}
                                  placeholder="Type manual text..."
                                  className="w-full bg-slate-50 border border-slate-100 rounded-lg text-[9px] p-2 font-mono text-indigo-600"
                                />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5 justify-center">
                            <button 
                              onClick={() => updateRow(row.id, { isHeader: !row.isHeader })}
                              className={`px-2 py-1.5 rounded-lg text-[8px] font-black transition-all ${row.isHeader ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              HEAD
                            </button>
                            <button 
                              onClick={() => updateRow(row.id, { bold: !row.bold })}
                              className={`px-2 py-1.5 rounded-lg text-[8px] font-black transition-all ${row.bold ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              BOLD
                            </button>
                            <button 
                              onClick={() => updateRow(row.id, { colSpan: row.colSpan === 3 ? 1 : 3 })}
                              className={`px-2 py-1.5 rounded-lg text-[8px] font-black transition-all ${row.colSpan === 3 ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              MERGE
                            </button>
                          </div>
                        </td>
                        <td className="p-4 border-b border-slate-100">
                          <div className="flex items-center justify-end gap-1">
                            <div className="flex flex-col">
                              <button 
                                onClick={() => moveRow(idx, 'up')} 
                                disabled={idx === 0}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => moveRow(idx, 'down')}
                                disabled={idx === currentLayout.rows.length - 1}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-colors"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                            </div>
                            <button 
                              onClick={() => deleteRow(row.id)}
                              className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] text-indigo-600/70 leading-relaxed font-bold italic flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Tip: Use const: prefix for literal text values (e.g. const:PT MULTI KABEL)
                </p>
              </div>
            </div>

            {/* 4. LIVE PREVIEW */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                <BarChart3 className="w-3 h-3 text-indigo-600" />
                LIVE PREVIEW
              </h3>
              
              <div className="max-w-4xl mx-auto border-2 border-slate-200 p-10 rounded-xl bg-white shadow-2xl overflow-hidden relative">
                {/* Header Mockup */}
                <div className="grid grid-cols-3 gap-6 pb-6 border-b-2 border-slate-800 mb-6 items-start">
                  {['left', 'center', 'right'].map((pos) => {
                    const section = currentLayout.letterhead?.header?.[pos as 'left'|'center'|'right'];
                    return (
                      <div key={pos} className={`flex flex-col ${pos === 'center' ? 'items-center text-center' : pos === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                        {section?.image && <img src={section.image} alt={pos} className="max-h-20 w-auto mb-2" />}
                        <p className="text-[10px] text-slate-800 whitespace-pre-line font-black leading-tight tracking-tight">{section?.text}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-black text-sm uppercase underline underline-offset-4 decoration-2 tracking-widest">{currentLayout.letterhead?.title}</h3>
                  <p className="font-bold text-slate-600 text-xs mt-1">{currentLayout.letterhead?.subtitle}</p>
                </div>

                <table className="w-full border-collapse border-2 border-slate-800 text-[10px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border-2 border-slate-800 p-2 w-10 font-black">No</th>
                      <th className="border-2 border-slate-800 p-2 text-left font-black">Description of Requirements</th>
                      <th className="border-2 border-slate-800 p-2 w-20 font-black">Unit</th>
                      <th className="border-2 border-slate-800 p-2 text-center font-black">Cable Specifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLayout.rows.map((row) => (
                      <tr key={row.id} className={row.isHeader ? 'bg-slate-100/50' : ''}>
                        <td className="border-2 border-slate-800 p-2 text-center font-black">{row.index}</td>
                        <td 
                          className={`border-2 border-slate-800 p-2 ${row.isHeader ? 'font-black uppercase bg-slate-50' : ''} ${row.bold ? 'font-black' : ''}`}
                          colSpan={row.colSpan === 3 ? 3 : 1}
                        >
                          {row.label}
                        </td>
                        {row.colSpan !== 3 && (
                          <>
                            <td className="border-2 border-slate-800 p-2 text-center font-bold">{row.unit}</td>
                            <td className="border-2 border-slate-800 p-2 text-center text-indigo-600 font-bold italic">
                               {row.valueKey.startsWith('const:') ? row.valueKey.substring(6) : '[Value Data]'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Mockup */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200 mt-10 items-start">
                  {['left', 'center', 'right'].map((pos) => {
                    const section = currentLayout.letterhead?.footer?.[pos as 'left'|'center'|'right'];
                    return (
                      <div key={pos} className={`flex flex-col ${pos === 'center' ? 'items-center text-center' : pos === 'right' ? 'items-end text-right' : 'items-start text-left'}`}>
                        {section?.image && <img src={section.image} alt={pos} className="max-h-16 w-auto mb-2" />}
                        <p className="text-[9px] text-slate-500 whitespace-pre-line font-bold leading-relaxed">{section?.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
