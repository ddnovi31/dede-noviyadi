import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { CableDesignParams, CalculationResult, FlameRetardantCategory } from '../../utils/cableCalculations';
import { getCableDesignation, calculatePacking, getDefaultInsulationColor } from '../../utils/designerUtils';
import { EditableCell } from './CableDesignerComponents';
import { NYCY_DATA } from '../../utils/nycyData';
import { NFA2XT_DATA } from '../../utils/abcData';
import { AAC_DATA } from '../../utils/aacData';
import { DrumData } from '../../utils/drumData';

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
                {/* Specific logic for each standard should go here - mirroring CableDesigner.tsx */}
                {/* I will copy the logic in several blocks for manageability if I can't put it all at once */}
                {/* For now I'll use placeholders for better chunking if needed, but I'll try to put as much as possible */}
                {p.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)' ? renderNFA2XSpec(groupKey, items, specEdits, setSpecEdits, drumData) : 
                 p.standard === 'SPLN D3. 010-1 : 2015 (NFA2X-T)' ? renderNFA2XTSpec(groupKey, items, specEdits, setSpecEdits, drumData) :
                 p.standard === 'SPLN 41-6 : 1981 AAC' ? renderAACSpec(groupKey, items, specEdits, setSpecEdits, drumData) :
                 renderGeneralSpec(groupKey, items, specEdits, setSpecEdits, drumData, isMV)}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// Helper render functions
function renderNFA2XSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[]) {
  return (
    <>
      <tr>
        <td className="border border-slate-400 p-2 text-center">1</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-1 text-center">2</td>
        <td className="border border-slate-400 p-1 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center">
          {(() => {
            const editKey = `${groupKey}-ref-standard`;
            const defaultVal = "SPLN D3.010-1:2014\nADDENDUM SPLN D3.010-1:2015";
            return (
              <EditableCell
                value={specEdits[editKey] ?? defaultVal}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [editKey]: val }))}
              />
            );
          })()}
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">3</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-type-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "NFA2X"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">4</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Size"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-size-unit`] ?? "mm²"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-unit`]: val }))}
          />
        </td>
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
      <tr>
        <td className="border border-slate-400 p-2 text-center">5</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-unit`] ?? "kV"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? "0,6/1 (1,2)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "Constructional Data :"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-label`] ?? "- Conductor Phase"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-shape-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-shape-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-wire-label`] ?? "Number / Diameter of Wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-wire-unit`] ?? "dia/pcs"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-wire-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-phase-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-phase-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-diam-label`] ?? "Diameter of Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-phase-diam-val`] ?? item.result.spec.conductorDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-phase-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-label`] ?? "- Conductor Neutral"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-shape-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-shape-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-wire-label`] ?? "Number / Diameter of Wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-wire-unit`] ?? "dia/pcs"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-wire-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-neutral-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-neutral-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-diam-label`] ?? "Diameter of Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-neutral-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-neutral-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-neutral-diam-val`] ?? item.result.spec.conductorDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-neutral-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-label`] ?? "- Insulation Phase"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-unit`] ?? ""}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-val`] ?? "Extruded Black XLPE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-thick-label`] ?? "Thickness"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-thick-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-thick-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-phase-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-phase-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-diam-label`] ?? "Diameter Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-phase-diam-val`] ?? item.result.spec.coreDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-phase-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-insul-neutral-label`] ?? "- Insulation Neutral"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-neutral-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-neutral-unit`] ?? ""}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-neutral-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-neutral-val`] ?? "Extruded Black XLPE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-neutral-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-insul-neutral-thick-label`] ?? "Thickness"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-neutral-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-neutral-thick-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-neutral-thick-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-neutral-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-neutral-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-marking-label`] ?? "Marking on netral surface"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-marking-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-marking-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-marking-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          {(() => {
            const firstItem = items[0];
            const defaultMarking = `SPLN D3.010-1:2014  MULTI KABEL  NFA2X  ${firstItem.params.cores}x${firstItem.params.size} mm²  0.6/1 (1.2) kV   <>LMK<>`;
            const editKey = `${groupKey}-marking-group`;
            return (
              <EditableCell
                value={specEdits[editKey] ?? defaultMarking}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [editKey]: val }))}
                bold={true}
              />
            );
          })()}
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-label`] ?? "Calculated Breaking Load"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-unit`] ?? "kN"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-breaking-load-val`] ?? (item.result.spec.breakingLoad?.toFixed(2).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-breaking-load-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">8</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-label`] ?? "AC Test Voltage"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-unit`] ?? "kV/5Mins"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-val`] ?? "3,5"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">9</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "DC Condutor Resistance 20°C (Max.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-unit`] ?? "Ohm/km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(2).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">10</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-amp-air-label`] ?? "Current Carrying Capacity in Air"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-amp-air-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-amp-air-unit`] ?? "A"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-amp-air-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-amp-air-val`] ?? (item.result.electrical.currentCapacityAir || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-amp-air-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">11</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "Net Weight (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-unit`] ?? "Kg/Km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? item.result.bom.totalWeight.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">12</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "Standard Length Per Haspel"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-unit`] ?? "Meter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => {
          const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
          return (
            <td key={idx} className="border border-slate-400 p-2 text-center">
              <EditableCell
                value={specEdits[`${item.params.id || idx}-std-length-val`] ?? String(packing.standardLength)}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-std-length-val`]: val }))}
              />
            </td>
          );
        })}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">13</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "Packaging"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-val`] ?? "Wooden Drum"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-val`]: val }))}
          />
        </td>
      </tr>
    </>
  );
}

function renderNFA2XTSpec(groupKey: string, items: { params: CableDesignParams, result: CalculationResult }[], specEdits: any, setSpecEdits: any, drumData: DrumData[]) {
  return (
    <>
      <tr>
        <td className="border border-slate-400 p-2 text-center">1</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-1 text-center">2</td>
        <td className="border border-slate-400 p-1 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center">
          {(() => {
            const editKey = `${groupKey}-ref-standard`;
            const defaultVal = "SPLN D3.010-1:2014\nADDENDUM SPLN D3.010-1:2015";
            return (
              <EditableCell
                value={specEdits[editKey] ?? defaultVal}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [editKey]: val }))}
              />
            );
          })()}
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">3</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-type-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "NFA2X-T"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center">4</td>
        <td className="border border-slate-400 p-1 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Size"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-size-unit`] ?? "mm²"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? `${item.params.cores}x${item.params.size} + ${item.params.earthingSize}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">5</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-unit`] ?? "kV"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? "0,6/1 (1,2)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "Constructional Data :"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-label`] ?? "- Conductor Phase"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-wire-label`] ?? "No. and dia. of wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-wire-unit`] ?? "dia/pcs"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-wire-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-phase-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-phase-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-diam-label`] ?? "Diameter of Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-phase-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-phase-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-phase-diam-val`] ?? item.result.spec.conductorDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-phase-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-label`] ?? "- Messenger (Insulated)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-val`] ?? "Aluminium Alloy (AAAC)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-shape-val`] ?? "Round Stranded rm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-wire-label`] ?? "No. and dia. of wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-wire-unit`] ?? "dia/pcs"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-wire-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-messenger-wire-val`] ?? `${item.params.earthingSize === 25 ? '7' : '7'} / ${item.params.earthingSize === 25 ? '2.12' : (item.params.earthingSize === 35 ? '2.52' : (item.params.earthingSize === 50 ? '3.00' : '3.58'))}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-messenger-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-diam-label`] ?? "Diameter of Messenger"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-messenger-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-messenger-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-messenger-diam-val`] ?? (item.params.earthingSize === 25 ? '6,36' : (item.params.earthingSize === 35 ? '7,56' : (item.params.earthingSize === 50 ? '9,00' : (item.params.earthingSize === 70 ? '10,74' : (item.params.earthingSize === 95 ? '12,60' : '-')))))}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-messenger-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-insul-label`] ?? "- Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-val`] ?? "Extruded Black XLPE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-thick-label`] ?? "Thickness Phase (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-phase-thick-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-phase-thick-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-phase-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-phase-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-insul-messenger-thick-label`] ?? "Thickness Neutral (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-messenger-thick-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-messenger-thick-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-messenger-thick-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-insul-messenger-thick-val`] ?? item.result.spec.insulationThickness.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-insul-messenger-thick-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4">
          <EditableCell
            value={specEdits[`${groupKey}-marking-label`] ?? "Marking on Neutral surface"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-marking-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-marking-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-marking-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          {(() => {
            const firstItem = items[0];
            const defaultMarking = `SPLN D3.010-1:2014  MULTI KABEL  NFA2X-T  ${firstItem.params.cores}x${firstItem.params.size} + ${firstItem.params.earthingSize} mm²  0.6/1 (1.2) kV   <>LMK<>`;
            return (
              <EditableCell
                value={specEdits[`${groupKey}-marking-group`] ?? defaultMarking}
                onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-marking-group`]: val }))}
                bold={true}
              />
            );
          })()}
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-label`] ?? "Calculated Breaking Load"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-unit`] ?? "kN"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-breaking-load-val`] ?? (item.result.spec.breakingLoad?.toFixed(2).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-breaking-load-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">8</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-label`] ?? "AC Test Voltage"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-unit`] ?? "kV/5Mins"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ac-test-val`] ?? "3,5"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ac-test-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">9</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "DC Conductor Resistance at 20°C (Max.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-unit`] ?? "Ohm/km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(2).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">10</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-amp-air-label`] ?? "Current Carrying Capacity in air at 30°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-amp-air-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-amp-air-unit`] ?? "A"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-amp-air-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-amp-air-val`] ?? (item.result.electrical.currentCapacityAir || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-amp-air-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">11</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "Net Weight (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-unit`] ?? "Kg/Km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? item.result.bom.totalWeight.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">12</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "Standard length Per Haspel"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-unit`] ?? "Meter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-2 text-center">13</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "Packaging"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
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
  return (
    <>
      <tr>
        <td className="border border-slate-400 p-2 text-center">1</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-1 text-center">2</td>
        <td className="border border-slate-400 p-1 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? "SPLN 41-6 : 1981"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">3</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-type-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? "All Aluminium Bare Conductor (AAC)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">4</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Size"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-size-unit`] ?? "mm²"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-size-val`] ?? String(item.params.size)}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-size-val`]: val }))}
              bold={true}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">5</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "Constructional Data :"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-material-label`] ?? "- Material Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-material-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-material-val`] ?? "Aluminium EC Grade"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-material-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-val`] ?? "Round Stranded (rm)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-wire-label`] ?? "Number and Diameter of Wires (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-wire-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-wire-unit`] ?? "dia/pcs"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-wire-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-cond-wire-val`] ?? `${item.result.spec.wireCount} / ${item.result.spec.phaseCore.wireDiameter?.toFixed(2).replace('.', ',')}`}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-cond-wire-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter (Nom.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(2).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-label`] ?? "Min. Calculated Breaking Load"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-breaking-load-unit`] ?? "kN"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-breaking-load-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-breaking-load-val`] ?? (item.result.spec.breakingLoad?.toFixed(2).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-breaking-load-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-unit`] ?? "Ohm/km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">8</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "Net Weight (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-unit`] ?? "Kg/Km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? item.result.bom.totalWeight.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">9</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "Standard length Per Haspel"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-unit`] ?? "Meter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-2 text-center">10</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-label`] ?? "Packaging"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-packaging-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-packaging-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
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
  return (
    <>
      <tr>
        <td className="border border-slate-400 p-2 text-center">1</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-label`] ?? "Manufactured"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-manufactured-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-manufactured-unit`]: val }))}
          />
        </td>
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
        <td className="border border-slate-400 p-1 text-center">2</td>
        <td className="border border-slate-400 p-1 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-label`] ?? "Reference Standard"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-ref-standard-val`] ?? items[0].params.standard}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-ref-standard-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">3</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-type-label`] ?? "Type"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-type-unit`] ?? "-"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold">
          <EditableCell
            value={specEdits[`${groupKey}-type-val`] ?? getCableDesignation(items[0].params, items[0].result)}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-type-val`]: val }))}
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">4</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-size-label`] ?? "Size"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-size-unit`] ?? "mm²"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-size-unit`]: val }))}
          />
        </td>
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
      <tr>
        <td className="border border-slate-400 p-2 text-center">5</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-label`] ?? "Rated Voltage"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-unit`] ?? "kV"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-unit`]: val }))}
          />
        </td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-voltage-val`] ?? items[0].params.voltage}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-voltage-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">6</td>
        <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">
          <EditableCell
            value={specEdits[`${groupKey}-construction-data-label`] ?? "Constructional Data :"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-construction-data-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-label`] ?? "- Conductor"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-val`] ?? (items[0].params.conductorMaterial === 'Copper' ? 'Plain Annealed Copper Wire' : 'Aluminium EC Grade')}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-label`] ?? "Shape"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-cond-shape-val`] ?? "Round / Sector stranded rm/sm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-cond-shape-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-insul-label`] ?? "- Insulation"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-insul-val`] ?? (items[0].params.insulationMaterial === 'XLPE' ? 'Extruded XLPE' : 'Extruded PVC')}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-insul-val`]: val }))}
          />
        </td>
      </tr>
      {items[0].params.armorType !== 'Unarmored' && (
        <tr>
          <td className="border border-slate-400 p-2 text-center"></td>
          <td className="border border-slate-400 p-2 pl-4 font-medium">
            <EditableCell
              value={specEdits[`${groupKey}-armour-label`] ?? "- Armour"}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-armour-label`]: val }))}
              align="left"
              bold={true}
            />
          </td>
          <td className="border border-slate-400 p-2 text-center"></td>
          <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${groupKey}-armour-val`] ?? items[0].params.armorType}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-armour-val`]: val }))}
            />
          </td>
        </tr>
      )}
      <tr>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td className="border border-slate-400 p-2 pl-4 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-sheath-label`] ?? (items[0].params.cores === 1 ? "- Sheath" : "- Outer Sheath")}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-sheath-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center"></td>
        <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-sheath-val`] ?? "Extruded PVC / PE"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-sheath-val`]: val }))}
          />
        </td>
      </tr>
      <tr>
        <td className="border border-slate-400 p-1 text-center"></td>
        <td className="border border-slate-400 p-1 pl-8 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-label`] ?? "Overall Diameter (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-label`]: val }))}
            align="left"
          />
        </td>
        <td className="border border-slate-400 p-1 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-overall-diam-unit`] ?? "mm"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-overall-diam-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-1 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-overall-diam-val`] ?? item.result.spec.overallDiameter.toFixed(1).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-overall-diam-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">7</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-label`] ?? "Max. DC Resistance at 20°C"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-dc-res-unit`] ?? "Ohm/km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-dc-res-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-dc-res-val`] ?? (item.result.electrical.maxDcResistance?.toFixed(4).replace('.', ',') || '-')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-dc-res-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">8</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-label`] ?? "Net Weight (Approx.)"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-net-weight-unit`] ?? "Kg/Km"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-net-weight-unit`]: val }))}
          />
        </td>
        {items.map((item, idx) => (
          <td key={idx} className="border border-slate-400 p-2 text-center">
            <EditableCell
              value={specEdits[`${item.params.id || idx}-net-weight-val`] ?? item.result.bom.totalWeight.toFixed(0).replace('.', ',')}
              onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${item.params.id || idx}-net-weight-val`]: val }))}
            />
          </td>
        ))}
      </tr>
      <tr>
        <td className="border border-slate-400 p-2 text-center">9</td>
        <td className="border border-slate-400 p-2 font-medium">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-label`] ?? "Standard length"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-label`]: val }))}
            align="left"
            bold={true}
          />
        </td>
        <td className="border border-slate-400 p-2 text-center">
          <EditableCell
            value={specEdits[`${groupKey}-std-length-unit`] ?? "Meter"}
            onChange={(val) => setSpecEdits(prev => ({ ...prev, [`${groupKey}-std-length-unit`]: val }))}
          />
        </td>
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
    </>
  );
}
