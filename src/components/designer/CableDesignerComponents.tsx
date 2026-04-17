import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

export function EditableCell({ 
  value, 
  onChange, 
  className = "", 
  bold = false,
  uppercase = false,
  align = "center"
}: { 
  value: string, 
  onChange: (val: string) => void, 
  className?: string,
  bold?: boolean,
  uppercase?: boolean,
  align?: "left" | "center" | "right"
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editValue]);

  const handleBlur = () => {
    setIsEditing(false);
    onChange(editValue as string);
  };

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        autoFocus
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        rows={1}
        className={`bg-transparent border-none focus:ring-0 py-1 px-0.5 m-0 w-full outline-none font-inherit resize-none overflow-hidden block ${
          align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
        } ${bold ? 'font-bold' : ''} ${uppercase ? 'uppercase' : ''} ${className}`}
      />
    );
  }

  return (
    <div 
      onClick={() => {
        setEditValue(value);
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-slate-50/50 px-0.5 py-1 rounded transition-colors break-words ${
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
      } ${bold ? 'font-bold' : ''} ${uppercase ? 'uppercase' : ''} ${className}`}
    >
      {value || <span className="text-slate-300 italic">Empty</span>}
    </div>
  );
}

export function WeightFormulaRow({ 
  label, 
  detail,
  formulaKey,
  customFormulas,
  onFormulaChange
}: { 
  label: string; 
  detail?: { weight: number; formula: string; isCustom?: boolean; error?: boolean };
  formulaKey: string;
  customFormulas?: Record<string, string>;
  onFormulaChange: (key: string, formula: string | undefined) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  if (!detail || (detail.weight === 0 && !customFormulas?.[formulaKey])) return null;

  const handleEdit = () => {
    setEditValue(customFormulas?.[formulaKey] || detail.formula);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editValue.trim() === '' || (editValue === detail.formula && !customFormulas?.[formulaKey])) {
      onFormulaChange(formulaKey, undefined);
    } else {
      onFormulaChange(formulaKey, editValue);
    }
    setIsEditing(false);
  };

  return (
    <div className="py-2 border-b border-slate-50 last:border-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
          {label}
          {detail.isCustom && <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Custom</span>}
          {detail.error && <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Error</span>}
        </span>
        <span className={`text-xs font-bold font-mono ${detail.error ? 'text-red-500' : 'text-slate-900'}`}>
          {detail.error ? 'Err' : detail.weight.toFixed(2)} kg/km
        </span>
      </div>
      
      {isEditing ? (
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 text-[10px] font-mono bg-white border border-indigo-200 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600">Save</button>
          <button onClick={() => setIsEditing(false)} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded hover:bg-slate-300">Cancel</button>
        </div>
      ) : (
        <div 
          onClick={handleEdit}
          className={`text-[9px] font-mono p-1.5 rounded-lg border overflow-x-auto whitespace-nowrap cursor-pointer transition-colors ${
            detail.error 
              ? 'bg-red-50/50 text-red-500 border-red-100/50 hover:bg-red-50' 
              : detail.isCustom 
                ? 'bg-amber-50/50 text-amber-600 border-amber-100/50 hover:bg-amber-50'
                : 'bg-indigo-50/50 text-indigo-500 border-indigo-100/50 hover:bg-indigo-50'
          }`}
          title="Click to edit formula"
        >
          {detail.formula}
        </div>
      )}
    </div>
  );
}

export function SpecRow({ label, value, unit, isBold = false, precision = 2 }: { label: string; value: number | string; unit: string; isBold?: boolean; precision?: number }) {
  return (
    <div className={`flex justify-between items-center py-1 ${isBold ? 'font-bold text-slate-900' : 'text-sm text-slate-600'}`}>
      <span>{label}</span>
      <span className="font-mono text-slate-900">
        {typeof value === 'number' ? Number(value.toFixed(precision)) : value} <span className="text-slate-400 text-xs ml-1">{unit}</span>
      </span>
    </div>
  );
}

export function MaterialSettingsInput({ 
  label, 
  price, 
  density, 
  scrap,
  onPriceChange, 
  onDensityChange,
  onScrapChange,
  onQuickEdit
}: { 
  label: string; 
  price: number; 
  density: number; 
  scrap: number;
  onPriceChange: (v: number) => void; 
  onDensityChange: (v: number) => void; 
  onScrapChange: (v: number) => void;
  onQuickEdit: (title: string, value: number, unit: string, step: number, onSave: (v: number) => void) => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-100 hover:border-slate-200 transition-all">
      <div className="col-span-3">
        <label className="block text-[10px] font-bold text-slate-700 truncate" title={label}>{label}</label>
      </div>
      <div className="col-span-3 relative">
        <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center pointer-events-none">
          <span className="text-slate-400 text-[8px]">Rp</span>
        </div>
        <input
          type="number"
          value={price ?? 0}
          onFocus={(e) => {
            e.target.blur();
            onQuickEdit(`${label} Price`, price, 'Rp', 100, onPriceChange);
          }}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="w-full pl-5 pr-1 py-1 rounded-md border border-slate-200 focus:ring-1 focus:ring-indigo-500 text-[10px] font-mono cursor-pointer hover:bg-slate-50"
          placeholder="Price"
          readOnly
        />
      </div>
      <div className="col-span-3 relative">
        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none">
          <span className="text-slate-400 text-[7px]">g/cm³</span>
        </div>
        <input
          type="number"
          step="0.01"
          value={density ?? 0}
          onFocus={(e) => {
            e.target.blur();
            onQuickEdit(`${label} Density`, density, 'g/cm³', 0.01, onDensityChange);
          }}
          onChange={(e) => onDensityChange(Number(e.target.value))}
          className="w-full pl-1.5 pr-7 py-1 rounded-md border border-slate-200 focus:ring-1 focus:ring-indigo-500 text-[10px] font-mono cursor-pointer hover:bg-slate-50"
          placeholder="Density"
          readOnly
        />
      </div>
      <div className="col-span-3 relative">
        <div className="absolute inset-y-0 right-0 pr-1.5 flex items-center pointer-events-none">
          <span className="text-slate-400 text-[7px]">%Sc</span>
        </div>
        <input
          type="number"
          step="0.1"
          value={scrap ?? 0}
          onFocus={(e) => {
            e.target.blur();
            onQuickEdit(`${label} Scrap`, scrap, '%', 0.1, onScrapChange);
          }}
          onChange={(e) => onScrapChange(Number(e.target.value))}
          className="w-full pl-1.5 pr-7 py-1 rounded-md border border-slate-200 focus:ring-1 focus:ring-indigo-500 text-[10px] font-mono cursor-pointer hover:bg-slate-50"
          placeholder="Scrap"
          readOnly
        />
      </div>
    </div>
  );
}
