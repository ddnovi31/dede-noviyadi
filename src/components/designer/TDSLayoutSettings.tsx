import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft, MoveUp, MoveDown, Layout, FileJson, Settings, Database } from 'lucide-react';
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
}

export interface TDSLayoutConfig {
  standard: string;
  rows: TDSRowConfig[];
}

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
  { label: 'Static Text (use const:Prefix)', value: 'const:' },
  { label: 'Cable Designation', value: 'designation' },
  { label: 'Standard', value: 'params.standard' },
  { label: 'Voltage', value: 'params.voltage' },
  { label: 'Cores', value: 'params.cores' },
  { label: 'Size', value: 'params.size' },
  { label: 'Conductor Material', value: 'params.conductorMaterial' },
  { label: 'Conductor Type', value: 'params.conductorType' },
  { label: 'Overall Diameter', value: 'result.spec.overallDiameter' },
  { label: 'Total Weight', value: 'result.bom.totalWeight' },
  { label: 'DC Resistance', value: 'result.electrical.maxDcResistance' },
  { label: 'Short Circuit Capacity', value: 'result.electrical.shortCircuitCapacity' },
  { label: 'Current Air', value: 'result.electrical.currentCapacityAir' },
  { label: 'Current Ground', value: 'result.electrical.currentCapacityGround' },
  { label: 'Laid up Diameter', value: 'result.spec.laidUpDiameter' },
  { label: 'Inner Sheath Thickness', value: 'result.spec.innerCoveringThickness' },
  { label: 'Armor Thickness', value: 'result.spec.armorThickness' },
  { label: 'Outer Sheath Thickness', value: 'result.spec.sheathThickness' },
  { label: 'Wire Count (Phase)', value: 'result.spec.phaseCore.wireCount' },
  { label: 'Wire Diameter (Phase)', value: 'result.spec.phaseCore.wireDiameter' },
  { label: 'Insulation Thickness (Phase)', value: 'result.spec.phaseCore.insulationThickness' },
  { label: 'Messenger Size', value: 'params.earthingSize' },
  { label: 'Standard Length', value: 'packing.standardLength' },
  { label: 'Drum Type', value: 'packing.selectedDrum.type' },
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

  const currentLayout = layouts[selectedStandard] || { standard: selectedStandard, rows: [...DEFAULT_ROWS] };

  const saveLayout = (newRows: TDSRowConfig[]) => {
    const updated = { ...layouts, [selectedStandard]: { standard: selectedStandard, rows: newRows } };
    setLayouts(updated);
    safeLocalStorage.setItem('tds_layouts', JSON.stringify(updated));
  };

  const addRow = () => {
    const newRow: TDSRowConfig = {
      id: Math.random().toString(36).substr(2, 9),
      index: (currentLayout.rows.length + 1).toString(),
      label: 'New Row',
      unit: '-',
      valueKey: 'params.size'
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

  const resetToDefault = () => {
    if (confirm('Reset to default layout for this standard?')) {
      const { [selectedStandard]: _, ...rest } = layouts;
      setLayouts(rest);
      safeLocalStorage.setItem('tds_layouts', JSON.stringify(rest));
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Standards Select */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Cable Standards
              </h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {CABLE_STANDARDS.map((std) => (
                  <button
                    key={std.value}
                    onClick={() => setSelectedStandard(std.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${
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

          {/* Main Content - Row Editor */}
          <div className="lg:col-span-3 space-y-4">
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
                      <th className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Options</th>
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
                            className="w-12 bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-900 p-1"
                          />
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.label} 
                            onChange={(e) => updateRow(row.id, { label: e.target.value })}
                            className={`w-full bg-transparent border-none focus:ring-0 text-xs font-bold p-1 ${row.isHeader ? 'text-indigo-700' : 'text-slate-700'}`}
                          />
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <input 
                            type="text" 
                            value={row.unit} 
                            onChange={(e) => updateRow(row.id, { unit: e.target.value })}
                            className="w-16 bg-transparent border-none focus:ring-0 text-xs text-slate-500 p-1"
                          />
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <div className="flex flex-col gap-1">
                            <select 
                              value={AVAILABLE_KEYS.some(k => k.value === row.valueKey) ? (row.valueKey.startsWith('const:') ? 'const:' : row.valueKey) : 'const:'}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === 'const:') {
                                  updateRow(row.id, { valueKey: 'const:' });
                                } else {
                                  updateRow(row.id, { valueKey: val });
                                }
                              }}
                              className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold p-1 outline-none"
                            >
                              {AVAILABLE_KEYS.map(k => (
                                <option key={k.value} value={k.value}>{k.label}</option>
                              ))}
                            </select>
                            {(row.valueKey.startsWith('const:') || !AVAILABLE_KEYS.some(k => k.value === row.valueKey)) && (
                              <input 
                                type="text" 
                                value={row.valueKey.startsWith('const:') ? row.valueKey.substring(6) : row.valueKey}
                                onChange={(e) => updateRow(row.id, { valueKey: `const:${e.target.value}` })}
                                placeholder="Manual value..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-[10px] p-1.5 font-mono"
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 justify-center">
                            <button 
                              onClick={() => updateRow(row.id, { isHeader: !row.isHeader })}
                              className={`p-1.5 rounded-lg text-[8px] font-black transition-all ${row.isHeader ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                              title="Toggle Header Row"
                            >
                              HEAD
                            </button>
                            <button 
                              onClick={() => updateRow(row.id, { bold: !row.bold })}
                              className={`p-1.5 rounded-lg text-[8px] font-black transition-all ${row.bold ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                              title="Toggle Bold"
                            >
                              BOLD
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
        </div>
      </div>
    </div>
  );
}
