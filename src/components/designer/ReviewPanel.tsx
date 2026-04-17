import React, { useState } from 'react';
import { ArrowLeft, Printer, BarChart3, List, Settings, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { CableDesignParams, CalculationResult } from '../../utils/cableCalculations';
import { 
  getCableDesignation, 
  getConstructionKey, 
  calculateCostBreakdown, 
  calculatePacking, 
  calculateHPP,
  calculateSellingPrice
} from '../../utils/designerUtils';
import { DrumData } from '../../utils/drumData';

interface ReviewPanelProps {
  projectName: string;
  projectItems: { params: CableDesignParams; result: CalculationResult }[];
  setShowReview: (v: boolean) => void;
  reviewTab: 'summary' | 'specifications';
  setReviewTab: (v: 'summary' | 'specifications') => void;
  lmeParams: { kurs: number; lmeCu: number; lmeAl: number };
  totalProjectPrice: number;
  materialPrices: Record<string, number>;
  drumData: DrumData[];
  setProjectItems: React.Dispatch<React.SetStateAction<{ params: CableDesignParams; result: CalculationResult }[]>>;
  loadedProjectConfig: any;
  expandedItemId: string | null;
  setExpandedItemId: (v: string | null) => void;
  updateProjectItemParam: (idx: number, key: keyof CableDesignParams, value: any) => void;
  printingGroupId: number | null;
  setPrintingGroupId: (v: number | null) => void;
}

export default function ReviewPanel({
  projectName,
  projectItems,
  setShowReview,
  reviewTab,
  setReviewTab,
  lmeParams,
  totalProjectPrice,
  materialPrices,
  drumData,
  setProjectItems,
  loadedProjectConfig,
  expandedItemId,
  setExpandedItemId,
  updateProjectItemParam,
  printingGroupId,
  setPrintingGroupId
}: ReviewPanelProps) {
  
  // Group logic should be here or passed as prop
  const groupedItemsRaw = projectItems.reduce((acc, item) => {
    const key = getConstructionKey(item.params);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, {params: CableDesignParams, result: CalculationResult}[]>);

  const groupedItemsList: {key: string, items: {params: CableDesignParams, result: CalculationResult}[]}[] = [];
  (Object.entries(groupedItemsRaw) as [string, {params: CableDesignParams, result: CalculationResult}[]][]).forEach(([key, items]) => {
    for (let i = 0; i < items.length; i += 7) {
      groupedItemsList.push({
        key: items.length > 7 ? `${key}-part-${Math.floor(i/7) + 1}` : key,
        items: items.slice(i, i + 7)
      });
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-8 print:space-y-0 print:max-w-none">
        {/* Review Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowReview(false)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{projectName}</h1>
              <p className="text-sm text-slate-500">Project Review & Bill of Materials</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setPrintingGroupId(null);
                setTimeout(() => window.print(), 100);
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={() => setShowReview(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-md uppercase tracking-wider"
            >
              Designer
            </button>
          </div>
        </div>

        {/* Review Tabs */}
        <div className="flex gap-1 bg-slate-200/50 p-1 rounded-2xl w-fit print:hidden">
          <button
            onClick={() => setReviewTab('summary')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              reviewTab === 'summary' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Project Summary
          </button>
          <button
            onClick={() => setReviewTab('specifications')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              reviewTab === 'specifications' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <List className="w-4 h-4" />
            Technical Specifications
          </button>
        </div>

        <style type="text/css" media="print">
          {`@page { 
            size: ${
              reviewTab === 'summary' 
                ? 'landscape' 
                : (printingGroupId !== null 
                    ? (groupedItemsList[printingGroupId]?.items.length > 4 ? 'landscape' : 'portrait')
                    : (projectItems.length > 4 ? 'landscape' : 'portrait'))
            }; 
          }`}
        </style>

        {/* The rest of the content will be in the next TURN as it is too large for one Go */}
        {/* I will add it via edit_file later */}
        <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
           Migrating Content...
        </div>
      </div>
    </div>
  );
}
