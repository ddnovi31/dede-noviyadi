import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { CableDesignParams, CalculationResult, FlameRetardantCategory } from '../../utils/cableCalculations';
import { getCableDesignation, calculatePacking, getDefaultInsulationColor } from '../../utils/designerUtils';
import { EditableCell } from './CableDesignerComponents';
import { NYCY_DATA } from '../../utils/nycyData';
import { NFA2XT_DATA } from '../../utils/abcData';
import { AAC_DATA } from '../../utils/aacData';
import { DrumData } from '../../utils/drumData';
import { safeLocalStorage } from '../../utils/safeLocalStorage';
import { TDSLayoutConfig } from './TDSLayoutSettings';

interface ReviewSpecificationsProps {
  groupedItemsList: { key: string; items: { params: CableDesignParams; result: CalculationResult }[] }[];
  specEdits: Record<string, any>;
  setSpecEdits: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  printedSheets: Set<number>;
  printingGroupId: number | null;
  handlePrintSheet: (index: number) => void;
  reviewTab: string;
  drumData: DrumData[];
}

export function ReviewSpecifications({
  groupedItemsList,
  specEdits,
  setSpecEdits,
  printedSheets,
  printingGroupId,
  handlePrintSheet,
  reviewTab,
  drumData
}: ReviewSpecificationsProps) {
  if (reviewTab !== 'specifications') return null;

  return (
    <div className="space-y-12 print:block print:space-y-0">
      {groupedItemsList.map((group, groupIdx) => {
        const { key: groupKey, items } = group;
        const firstItem = items[0];
        const p = firstItem.params;

        const isMV = p.voltage.includes('/') && (
          p.voltage.includes('3.6/6') || 
          p.voltage.includes('6/10') || 
          p.voltage.includes('8.7/15') || 
          p.voltage.includes('12/20') || 
          p.voltage.includes('18/30')
        );
        const isInstrumentation = p.standard === 'BS EN 50288-7' || (p.standard === 'Manufacturing Specification' && p.hasScreen) || p.standard.includes('Instrument');
        const isABC = p.standard.includes('NFA2X');

        return (
          <div key={groupKey} className={`bg-white p-8 rounded-sm shadow-sm border border-slate-300 overflow-x-auto print:shadow-none print:border-none print:p-2 print:m-0 print:overflow-visible print-scale ${groupIdx < groupedItemsList.length - 1 ? 'break-after-page' : ''} ${items.length > 4 ? 'print-landscape-page' : ''} ${printingGroupId === groupIdx ? 'is-printing' : ''} ${printingGroupId !== null && printingGroupId !== groupIdx ? 'print:hidden' : ''}`}>
            <div className="flex justify-between items-center mb-6 print:hidden">
              <div>
                {printedSheets.has(groupIdx) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-md uppercase tracking-wider">
                    <CheckCircle2 className="w-3 h-3" /> Printed
                  </span>
                )}
              </div>
              <button
                onClick={() => handlePrintSheet(groupIdx)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider"
              >
                <Printer className="w-3 h-3" /> Print This Sheet
              </button>
            </div>
            
            <div className="text-center mb-4 print:mb-2 space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 print:text-xs">
                {p.standard === 'SPLN 41-6 : 1981 AAC' ? 'TECHNICAL SPECIFICATION' : 'Technical Specifications'}
              </h2>
              <p className="text-xs text-slate-600 font-medium print:text-[10px]">
                {p.standard === 'SPLN 41-6 : 1981 AAC' ? 'All Aluminium Bare Conductor' : (p.standard === 'BS EN 50288-7' ? 'Instrument Cable' : (isMV ? 'Medium Voltage Cable' : 'Low Voltage Cable'))} {p.standard !== 'BS EN 50288-7' && p.standard !== 'SPLN 41-6 : 1981 AAC' && `(${p.cores > 1 ? 'Multi Core' : 'Single Core'} Power Cable)`}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-[10px] print:text-[9px] [&_td]:!py-2 [&_th]:!py-2 print:[&_td]:!py-1 print:[&_th]:!py-1">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-400 p-2 w-10 text-center">No</th>
                  <th className="border border-slate-400 p-2 text-left w-48">Description</th>
                  <th className="border border-slate-400 p-2 w-16 text-center">Unit</th>
                  <th colSpan={items.length} className="border border-slate-400 p-2 text-center min-w-[120px]">
                    Specification
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let customLayout = null;
                  try {
                    const savedLayouts = typeof window !== 'undefined' ? JSON.parse(safeLocalStorage.getItem('tds_layouts') || '{}') : {};
                    customLayout = savedLayouts[p.standard];
                  } catch (e) {
                    console.error("Error loading custom TDS layout:", e);
                  }
                  
                  if (customLayout) {
                    return renderDynamicSpec(groupKey, items, specEdits, setSpecEdits, drumData, customLayout);
                  }

                  return p.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)' ? renderNFA2XSpec(groupKey, items, specEdits, setSpecEdits, drumData) : 
                         p.standard === 'SPLN D3. 010-1 : 2015 (NFA2X-T)' ? renderNFA2XTSpec(groupKey, items, specEdits, setSpecEdits, drumData) :
                         p.standard === 'SPLN 41-6 : 1981 AAC' ? renderAACSpec(groupKey, items, specEdits, setSpecEdits, drumData) :
                         renderGeneralSpec(groupKey, items, specEdits, setSpecEdits, drumData, isMV);
                })()}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// Helper render functions
function resolveValue(path: string, item: { params: CableDesignParams, result: CalculationResult }, drumData: DrumData[]) {
  if (!path) return '';
  if (path.startsWith('const:')) return path.substring(6);
  if (path === 'designation') return getCableDesignation(item.params, item.result);
  
  if (path.startsWith('packing.')) {
     const p = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
     const sub = path.substring(8);
     if (sub === 'standardLength') return p.standardLength;
     if (sub === 'selectedDrum.type') return p.selectedDrum.type;
     return '-';
  }

  const parts = path.split('.');
  let val: any = item;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in val) {
      val = val[part];
    } else {
      return '-';
    }
  }
  
  if (typeof val === 'number') {
    return val.toFixed(2).replace('.', ',');
  }
  return val !== undefined && val !== null ? String(val) : '-';
}

function renderDynamicSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[], layout: TDSLayoutConfig) {
  return (
    <>
      {layout.rows.map((row) => (
        <tr key={row.id} className={row.isHeader ? 'bg-slate-100' : ''}>
          <td className="border border-slate-400 p-2 text-center font-bold">{row.index}</td>
          <td className={`border border-slate-400 p-2 font-bold ${row.isHeader ? 'uppercase tracking-wider' : 'pl-4'}`} colSpan={row.isHeader ? items.length + 2 : 1}>
            <EditableCell
              value={specEdits[`${groupKey}-${row.id}-label`] ?? row.label}
              onChange={(val) => setSpecEdits((prev: any) => ({ ...prev, [`${groupKey}-${row.id}-label`]: val }))}
              align="left"
              bold={true}
              uppercase={row.isHeader}
            />
          </td>
          {!row.isHeader && (
            <>
              <td className="border border-slate-400 p-2 text-center">{row.unit}</td>
              {items.map((item, idx) => {
                const itemKey = `${item.params.id || idx}-${row.id}-val`;
                const defaultValue = resolveValue(row.valueKey, item, drumData);
                
                return (
                  <td key={idx} className={`border border-slate-400 p-2 text-center ${row.color || ''}`}>
                    <EditableCell
                      value={specEdits[itemKey] ?? defaultValue}
                      onChange={(val) => setSpecEdits((prev: any) => ({ ...prev, [itemKey]: val }))}
                      bold={row.bold}
                      uppercase={row.uppercase}
                    />
                  </td>
                );
              })}
            </>
          )}
        </tr>
      ))}
    </>
  );
}

function renderNFA2XSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[]) {
  const firstItem = items[0];
  
  return (
    <>
      <tr className="bg-slate-100/50">
        <td className="border border-slate-400 p-2 text-center font-bold">1</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-val`] ?? "MULTI KABEL"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-val`]: val }))}
            bold={true}
            uppercase={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">2</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? "SPLN D3.010-1:2014 & ADD. 2015"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">3</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-blue-700 uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "NFA2X"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">4</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Dimensions"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm²</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? `${item.params.cores}x${item.params.size}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">5</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage (Uo/U)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? "0,6/1 (1,2)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "CONSTRUCTIONAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-cond-label`] ?? "Conductor (Phase)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-label`] ?? "- Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center italic">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-insul-label`] ?? "Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-insul-val`] ?? "Extruded XLPE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-insul-thick-label`] ?? "- Thickness (Nominal)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-core-diam-label`] ?? "- Outer Diameter Core (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-core-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-core-diam-val`] ?? item.result.spec.coreDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-core-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50 font-bold">
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 text-slate-900">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center text-blue-900">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">7</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-tech-data-label`] ?? "TECHNICAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-tech-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">Ohm/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-mono">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center">7.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-label`] ?? "AC Test Voltage (5 mins)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-val`] ?? "3,5"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">8</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "NET WEIGHT (APPROX.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">kg/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-indigo-700">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? Math.round(item.result.bom.totalWeight).toLocaleString('id-ID')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">9</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "STANDARD LENGTH"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">m</td>
        {items.map((item, idx) => {
          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
          return (
            <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
              <EditableCell
                value={specEdits[`${item.params.id || idx}-std-length-val`] ?? String(packing.standardLength)}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-std-length-val`]: val }))}
                bold={true}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">10</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "PACKAGING"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-val`] ?? "Wooden Drum"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
    </>
  );
}
function renderNFA2XTSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[]) {
  const firstItem = items[0];
  
  return (
    <>
      <tr className="bg-slate-100/50">
        <td className="border border-slate-400 p-2 text-center font-bold">1</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-val`] ?? "MULTI KABEL"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-val`]: val }))}
            bold={true}
            uppercase={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">2</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? "SPLN D3.010-1:2014 & ADD. 2015"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">3</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-blue-700 uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "NFA2X-T"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">4</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Dimensions"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm²</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? `${item.params.cores}x${item.params.size} + ${item.params.earthingSize}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">5</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage (Uo/U)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? "0,6/1 (1,2)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "CONSTRUCTIONAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      {/* Conductor Phase */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-label`] ?? "Conductor (Phase)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-label`] ?? "- Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center italic">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-val`]: val }))}
          />
        </td>
      </tr>

      {/* Conductor Neutral / Messenger */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-label`] ?? "Conductor (Messenger)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-val`] ?? "Aluminium Alloy"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-val`]: val }))}
          />
        </td>
      </tr>

      {/* Insulation */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.3</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-insul-label`] ?? "Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-insul-val`] ?? "Extruded XLPE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-insul-thick-label`] ?? "- Thickness (Nominal)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50 font-bold">
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 text-slate-900">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center text-blue-900">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>

      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">7</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-tech-data-label`] ?? "TECHNICAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-tech-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">Ohm/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-mono">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center">7.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-label`] ?? "AC Test Voltage (5 mins)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-val`] ?? "3,5"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">8</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "NET WEIGHT (APPROX.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">kg/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-indigo-700">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? Math.round(item.result.bom.totalWeight).toLocaleString('id-ID')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">9</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "STANDARD LENGTH"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">m</td>
        {items.map((item, idx) => {
          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
          return (
            <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
              <EditableCell
                value={specEdits[`${item.params.id || idx}-std-length-val`] ?? String(packing.standardLength)}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-std-length-val`]: val }))}
                bold={true}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">10</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "PACKAGING"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-val`] ?? "Wooden Drum"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
    </>
  );
}

function renderAACSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[]) {
  const firstItem = items[0];
  
  return (
    <>
      <tr className="bg-slate-100/50">
        <td className="border border-slate-400 p-2 text-center font-bold">1</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-val`] ?? "MULTI KABEL"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-val`]: val }))}
            bold={true}
            uppercase={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">2</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? "SPLN 41-6 : 1981"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">3</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-blue-700 uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "AAC"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">4</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Nominal Cross Section"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm²</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? `${item.params.size}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">5</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "CONSTRUCTIONAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">5.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-cond-label`] ?? "Material"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-wire-label`] ?? "- No. / Dia of Wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">pcs/mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50 font-bold">
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 text-slate-900">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center text-blue-900">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>

      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-tech-data-label`] ?? "TECHNICAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-tech-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">Ohm/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-mono">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-label`] ?? "Calculated Breaking Load"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kN</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-breaking-load-val`] ?? (Number(item.params.size || 0) * 0.16).toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-breaking-load-val`]: val }))}
            />
          </td>
        ))}
      </tr>

      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">7</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "NET WEIGHT (APPROX.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">kg/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-indigo-700">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? Math.round(item.result.bom.totalWeight).toLocaleString('id-ID')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">8</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "STANDARD LENGTH"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">m</td>
        {items.map((item, idx) => {
          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
          return (
            <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
              <EditableCell
                value={specEdits[`${item.params.id || idx}-std-length-val`] ?? String(packing.standardLength)}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-std-length-val`]: val }))}
                bold={true}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">9</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "PACKAGING"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-val`] ?? "Wooden Drum"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
    </>
  );
}

function renderGeneralSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[], isMV: boolean) {

  const firstItem = items[0];
  const isLV = !isMV;

  return (
    <>
      <tr className="bg-slate-100/50">
        <td className="border border-slate-400 p-2 text-center font-bold">1</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-val`] ?? "MULTI KABEL"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-val`]: val }))}
            bold={true}
            uppercase={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">2</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? firstItem.params.standard}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">3</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? (isMV ? "Cable Type" : "Type")}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold text-blue-700">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? getCableDesignation(firstItem.params, firstItem.result)}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">4</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Size / No. of Cores"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">mm²</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? `${item.params.cores}x${item.params.size}${item.params.earthingSize ? `+${item.params.earthingSize}` : ''}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">5</td>
        <td className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage (Uo/U)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? firstItem.params.voltage}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
          />
        </td>
      </tr>
      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "CONSTRUCTIONAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      {/* 6.1 Conductor */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.1</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-cond-label`] ?? "Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-val`] ?? (firstItem.params.conductorMaterial === 'Cu' ? 'Plain Annealed Copper Wire' : 'Aluminium EC Grade')}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-label`] ?? "- Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center italic">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-val`] ?? (firstItem.params.conductorType === 'rm' ? 'Round Stranded' : (firstItem.params.conductorType === 're' ? 'Round Solid' : (firstItem.params.conductorType === 'sm' ? 'Sector Stranded' : 'Stranded')))}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-wire-label`] ?? "- No. / Dia of Wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">pcs/mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-cond-diam-label`] ?? "- Conductor Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-diam-val`] ?? item.result.spec.conductorDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>

      {/* 6.2 Insulation */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">6.2</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-insul-label`] ?? "Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-val`] ?? (firstItem.params.insulationMaterial === 'XLPE' ? 'Extruded XLPE' : 'Extruded PVC')}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-insul-thick-label`] ?? "- Thickness (Nominal)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-insul-diam-label`] ?? "- Diameter Over Insulation (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-diam-val`] ?? item.result.spec.coreDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-insul-color-label`] ?? "- Core Identification"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-color-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center italic">
          <EditableCell
            value={specEdits[`${groupKey}-insul-color-val`] ?? getDefaultInsulationColor(firstItem.params.cores, (firstItem.params.earthingSize || 0) > 0, isMV, false, firstItem.params.formationType)}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-color-val`]: val }))}
          />
        </td>
      </tr>

      {/* 6.3 Assembly & Inner Sheath */}
      {firstItem.params.cores > 1 && (
        <>
          <tr>
            <td className="border border-slate-400 p-2 text-center">6.3</td>
            <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
              <EditableCell
                value={specEdits[`${groupKey}-inner-sheath-label`] ?? "Inner Sheath / Filler"}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-inner-sheath-label`]: val }))}
                align="left"
                bold={true}
              />
            </td>
            <td className="border border-slate-400 p-2 text-center">-</td>
            <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
              <EditableCell
                value={specEdits[`${groupKey}-inner-sheath-val`] ?? "Extruded PVC"}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-inner-sheath-val`]: val }))}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-slate-400 p-1 text-center"></td>
            <td className="border border-slate-400 p-1 pl-8 text-slate-600">
              <EditableCell
                value={specEdits[`${groupKey}-inner-diam-label`] ?? "- Diameter Over Inner Sheath"}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-inner-diam-label`]: val }))}
                align="left"
              />
            </td>
            <td className="border border-slate-400 p-1 text-center">mm</td>
            {items.map((item, idx) => (
              <td key={idx} className="border border-slate-400 p-1 text-center">
                <EditableCell
                  value={specEdits[`${item.params.id || idx}-inner-diam-val`] ?? item.result.spec.laidUpDiameter.toFixed(1).replace('.', ',')}
                  onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-inner-diam-val`]: val }))}
                />
              </td>
            ))}
          </tr>
        </>
      )}

      {/* 6.4 Armour */}
      {firstItem.params.armorType !== 'Unarmored' && (
        <>
          <tr>
            <td className="border border-slate-400 p-2 text-center">6.4</td>
            <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
              <EditableCell
                value={specEdits[`${groupKey}-armour-label`] ?? "Armour"}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-armour-label`]: val }))}
                align="left"
                bold={true}
              />
            </td>
            <td className="border border-slate-400 p-2 text-center">-</td>
            <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
              <EditableCell
                value={specEdits[`${groupKey}-armour-val`] ?? firstItem.params.armorType}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-armour-val`]: val }))}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-slate-400 p-1 text-center"></td>
            <td className="border border-slate-400 p-1 pl-8 text-slate-600">
              <EditableCell
                value={specEdits[`${groupKey}-armour-size-label`] ?? "- Armour Size"}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-armour-size-label`]: val }))}
                align="left"
              />
            </td>
            <td className="border border-slate-400 p-1 text-center">mm</td>
            {items.map((item, idx) => (
              <td key={idx} className="border border-slate-400 p-1 text-center">
                <EditableCell
                  value={specEdits[`${item.params.id || idx}-armour-size-val`] ?? item.result.spec.armorWireDiameter.toFixed(2).replace('.', ',')}
                  onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-armour-size-val`]: val }))}
                />
              </td>
            ))}
          </tr>
        </>
      )}

      {/* 6.5 Outer Sheath */}
      <tr>
        <td className="border border-slate-400 p-2 text-center">{firstItem.params.armorType !== 'Unarmored' ? '6.5' : (firstItem.params.cores > 1 ? '6.4' : '6.3')}</td>
        <td className="border border-slate-400 p-2 pl-4 font-bold text-slate-700">
          <EditableCell
            value={specEdits[`${groupKey}-sheath-label`] ?? "Outer Sheath"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-sheath-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-sheath-val`] ?? `Extruded ${firstItem.params.sheathMaterial}`}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-sheath-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 text-slate-600">
          <EditableCell
            value={specEdits[`${groupKey}-sheath-thick-label`] ?? "- Thickness (Nominal)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-sheath-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-sheath-thick-val`] ?? item.result.spec.sheathThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-sheath-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50 font-bold">
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8 text-slate-900">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "- Overall Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center italic">mm</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center text-blue-900">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>

      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">7</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-tech-data-label`] ?? "TECHNICAL DATA"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-tech-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7.1</td>
        <td className="border border-slate-400 p-2 pl-4 text-slate-700 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">Ohm/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-mono">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7.2</td>
        <td className="border border-slate-400 p-2 pl-4 text-slate-700 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-label`] ?? "AC Test Voltage (5 mins)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">kV</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-val`] ?? (isMV ? 'See Standard' : '3,5')}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-val`]: val }))}
          />
        </td>
      </tr>

      <tr className="bg-slate-100">
        <td className="border border-slate-400 p-2 text-center font-bold">8</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "NET WEIGHT (APPROX.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">kg/km</td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-indigo-700">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? Math.round(item.result.bom.totalWeight).toLocaleString('id-ID')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr className="bg-slate-50">
        <td className="border border-slate-400 p-2 text-center font-bold">9</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "STANDARD LENGTH"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center font-bold">m</td>
        {items.map((item, idx) => {
          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
          return (
            <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
              <EditableCell
                value={specEdits[`${item.params.id || idx}-std-length-val`] ?? String(packing.standardLength)}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-std-length-val`]: val }))}
                bold={true}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center font-bold">10</td>
        <td className="border border-slate-400 p-2 font-bold uppercase tracking-wider">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "PACKAGING"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">-</td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-val`] ?? "Non-Returnable Wooden Drum"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
    </>
  );
}
