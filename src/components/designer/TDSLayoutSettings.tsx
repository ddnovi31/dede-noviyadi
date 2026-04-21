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

export interface TDSLetterhead {
  companyName: string;
  address: string;
  title: string;
  subtitle: string;
  logoUrl?: string;
  showLogo: boolean;
}

export interface TDSLayoutConfig {
  standard: string;
  rows: TDSRowConfig[];
  letterhead: TDSLetterhead;
}

const DEFAULT_LETTERHEAD: TDSLetterhead = {
  companyName: 'PT. MULTI KABEL',
  address: 'Jl. Kawasan Industri No. 1, Jakarta, Indonesia',
  title: 'TECHNICAL DATA SHEET',
  subtitle: 'Power Cable Specifications',
  showLogo: true
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

  const currentLayout = layouts[selectedStandard] || { 
    standard: selectedStandard, 
    rows: JSON.parse(JSON.stringify(DEFAULT_ROWS)),
    letterhead: { ...DEFAULT_LETTERHEAD }
  };

  const saveLayout = (newRows: TDSRowConfig[], newLetterhead?: TDSLetterhead) => {
    const updated = { 
      ...layouts, 
      [selectedStandard]: { 
        standard: selectedStandard, 
        rows: newRows,
        letterhead: newLetterhead || currentLayout.letterhead || { ...DEFAULT_LETTERHEAD }
      } 
    };
    setLayouts(updated);
    safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
  };

  const addRow = () => {
    const newRow: TDSRowConfig = {
      id: Math.random().toString(36).substr(2, 9),
      index: (currentLayout.rows.length + 1).toString(),
      label: 'New Row',
      unit: '-',
      valueKey: 'params.size',
      colSpan: 1
    };
    saveLayout([...currentLayout.rows, newRow]);
  };

  const updateRow = (id: string, updates: Partial<TDSRowConfig>) => {
    const newRows = currentLayout.rows.map(r => r.id === id ? { ...r, ...updates } : r);
    saveLayout(newRows);
  };

  const deleteRow = (id: string) => {
    saveLayout(currentLayout.rows.filter(r => r.id !== id));
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newRows = [...currentLayout.rows];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < newRows.length) {
      [newRows[index], newRows[target]] = [newRows[target], newRows[index]];
      saveLayout(newRows);
    }
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Standards
              </h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
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

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileJson className="w-3 h-3" />
                Kop Surat
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block">COMPANY NAME</label>
                  <input 
                    type="text" 
                    value={currentLayout.letterhead?.companyName || ''} 
                    onChange={(e) => updateLetterhead({ companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block">ADDRESS</label>
                  <textarea 
                    value={currentLayout.letterhead?.address || ''} 
                    onChange={(e) => updateLetterhead({ address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-[10px] font-bold h-20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 mb-1 block">TITLE</label>
                  <input 
                    type="text" 
                    value={currentLayout.letterhead?.title || ''} 
                    onChange={(e) => updateLetterhead({ title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Row Editor */}
          <div className="xl:col-span-6 space-y-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <FileJson className="w-24 h-24 text-indigo-600" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{selectedStandard}</h2>
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">Layout Configuration</p>
                </div>
                <button 
                  onClick={addRow}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Index</th>
                      <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Label</th>
                      <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Unit</th>
                      <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Source / Value</th>
                      <th className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Formatting</th>
                      <th className="p-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLayout.rows.map((row, idx) => (
                      <tr key={row.id} className={`group hover:bg-slate-50/50 transition-colors ${row.isHeader ? 'bg-indigo-50/30' : ''}`}>
                        <td className="p-2 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.index} 
                            onChange={(e) => updateRow(row.id, { index: e.target.value })}
                            className="w-12 bg-transparent border-none focus:ring-0 text-[10px] font-bold text-slate-900 p-1"
                          />
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.label} 
                            onChange={(e) => updateRow(row.id, { label: e.target.value })}
                            className={`w-full bg-transparent border-none focus:ring-0 text-[10px] font-bold p-1 ${row.isHeader ? 'text-indigo-700 uppercase' : 'text-slate-700'}`}
                          />
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          {!row.isHeader && (
                            <input 
                              type="text" 
                              value={row.unit} 
                              onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                              className="w-12 bg-transparent border-none focus:ring-0 text-[10px] text-slate-500 p-1"
                            />
                          )}
                        </td>
                        <td className="p-2 border-b border-slate-100">
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
                                className="bg-white border border-slate-200 rounded-md text-[10px] font-bold p-1 outline-none"
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
                                  placeholder="Manual value..."
                                  className="w-full bg-slate-50 border border-slate-100 rounded-md text-[10px] p-1 font-mono"
                                />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-1 justify-center max-w-[120px]">
                            <button 
                              onClick={() => updateRow(row.id, { isHeader: !row.isHeader })}
                              className={`px-1.5 py-1 rounded text-[8px] font-black transition-all ${row.isHeader ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}
                              title="Toggle Header"
                            >
                              HEAD
                            </button>
                            <button 
                              onClick={() => updateRow(row.id, { bold: !row.bold })}
                              className={`px-1.5 py-1 rounded text-[8px] font-black transition-all ${row.bold ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}
                              title="Bold"
                            >
                              B
                            </button>
                            <button 
                              onClick={() => updateRow(row.id, { colSpan: row.colSpan === 3 ? 1 : 3 })}
                              className={`px-1.5 py-1 rounded text-[8px] font-black transition-all ${row.colSpan === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}
                              title="Merge Cell (Span 3)"
                            >
                              MERGE
                            </button>
                          </div>
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => moveRow(idx, 'up')} 
                              disabled={idx === 0}
                              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => moveRow(idx, 'down')}
                              disabled={idx === currentLayout.rows.length - 1}
                              className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => deleteRow(row.id)}
                              className="p-2 text-slate-300 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Implementation Note
                </h4>
                <p className="text-[10px] text-amber-600 leading-relaxed font-bold">
                  These settings will override the standard TDS layout in the Project Review tab for the selected cable standard. 
                  Static values can be prefixed with <code className="bg-amber-100 px-1 rounded font-mono">const:</code> to display literal text.
                </p>
              </div>
            </div>
          </div>

          {/* Right Content - Live Preview */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 sticky top-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BarChart3 className="w-3 h-3 text-indigo-600" />
                Live Preview (TDS Mockup)
              </h3>
              
              <div className="border border-slate-300 p-6 rounded shadow-sm bg-white overflow-hidden text-[9px]">
                {/* Header Mockup */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-slate-800">
                  <div className="w-12 h-12 bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 rounded">
                    Logo
                  </div>
                  <div className="text-center flex-1">
                    <h2 className="font-black text-xs">{currentLayout.letterhead?.companyName}</h2>
                    <p className="text-[7px] text-slate-500 whitespace-pre-line">{currentLayout.letterhead?.address}</p>
                  </div>
                  <div className="w-12 text-right">
                    Rev. 1
                  </div>
                </div>

                <div className="text-center mb-4">
                  <h3 className="font-black text-[10px] uppercase underline">{currentLayout.letterhead?.title}</h3>
                  <p className="font-bold text-slate-600">{currentLayout.letterhead?.subtitle}</p>
                </div>

                <table className="w-full border-collapse border border-slate-800">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-800 p-1 w-6">No</th>
                      <th className="border border-slate-800 p-1 text-left">Description</th>
                      <th className="border border-slate-800 p-1 w-10">Unit</th>
                      <th className="border border-slate-800 p-1 text-center">Spec</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLayout.rows.map((row) => (
                      <tr key={row.id} className={row.isHeader ? 'bg-slate-100' : ''}>
                        <td className="border border-slate-800 p-1 text-center font-bold">{row.index}</td>
                        <td 
                          className={`border border-slate-800 p-1 ${row.isHeader ? 'font-black uppercase' : ''} ${row.bold ? 'font-black' : ''}`}
                          colSpan={row.colSpan === 3 ? 3 : 1}
                        >
                          {row.label}
                        </td>
                        {row.colSpan !== 3 && (
                          <>
                            <td className="border border-slate-800 p-1 text-center">{row.unit}</td>
                            <td className="border border-slate-800 p-1 text-center text-slate-400 italic">
                               {row.valueKey.startsWith('const:') ? row.valueKey.substring(6) : '[Value]'}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-[9px] text-indigo-600 font-bold italic">
                  This preview uses placeholder values to show the layout and formatting. Colors and fonts will match the final TDS document.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
