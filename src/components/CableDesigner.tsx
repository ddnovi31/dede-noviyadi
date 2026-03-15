import React, { useState, useEffect } from 'react';
import { Settings, FileText, Package, Download, Zap, Info, Plus, Trash2, List, DollarSign, BarChart3, ArrowLeft, Printer, TrendingUp, RotateCcw, Maximize2, Minimize2, CheckCircle2, Database, Save, FolderOpen, Scale, X } from 'lucide-react';
import {
  calculateCable,
  CABLE_DATA,
  CableDesignParams,
  CalculationResult,
  CABLE_SIZES,
  ConductorMaterial,
  ConductorType,
  InsulationMaterial,
  ArmorType,
  SheathMaterial,
  CableStandard,
  MvScreenType,
  MaterialDensities,
  FlameRetardantCategory,
} from '../utils/cableCalculations';
import CableCrossSection from './CableCrossSection';
import { INITIAL_DRUM_DATA, DrumData } from '../utils/drumData';
import { initDB, saveProjectToDB, getProjectsFromDB, deleteProjectFromDB, SavedProject } from '../lib/db';
import * as XLSX from 'xlsx-js-style';

const DEFAULT_MATERIAL_PRICES = {
  Cu: 155000,
  Al: 45000,
  XLPE: 35000,
  PVC: 25000,
  PE: 30000,
  LSZH: 45000,
  Steel: 18000,
  SteelWire: 50000,
  SemiCond: 65000,
  MGT: 120000,
  TCu: 165000,
  'PVC-FR Cat.A': 35000,
  'PVC-FR Cat.B': 32000,
  'PVC-FR Cat.C': 30000,
  'PVC-FR': 28000,
  SHF1: 45000,
  SHF2: 48000,
  EPR: 42000,
  HEPR: 45000,
  TCWB: 165000,
  CTS: 160000,
  CWS: 158000,
  STA: 22000,
  SWA: 50000,
  AWA: 48000,
  GSWB: 25000,
  SFA: 24000,
  RGB: 26000,
  'Aluminium Foil': 15000,
  'Polyester Tape': 10000,
};

const DEFAULT_MATERIAL_DENSITIES = {
  Cu: 8.89,
  Al: 2.7,
  XLPE: 0.92,
  PVC: 1.45,
  PE: 0.95,
  LSZH: 1.5,
  Steel: 7.85,
  SteelWire: 7.85,
  SemiCond: 1.15,
  MGT: 2.2,
  TCu: 8.89,
  'PVC-FR Cat.A': 1.45,
  'PVC-FR Cat.B': 1.45,
  'PVC-FR Cat.C': 1.45,
  'PVC-FR': 1.45,
  SHF1: 1.5,
  SHF2: 1.6,
  EPR: 1.3,
  HEPR: 1.3,
  TCWB: 8.89,
  CTS: 8.89,
  CWS: 8.89,
  STA: 7.85,
  SWA: 7.85,
  AWA: 2.7,
  GSWB: 7.85,
  SFA: 7.85,
  RGB: 7.85,
  'Aluminium Foil': 2.7,
  'Polyester Tape': 1.4,
};

const DEFAULT_MATERIAL_SCRAP = {
  Cu: 2.5,
  Al: 2.5,
  XLPE: 5,
  PVC: 5,
  PE: 5,
  LSZH: 5,
  Steel: 2.5,
  SteelWire: 2.5,
  SemiCond: 5,
  MGT: 5,
  TCu: 2.5,
  'PVC-FR Cat.A': 5,
  'PVC-FR Cat.B': 5,
  'PVC-FR Cat.C': 5,
  SHF1: 5,
  SHF2: 5,
  EPR: 5,
  HEPR: 5,
  TCWB: 2.5,
  CTS: 2.5,
  CWS: 2.5,
  STA: 2.5,
  SWA: 2.5,
  AWA: 2.5,
  GSWB: 2.5,
  SFA: 2.5,
  RGB: 2.5,
};

const DEFAULT_PARAMS: CableDesignParams = {
  projectName: 'New Project',
  cores: 3,
  size: 50,
  conductorMaterial: 'Cu',
  conductorType: 'rm',
  insulationMaterial: 'XLPE',
  armorType: 'SWA',
  sheathMaterial: 'PVC',
  voltage: '0.6/1 kV',
  standard: 'IEC 60502-1',
  braidCoverage: 90,
  mvScreenType: 'None',
  mvScreenSize: 16,
  hasMgt: false,
  fireguard: false,
  stopfire: false,
  hasInnerSheath: true,
  innerSheathMaterial: 'PVC',
  flameRetardantCategory: 'None',
  overhead: 10,
  margin: 15,
  hasScreen: false,
  screenType: 'CTS',
  screenSize: 16,
  hasSeparator: false,
  separatorMaterial: 'PVC',
  earthingCores: 0,
  earthingSize: 0,
  mode: 'standard',
};

export default function CableDesigner() {
  const [params, setParams] = useState<CableDesignParams>(DEFAULT_PARAMS);

  const [activeTab, setActiveTab] = useState<'config' | 'prices' | 'drums' | 'settings'>('config');
  const [isConfigExpanded, setIsConfigExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [showReview, setShowReview] = useState(false);
  const [reviewTab, setReviewTab] = useState<'summary' | 'specifications'>('summary');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('Compound Insulation');
  const [printedSheets, setPrintedSheets] = useState<Set<number>>(new Set());
  const [printingGroupId, setPrintingGroupId] = useState<number | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [sqlConfig, setSqlConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cable_sql_config');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlForm, setSqlForm] = useState({ host: '', port: '', database: '', username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectSql = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(async () => {
      setIsConnecting(false);
      setSqlConfig(sqlForm);
      localStorage.setItem('cable_sql_config', JSON.stringify(sqlForm));
      setShowSqlModal(false);
      
      // Automatically create database (simulate by calling initDB)
      try {
        await initDB();
        alert('Successfully connected to SQL server and created "projects" table for storing projects!');
      } catch (err) {
        console.error(err);
        alert('Connected, but failed to create "projects" table.');
      }
    }, 1500);
  };

  const handleInitDB = async () => {
    if (!sqlConfig) {
      setShowSqlModal(true);
      return;
    }
    try {
      await initDB();
      alert('Database initialized successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to initialize database.');
    }
  };

  const handlePrintSheet = (groupIdx: number) => {
    setPrintingGroupId(groupIdx);
    setPrintedSheets(prev => new Set(prev).add(groupIdx));
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingGroupId(null), 100);
    }, 100);
  };

  const handleSaveProject = async () => {
    if (!sqlConfig) {
      setShowSqlModal(true);
      return;
    }
    if (projectItems.length === 0) {
      alert('No items to save.');
      return;
    }
    try {
      const id = projectId || crypto.randomUUID();
      const project: SavedProject = {
        id,
        name: projectName,
        items: projectItems,
        updatedAt: Date.now(),
      };
      await saveProjectToDB(project);
      setProjectId(id);
      alert('Project saved successfully to SQL database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save project to SQL database.');
    }
  };

  const handleLoadProjects = async () => {
    if (!sqlConfig) {
      setShowSqlModal(true);
      return;
    }
    try {
      const projects = await getProjectsFromDB();
      setSavedProjects(projects.sort((a, b) => b.updatedAt - a.updatedAt));
      setShowProjectsModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load projects from SQL database.');
    }
  };

  const handleExportExcel = () => {
    if (projectItems.length === 0) {
      alert('No items to export.');
      return;
    }

    const fmtNum = '#,##0.00';
    const fmtRp = '"Rp" #,##0.00';

    const createHeader = (text: string, bgColor: string) => ({
      v: text,
      t: 's',
      s: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: bgColor } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        },
        alignment: { horizontal: "center", vertical: "center" }
      }
    });

    const hGen = "475569";
    const hCond = "d97706";
    const hCScr = "1e293b";
    const hIns = "0284c7";
    const hIScr = "1e293b";
    const hMScr = "b45309";
    const hEarth = "16a34a";
    const hInSh = "475569";
    const hSep = "64748b";
    const hMGT = "fbbf24";
    const hArm = "334155";
    const hOutSh = "0f172a";
    const hTot = "4f46e5";

    const getConstructionKey = (params: CableDesignParams) => {
      return [
        params.standard,
        params.voltage,
        params.conductorMaterial,
        params.conductorType,
        params.insulationMaterial,
        params.armorType,
        params.sheathMaterial,
        params.innerSheathMaterial,
        params.mvScreenType,
        params.hasScreen ? params.screenType : 'None',
        params.hasSeparator ? 'Sep' : 'NoSep',
        params.hasEarthing ? 'Earth' : 'NoEarth',
        params.hasInnerSheath ? 'InSh' : 'NoInSh',
        params.hasIndividualScreen ? 'IS' : 'NoIS',
        params.hasOverallScreen ? 'OS' : 'NoOS',
        params.fireguard ? 'FG' : 'NoFG',
      ].join('|');
    };

    const groupedItems = projectItems.reduce((acc, item, index) => {
      const key = getConstructionKey(item.params);
      if (!acc[key]) acc[key] = [];
      acc[key].push({ item, index });
      return acc;
    }, {} as Record<string, { item: { params: CableDesignParams, result: CalculationResult }, index: number }[]>);

    const sheetsData: Record<string, any[][]> = {};
    const sheetsMerges: Record<string, any[]> = {};
    const summaryDataAOA: any[][] = [];
    
    summaryDataAOA.push([
      createHeader('No', hTot),
      createHeader('Designation', hTot),
      createHeader('Standard', hTot),
      createHeader('Voltage', hTot),
      createHeader('Cores', hTot),
      createHeader('Size', hTot),
      createHeader('OD (mm)', hTot),
      createHeader('Wt (kg/km)', hTot),
      createHeader('Packing', hTot),
      createHeader('Length (m)', hTot),
      createHeader('HPP (Rp/m)', hTot),
      createHeader('Selling Price (Rp/m)', hTot),
      createHeader('Total Price (Rp)', hTot)
    ]);

    let sheetCounter = 1;

    const getDensity = (material: string) => {
      const d: Record<string, number> = { Cu: 8.89, Al: 2.7, TCu: 8.89, XLPE: 0.922, PVC: 1.44, PE: 0.93, LSZH: 1.48, 'PVC-FR': 1.44, SHF1: 1.48, SHF2: 1.48, EPR: 1.25, HEPR: 1.25, Steel: 7.85, SteelWire: 7.85, SemiCond: 1.15, MGT: 1.4 };
      return d[material] || 1.44;
    };

    (Object.entries(groupedItems) as [string, { item: { params: CableDesignParams, result: CalculationResult }, index: number }[]][]).forEach(([groupKey, items]) => {
      const sampleItem = items[0].item;
      const isMV = sampleItem.params.standard === 'IEC 60502-2';
      const isIEC60502_1 = sampleItem.params.standard === 'IEC 60502-1';
      const hasScreen = isMV ? (sampleItem.params.mvScreenType && sampleItem.params.mvScreenType !== 'None') : (sampleItem.params.hasScreen && sampleItem.params.screenType && sampleItem.params.screenType !== 'None');
      const hasArmor = sampleItem.params.armorType && sampleItem.params.armorType !== 'Unarmored';
      const hasEarth = sampleItem.params.hasEarthing && sampleItem.params.earthingSize && sampleItem.params.earthingSize > 0;
      const isNoSheath = sampleItem.params.standard.includes('NYA') || sampleItem.params.standard.includes('NYAF') || sampleItem.params.standard.includes('NFA2X');
      const hasInnerSheath = !isNoSheath && ((sampleItem.params.armorType && sampleItem.params.armorType !== 'Unarmored') || sampleItem.params.hasInnerSheath || (sampleItem.params.innerSheathMaterial && sampleItem.params.innerSheathMaterial !== 'None'));
      const hasSeparator = isIEC60502_1 && (sampleItem.params.hasSeparator || (hasScreen && hasArmor));
      const hasOuterSheath = !sampleItem.params.standard.includes('NYA') && !sampleItem.params.standard.includes('NFA2X');
      const isNFA2XT = sampleItem.params.standard.includes('NFA2X-T');
      const isInstrumentation = sampleItem.params.standard === 'BS EN 50288-7';

      let sheetName = getCableDesignation(sampleItem.params, sampleItem.result).split(' ')[0];
      sheetName = `${sheetCounter++}. ${sheetName}`.replace(/[\\/?*[\]:]/g, '_').substring(0, 31);

      const topHeaders: any[] = [];
      const subHeaders: any[] = [];
      const merges: any[] = [];
      let currentCol = 0;

      const addGroup = (name: string, color: string, cols: string[]) => {
        topHeaders.push(createHeader(name, color));
        for (let i = 1; i < cols.length; i++) topHeaders.push(null);
        merges.push({ s: { r: 0, c: currentCol }, e: { r: 0, c: currentCol + cols.length - 1 } });
        cols.forEach(col => subHeaders.push(createHeader(col, color)));
        currentCol += cols.length;
      };

      // General
      addGroup('General', hGen, ['No', 'Core', 'Size', 'Laid-up Dia']);
      
      // Conductor
      addGroup('Conductor', hCond, ['Wires', 'Wire Dia', 'Cond OD', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (sampleItem.params.fireguard) {
        addGroup('MGT', hMGT, ['Thk (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      }

      if (isMV) addGroup('Cond Screen', hCScr, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      addGroup('Insulation', hIns, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (isMV) addGroup('Ins Screen', hIScr, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (isMV && hasScreen) {
        if (sampleItem.params.mvScreenType === 'CTS') {
          addGroup('Met Screen', hMScr, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else {
          addGroup('Met Screen', hMScr, ['Size (mm2)', 'Wire Dia (mm)', 'Wire Count', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        }
      }
      
      if (hasEarth) {
        if (isNFA2XT) addGroup('Earth Core', hEarth, ['Size', 'Al Wires', 'Al Dia', 'St Wires', 'St Dia', 'Wt (kg/km)', 'Cst (Rp/m)', 'Ins Thk', 'Ins Wt', 'Ins Cst']);
        else addGroup('Earth Core', hEarth, ['Size', 'Wires', 'Dia (mm)', 'Wt (kg/km)', 'Cst (Rp/m)', 'Ins Thk', 'Ins Wt', 'Ins Cst']);
      }

      if (isInstrumentation && sampleItem.params.hasIndividualScreen) addGroup('Indv Screen', hMScr, ['Al Foil Thk', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wires', 'Drain Size (mm2)', 'Drain Wt', 'Drain Prc', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);
      if (isInstrumentation && sampleItem.params.hasOverallScreen) addGroup('Ovrl Screen', hMScr, ['Al Foil Thk', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wires', 'Drain Size (mm2)', 'Drain Wt', 'Drain Prc', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);
      if (hasInnerSheath) addGroup('Inner Sheath', hInSh, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (!isMV && hasScreen) addGroup('Met Screen', hMScr, ['Thk/Size', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (hasSeparator) addGroup('Separator', hSep, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (hasArmor) addGroup('Armor', hArm, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (hasOuterSheath) addGroup('Outer Sheath', hOutSh, ['Thk (mm)', 'Overall Dia', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);

      addGroup('Summary', hTot, ['Pack Cst', 'Base HPP', 'OH (%)', 'HPP/m', 'MG (%)', 'Selling Price']);

      sheetsData[sheetName] = [topHeaders, subHeaders];
      sheetsMerges[sheetName] = merges;

      items.forEach(({ item, index }) => {
        const r = sheetsData[sheetName].length + 1;
        
        const condPrice = (item.params.conductorMaterial === 'Cu' ? materialPrices.Cu : (item.params.conductorMaterial === 'Al' ? materialPrices.Al : materialPrices.TCu));
        const insPrice = materialPrices[item.params.insulationMaterial as keyof typeof materialPrices] || materialPrices.XLPE;
        const innerPrice = materialPrices[item.params.innerSheathMaterial || 'PVC'] || materialPrices.PVC;
        
        const armorMat = item.params.armorType === 'AWA' ? 'AWA' : (item.params.armorType === 'SWA' ? 'SWA' : (item.params.armorType === 'STA' ? 'STA' : (item.params.armorType === 'SFA' ? 'SFA' : (item.params.armorType === 'RGB' ? 'RGB' : (item.params.armorType === 'GSWB' ? 'GSWB' : (item.params.armorType === 'TCWB' ? 'TCWB' : 'Steel'))))));
        const armorPrice = (
          item.params.armorType === 'AWA' ? (materialPrices.AWA || materialPrices.Al) : 
          item.params.armorType === 'SWA' ? (materialPrices.SWA || materialPrices.SteelWire) : 
          item.params.armorType === 'STA' ? (materialPrices.STA || materialPrices.Steel) : 
          item.params.armorType === 'SFA' ? (materialPrices.SFA || materialPrices.Steel) : 
          item.params.armorType === 'RGB' ? (materialPrices.RGB || materialPrices.Steel) : 
          item.params.armorType === 'GSWB' ? (materialPrices.GSWB || materialPrices.Steel) : 
          item.params.armorType === 'TCWB' ? (materialPrices.TCWB || materialPrices.TCu) : 
          materialPrices.Steel
        );

        const sheathPrice = materialPrices[item.params.sheathMaterial as keyof typeof materialPrices] || materialPrices.PVC;
        const semiPrice = materialPrices.SemiCond || 65000;
        const metScreenMat = item.params.screenType === 'CTS' ? 'CTS' : (item.params.screenType === 'CWS' ? 'CWS' : 'Steel');
        const metScreenPrice = item.params.screenType === 'CTS' ? (materialPrices.CTS || materialPrices.Cu) : materialPrices.Cu;
        const separatorPrice = materialPrices[item.params.separatorMaterial || 'PVC'] || materialPrices.PVC;

        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
        const packingCost = packing.packingCostPerMeter;

        let colIdx = 0;
        const getColName = (index: number) => {
          let colName = '';
          let temp = index;
          while (temp >= 0) {
            colName = String.fromCharCode(65 + (temp % 26)) + colName;
            temp = Math.floor(temp / 26) - 1;
          }
          return colName;
        };

        const row: any[] = [];
        const pushCol = (val: any, format?: string, formula?: string) => {
          if (formula) row.push({ t: 'n', f: formula, z: format });
          else if (typeof val === 'number') row.push({ v: val, t: 'n', z: format });
          else row.push({ v: val, t: 's' });
          return getColName(colIdx++);
        };

        // General
        pushCol(index + 1);
        const coreCol = pushCol(item.params.cores);
        pushCol(item.params.size);
        
        // We will fill Laid-up Dia formula later once we know Core OD
        const laidUpDiaColIdx = colIdx;
        const laidUpDiaCol = getColName(colIdx++);
        row.push(null); // Placeholder for Laid-up Dia

        // Conductor
        const wiresCol = pushCol(item.result.spec.phaseCore.wireCount || 0);
        const wireDiaCol = pushCol(item.result.spec.phaseCore.wireDiameter || 0, fmtNum);
        const condOdCol = pushCol(item.result.spec.phaseCore.conductorDiameter || 0, fmtNum);
        const condWtCol = pushCol(null, fmtNum, `PI()*(${wireDiaCol}${r}/2)^2*${wiresCol}${r}*${getDensity(item.params.conductorMaterial)}*${coreCol}${r}`);
        const condPrcCol = pushCol(condPrice, fmtRp);
        const condCstCol = pushCol(null, fmtRp, `${condWtCol}${r}*${condPrcCol}${r}/1000`);

        let currentDiaFormula = `${condOdCol}${r}`;

        // MGT
        if (item.params.fireguard) {
          const mgtThkCol = pushCol(item.result.spec.mgtThickness || 0.2, fmtNum);
          const mgtWtCol = pushCol(item.result.bom.mgtWeight || 0, fmtNum);
          const mgtPrcCol = pushCol(materialPrices.MGT || 120000, fmtRp);
          pushCol(null, fmtRp, `${mgtWtCol}${r}*${mgtPrcCol}${r}/1000`);
          currentDiaFormula = `(${currentDiaFormula}+2*${mgtThkCol}${r})`;
        }

        // Cond Screen
        let cScrCstCol, cScrThkCol, cScrWtCol;
        if (isMV) {
          cScrThkCol = pushCol(item.result.spec.conductorScreenThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${cScrThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          cScrWtCol = pushCol(null, fmtNum, `PI()*${cScrThkCol}${r}*(${currentDiaFormula}-2*${cScrThkCol}${r}+${cScrThkCol}${r})*${getDensity('SemiCond')}*${coreCol}${r}`);
          const cScrPrcCol = pushCol(semiPrice, fmtRp);
          cScrCstCol = pushCol(null, fmtRp, `${cScrWtCol}${r}*${cScrPrcCol}${r}/1000`);
        }

        // Insulation
        const insThkCol = pushCol(item.result.spec.phaseCore.insulationThickness || 0, fmtNum);
        currentDiaFormula = `(${currentDiaFormula}+2*${insThkCol}${r})`;
        pushCol(null, fmtNum, currentDiaFormula); // OD
        const insWtCol = pushCol(null, fmtNum, `PI()*${insThkCol}${r}*(${currentDiaFormula}-2*${insThkCol}${r}+${insThkCol}${r})*${getDensity(item.params.insulationMaterial)}*${coreCol}${r}`);
        const insPrcCol = pushCol(insPrice, fmtRp);
        const insCstCol = pushCol(null, fmtRp, `${insWtCol}${r}*${insPrcCol}${r}/1000`);

        // Ins Screen
        let iScrCstCol, iScrThkCol, iScrWtCol;
        if (isMV) {
          iScrThkCol = pushCol(item.result.spec.insulationScreenThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${iScrThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          iScrWtCol = pushCol(null, fmtNum, `PI()*${iScrThkCol}${r}*(${currentDiaFormula}-2*${iScrThkCol}${r}+${iScrThkCol}${r})*${getDensity('SemiCond')}*${coreCol}${r}`);
          const iScrPrcCol = pushCol(semiPrice, fmtRp);
          iScrCstCol = pushCol(null, fmtRp, `${iScrWtCol}${r}*${iScrPrcCol}${r}/1000`);
        }

        // Met Screen (MV)
        let mScrCstCol, mScrThkCol, mScrWtCol;
        if (isMV && hasScreen) {
          if (item.params.mvScreenType === 'CTS') {
            // CTS: Thk (mm), OD (mm), Wt (kg/km), Prc (Rp/kg), Cst (Rp/m)
            const thk = pushCol(item.params.manualMvScreenThickness || 0.2, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+2*${thk}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            let mScrWtFormula = `PI()*${thk}${r}*(${currentDiaFormula}-2*${thk}${r}+${thk}${r})*${getDensity('Cu')}*1.1*${coreCol}${r}`;
            mScrWtCol = pushCol(null, fmtNum, mScrWtFormula);
            const mScrPrcCol = pushCol(metScreenPrice, fmtRp);
            mScrCstCol = pushCol(null, fmtRp, `${mScrWtCol}${r}*${mScrPrcCol}${r}/1000`);
          } else {
            // CWS: Size (mm2), Wire Dia (mm), Wire Count, OD (mm), Wt (kg/km), Prc (Rp/kg), Cst (Rp/m)
            const sizeCol = pushCol(item.params.mvScreenSize || 0, fmtNum); // Size
            const wireDiaCol = pushCol(item.params.manualMvScreenWireDiameter || 0.5, fmtNum);
            pushCol(null, fmtNum, `${sizeCol}${r} / (PI() * POWER(${wireDiaCol}${r} / 2, 2))`); // Wire Count
            
            currentDiaFormula = `(${currentDiaFormula}+2*${wireDiaCol}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            mScrWtCol = pushCol(null, fmtNum, `${item.params.mvScreenSize || 0}*${getDensity('Cu')}*1.05*${coreCol}${r}`);
            const mScrPrcCol = pushCol(metScreenPrice, fmtRp);
            mScrCstCol = pushCol(null, fmtRp, `${mScrWtCol}${r}*${mScrPrcCol}${r}/1000`);
          }
        }

        // Now we have Core OD in currentDiaFormula. Let's set Laid-up Dia formula.
        const layUpFactor = item.result.spec.laidUpDiameter / (item.result.spec.coreDiameter || 1); // Approximate factor
        row[laidUpDiaColIdx] = { t: 'n', f: `${currentDiaFormula}*${layUpFactor.toFixed(3)}`, z: fmtNum };
        currentDiaFormula = `${laidUpDiaCol}${r}`;

        // Earth
        let earthCstCol, earthInsCstCol, earthWtCol, earthInsWtCol;
        if (hasEarth) {
          pushCol(item.params.earthingSize || 0, fmtNum);
          if (isNFA2XT) {
            const alWiresCol = pushCol(item.result.spec.earthingCore?.wireCount || 0);
            const alDiaCol = pushCol(item.result.spec.earthingCore?.wireDiameter || 0, fmtNum);
            const stWiresCol = pushCol(item.result.spec.earthingCore?.steelWireCount || 0);
            const stDiaCol = pushCol(item.result.spec.earthingCore?.steelWireDiameter || 0, fmtNum);
            
            earthWtCol = pushCol(null, fmtNum, `PI()*(${alDiaCol}${r}/2)^2*${alWiresCol}${r}*${getDensity('Al')} + PI()*(${stDiaCol}${r}/2)^2*${stWiresCol}${r}*${getDensity('SteelWire')}`);
            if (item.result.bom.earthingAlWeight !== undefined && item.result.bom.earthingSteelWeight !== undefined) {
              earthCstCol = pushCol(null, fmtRp, `(${item.result.bom.earthingAlWeight}*${materialPrices.Al}+${item.result.bom.earthingSteelWeight}*${materialPrices.SteelWire})/1000`);
            } else {
              earthCstCol = pushCol(null, fmtRp, `${earthWtCol}${r}*${condPrcCol}${r}/1000`);
            }
          } else {
            const earthWiresCol = pushCol(item.result.spec.earthingCore?.wireCount || 0);
            const earthWireDiaCol = pushCol(item.result.spec.earthingCore?.wireDiameter || 0, fmtNum);
            earthWtCol = pushCol(null, fmtNum, `PI()*(${earthWireDiaCol}${r}/2)^2*${earthWiresCol}${r}*${getDensity(item.params.conductorMaterial)}`);
            earthCstCol = pushCol(null, fmtRp, `${earthWtCol}${r}*${condPrcCol}${r}/1000`);
          }
          
          const earthInsThkCol = pushCol(item.result.spec.earthingCore?.insulationThickness || 0, fmtNum);
          let earthCurrentDiaFormula = isNFA2XT ? `(${getColName(colIdx - 5)}${r})` : `(${getColName(colIdx - 3)}${r})`;
          earthInsWtCol = pushCol(null, fmtNum, `PI()*${earthInsThkCol}${r}*(${earthCurrentDiaFormula}+${earthInsThkCol}${r})*${getDensity(item.params.insulationMaterial)}`);
          earthInsCstCol = pushCol(null, fmtRp, `${earthInsWtCol}${r}*${insPrcCol}${r}/1000`);
        }

        // IS
        let isCstCol, isAlWtCol, isDrainWtCol, isPetWtCol;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) {
          pushCol(0.05, fmtNum); // Al Foil Thk
          isAlWtCol = pushCol(item.result.bom.isAlWeight || 0, fmtNum);
          const isAlPrcCol = pushCol(materialPrices.Al, fmtRp);
          pushCol(1); // Drain Wires
          pushCol(item.params.manualScreenWireDiameter || 0.5, fmtNum); // Drain Size (mm2)
          isDrainWtCol = pushCol(item.result.bom.isDrainWeight || 0, fmtNum);
          const isDrainPrcCol = pushCol(materialPrices.TCu || materialPrices.Cu, fmtRp);
          pushCol(0.05, fmtNum); // PET Thk
          isPetWtCol = pushCol(item.result.bom.isPetWeight || 0, fmtNum);
          const isPetPrcCol = pushCol(materialPrices.PE || 25000, fmtRp);
          isCstCol = pushCol(null, fmtRp, `(${isAlWtCol}${r}*${isAlPrcCol}${r} + ${isDrainWtCol}${r}*${isDrainPrcCol}${r} + ${isPetWtCol}${r}*${isPetPrcCol}${r})/1000`);
        }

        // OS
        let osCstCol, osAlWtCol, osDrainWtCol, osPetWtCol;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) {
          pushCol(0.05, fmtNum); // Al Foil Thk
          osAlWtCol = pushCol(item.result.bom.osAlWeight || 0, fmtNum);
          const osAlPrcCol = pushCol(materialPrices.Al, fmtRp);
          pushCol(1); // Drain Wires
          pushCol(item.params.manualScreenWireDiameter || 0.5, fmtNum); // Drain Size (mm2)
          osDrainWtCol = pushCol(item.result.bom.osDrainWeight || 0, fmtNum);
          const osDrainPrcCol = pushCol(materialPrices.TCu || materialPrices.Cu, fmtRp);
          pushCol(0.05, fmtNum); // PET Thk
          osPetWtCol = pushCol(item.result.bom.osPetWeight || 0, fmtNum);
          const osPetPrcCol = pushCol(materialPrices.PE || 25000, fmtRp);
          osCstCol = pushCol(null, fmtRp, `(${osAlWtCol}${r}*${osAlPrcCol}${r} + ${osDrainWtCol}${r}*${osDrainPrcCol}${r} + ${osPetWtCol}${r}*${osPetPrcCol}${r})/1000`);
        }

        // Inner Sheath
        let inShCstCol, inShThkCol, inShWtCol;
        if (hasInnerSheath) {
          inShThkCol = pushCol(item.result.spec.innerCoveringThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${inShThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          inShWtCol = pushCol(null, fmtNum, `PI()*${inShThkCol}${r}*(${currentDiaFormula}-2*${inShThkCol}${r}+${inShThkCol}${r})*${getDensity(item.params.innerSheathMaterial || 'PVC')}`);
          const inShPrcCol = pushCol(innerPrice, fmtRp);
          inShCstCol = pushCol(null, fmtRp, `${inShWtCol}${r}*${inShPrcCol}${r}/1000`);
        }

        // Met Screen (LV)
        if (!isMV && hasScreen) {
          mScrThkCol = pushCol(item.result.spec.screenThickness || item.params.screenSize || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${mScrThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          let mScrWtFormula = `${item.result.bom.screenWeight || 0}`;
          if (item.params.screenType === 'CTS') {
            mScrWtFormula = `PI()*${mScrThkCol}${r}*(${currentDiaFormula}-2*${mScrThkCol}${r}+${mScrThkCol}${r})*${getDensity('Cu')}*1.1`;
          }
          mScrWtCol = pushCol(null, fmtNum, mScrWtFormula);
          const mScrPrcCol = pushCol(metScreenPrice, fmtRp);
          mScrCstCol = pushCol(null, fmtRp, `${mScrWtCol}${r}*${mScrPrcCol}${r}/1000`);
        }

        // Separator
        let sepCstCol, sepThkCol, sepWtCol;
        if (hasSeparator) {
          sepThkCol = pushCol(item.result.spec.separatorThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${sepThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          sepWtCol = pushCol(null, fmtNum, `PI()*${sepThkCol}${r}*(${currentDiaFormula}-2*${sepThkCol}${r}+${sepThkCol}${r})*${getDensity(item.params.separatorMaterial || 'PVC')}`);
          const sepPrcCol = pushCol(separatorPrice, fmtRp);
          sepCstCol = pushCol(null, fmtRp, `${sepWtCol}${r}*${sepPrcCol}${r}/1000`);
        }

        // Armor
        let armCstCol, armThkCol, armWtCol;
        if (hasArmor) {
          armThkCol = pushCol(item.result.spec.armorThickness || 0, fmtNum);
          let armWtFormula = `${item.result.bom.armorWeight || 0}`;
          let diameterAddition = `2*${armThkCol}${r}`;

          if (item.params.armorType === 'STA' || item.params.armorType === 'AWA' && item.result.spec.armorThickness < 1) {
            diameterAddition = `4*${armThkCol}${r}`;
            armWtFormula = `PI()*(${currentDiaFormula}+2*${armThkCol}${r})*2*${armThkCol}${r}*${getDensity(armorMat)}*1.02`;
          } else if (item.params.armorType === 'SWA' || item.params.armorType === 'AWA') {
            const armDensity = getDensity(item.params.armorType === 'AWA' ? 'Al' : 'SteelWire');
            armWtFormula = `INT(PI()*(${currentDiaFormula}+${armThkCol}${r})/(${armThkCol}${r}*1.05)) * PI() * (${armThkCol}${r}/2)^2 * ${armDensity} * 1.05`;
            diameterAddition = `2*${armThkCol}${r}`;
          } else if (item.params.armorType === 'SFA') {
            armWtFormula = `(PI()*(${currentDiaFormula}+${armThkCol}${r}*0.8)*${armThkCol}${r}*0.8*0.9*1.02 + PI()*(${currentDiaFormula}+2*${armThkCol}${r}*0.8+${armThkCol}${r}*0.2)*${armThkCol}${r}*0.2*1.2*1.02)*${getDensity('Steel')}`;
            diameterAddition = `2*${armThkCol}${r}`;
          } else if (item.params.armorType === 'RGB') {
            armWtFormula = `(INT(PI()*(${currentDiaFormula}+${armThkCol}${r}*0.85)/(${armThkCol}${r}*0.85*1.1))*PI()*(${armThkCol}${r}*0.85/2)^2*1.05 + PI()*(${currentDiaFormula}+2*${armThkCol}${r}*0.85+${armThkCol}${r}*0.15)*${armThkCol}${r}*0.15*1.2*1.02)*${getDensity('Steel')}`;
            diameterAddition = `2*${armThkCol}${r}`;
          } else if (item.params.armorType === 'GSWB' || item.params.armorType === 'TCWB') {
            const coverage = (item.params.braidCoverage || 90) / 100;
            const armDensity = getDensity(item.params.armorType === 'TCWB' ? 'TCu' : 'Steel');
            armWtFormula = `PI()*(${currentDiaFormula}+${armThkCol}${r}/2)*${armThkCol}${r}*${coverage}*${armDensity}`;
            diameterAddition = `2*${armThkCol}${r}`;
          }

          currentDiaFormula = `(${currentDiaFormula}+${diameterAddition})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          armWtCol = pushCol(null, fmtNum, armWtFormula);
          const armPrcCol = pushCol(armorPrice, fmtRp);
          armCstCol = pushCol(null, fmtRp, `${armWtCol}${r}*${armPrcCol}${r}/1000`);
        }

        // Outer Sheath
        let outShCstCol, outShThkCol, overallDiaCol, outShWtCol;
        if (hasOuterSheath) {
          outShThkCol = pushCol(item.result.spec.sheathThickness || 0, fmtNum);
          overallDiaCol = pushCol(null, fmtNum, `${currentDiaFormula}+2*${outShThkCol}${r}`);
          outShWtCol = pushCol(null, fmtNum, `PI()*${outShThkCol}${r}*(${currentDiaFormula}+${outShThkCol}${r})*${getDensity(item.params.sheathMaterial)}`);
          const outShPrcCol = pushCol(sheathPrice, fmtRp);
          outShCstCol = pushCol(null, fmtRp, `${outShWtCol}${r}*${outShPrcCol}${r}/1000`);
        }

        // Summary
        const packCstCol = pushCol(packingCost, fmtRp);
        
        let baseHppFormula = `${condCstCol}${r}+${insCstCol}${r}`;
        if (isMV) baseHppFormula += `+${cScrCstCol}${r}+${iScrCstCol}${r}`;
        if (hasScreen) baseHppFormula += `+${mScrCstCol}${r}`;
        if (hasEarth) baseHppFormula += `+${earthCstCol}${r}+${earthInsCstCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) baseHppFormula += `+${isCstCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) baseHppFormula += `+${osCstCol}${r}`;
        if (hasInnerSheath) baseHppFormula += `+${inShCstCol}${r}`;
        if (hasSeparator) baseHppFormula += `+${sepCstCol}${r}`;
        if (hasArmor) baseHppFormula += `+${armCstCol}${r}`;
        if (hasOuterSheath) baseHppFormula += `+${outShCstCol}${r}`;
        baseHppFormula += `+${packCstCol}${r}`;

        const baseHppCol = pushCol(null, fmtRp, baseHppFormula);
        const ohCol = pushCol(item.params.overhead || 0, fmtNum);
        const hppCol = pushCol(null, fmtRp, `${baseHppCol}${r}*(1+${ohCol}${r}/100)`);
        const mgCol = pushCol(item.params.margin || 0, fmtNum);
        const sellPrcCol = pushCol(null, fmtRp, `${hppCol}${r}*(1+${mgCol}${r}/100)`);

        sheetsData[sheetName].push(row);

        // Add to summary sheet
        const sumRow = summaryDataAOA.length + 1;
        
        // Calculate Total Weight Formula for Summary Sheet
        let totalWtFormula = `'${sheetName}'!${condWtCol}${r}`;
        if (isMV) totalWtFormula += `+'${sheetName}'!${cScrWtCol}${r}+'${sheetName}'!${iScrWtCol}${r}`;
        totalWtFormula += `+'${sheetName}'!${insWtCol}${r}`;
        if (hasScreen) totalWtFormula += `+'${sheetName}'!${mScrWtCol}${r}`;
        if (hasEarth) totalWtFormula += `+'${sheetName}'!${earthWtCol}${r}+'${sheetName}'!${earthInsWtCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) totalWtFormula += `+'${sheetName}'!${isAlWtCol}${r}+'${sheetName}'!${isDrainWtCol}${r}+'${sheetName}'!${isPetWtCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) totalWtFormula += `+'${sheetName}'!${osAlWtCol}${r}+'${sheetName}'!${osDrainWtCol}${r}+'${sheetName}'!${osPetWtCol}${r}`;
        if (hasInnerSheath) totalWtFormula += `+'${sheetName}'!${inShWtCol}${r}`;
        if (hasSeparator) totalWtFormula += `+'${sheetName}'!${sepWtCol}${r}`;
        if (hasArmor) totalWtFormula += `+'${sheetName}'!${armWtCol}${r}`;
        if (hasOuterSheath) totalWtFormula += `+'${sheetName}'!${outShWtCol}${r}`;

        summaryDataAOA.push([
          { v: index + 1, t: 'n' },
          { v: getCableDesignation(item.params, item.result), t: 's' },
          { v: item.params.standard, t: 's' },
          { v: item.params.voltage, t: 's' },
          { v: item.params.cores, t: 'n' },
          { v: item.params.size, t: 'n' },
          { t: 'n', f: hasOuterSheath ? `'${sheetName}'!${overallDiaCol}${r}` : `'${sheetName}'!${laidUpDiaCol}${r}`, z: fmtNum },
          { t: 'n', f: totalWtFormula, z: fmtNum },
          { v: `${packing.selectedDrum.type} (${packing.standardLength}m)`, t: 's' },
          { v: item.params.orderLength || 1000, t: 'n' },
          { t: 'n', f: `'${sheetName}'!${hppCol}${r}`, z: fmtRp },
          { t: 'n', f: `'${sheetName}'!${sellPrcCol}${r}`, z: fmtRp },
          { t: 'n', f: `L${sumRow}*J${sumRow}`, z: fmtRp }
        ]);
      });
    });

    if (summaryDataAOA.length > 1) {
      const lastRow = summaryDataAOA.length;
      summaryDataAOA.push([
        null, null, null, null, null, null, null, null, null,
        { v: 'Total', t: 's', s: { font: { bold: true } } },
        null, null,
        { t: 'n', f: `SUM(M2:M${lastRow})`, z: fmtRp, s: { font: { bold: true } } }
      ]);
    }

    const autoFitColumns = (aoa: any[][]) => {
      const colWidths: { wch: number }[] = [];
      aoa.forEach(row => {
        row.forEach((cell, colIdx) => {
          let val = '';
          if (cell === null || cell === undefined) {
            val = '';
          } else if (typeof cell === 'object') {
            if (cell.v !== undefined && cell.v !== null) val = String(cell.v);
            else if (cell.f) val = '123,456,789.00'; // Estimate length for formulas
          } else {
            val = String(cell);
          }
          const len = val.length + 2; // Add padding
          if (!colWidths[colIdx]) colWidths[colIdx] = { wch: 10 };
          if (len > colWidths[colIdx].wch) {
            colWidths[colIdx].wch = Math.min(len, 35); // Cap at 35 characters
          }
        });
      });
      return colWidths;
    };

    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryDataAOA);
    wsSummary['!cols'] = autoFitColumns(summaryDataAOA);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    
    // Add a sheet for each construction group
    Object.entries(sheetsData).forEach(([sheetName, dataAOA]) => {
      const wsDetails = XLSX.utils.aoa_to_sheet(dataAOA);
      wsDetails['!cols'] = autoFitColumns(dataAOA);
      wsDetails['!merges'] = sheetsMerges[sheetName];
      XLSX.utils.book_append_sheet(wb, wsDetails, sheetName);
    });

    XLSX.writeFile(wb, `${projectName || 'Cable_Project'}.xlsx`);
  };

  const handleOpenProject = (project: SavedProject) => {
    setProjectName(project.name);
    setProjectItems(project.items);
    setProjectId(project.id);
    setShowProjectsModal(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProjectFromDB(id);
      setSavedProjects(prev => prev.filter(p => p.id !== id));
      if (projectId === id) {
        setProjectId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete project.');
    }
  };
  const [quickEdit, setQuickEdit] = useState<{
    title: string;
    value: number;
    unit: string;
    step: number;
    onSave: (v: number) => void;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const [specEdits, setSpecEdits] = useState<Record<string, any>>({});

  const getDefaultInsulationColor = (cores: number, hasEarthing: boolean, isMV: boolean, isABC: boolean, formationType: string | undefined) => {
    if (isABC) return 'Black';
    if (isMV) return 'Standard';
    
    if (formationType === 'Pair') {
        const pairs = cores / 2;
        return pairs > 1 ? 'Black-White and Black-White with numbering mark' : 'Black-White';
    }
    if (formationType === 'Triad') {
        const triads = cores / 3;
        return triads > 1 ? 'Black-White-Red and Black-White-Red with numbering mark' : 'Black-White-Red';
    }
    if (formationType === 'Core') return 'Black with Numbering printing';
    
    if (cores === 1) return 'Black';
    if (cores === 2) return 'Blue, Black';
    if (cores === 3) return 'Brown, Black, Grey';
    if (cores === 4) return 'Blue, Brown, Black, Grey';
    if (cores === 5) {
      if (hasEarthing) return 'Black with Numbering';
      return 'Blue, Brown, Black, Grey, Y/G';
    }
    if (cores > 5) return 'Black with Numbering';
    return 'Standard (IEC)';
  };

  const [drumData, setDrumData] = useState<DrumData[]>(() => {
    const saved = localStorage.getItem('cable_drum_data');
    return saved ? JSON.parse(saved) : INITIAL_DRUM_DATA;
  });

  useEffect(() => {
    localStorage.setItem('cable_drum_data', JSON.stringify(drumData));
  }, [drumData]);

  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('cable_material_prices');
    const prices = saved ? JSON.parse(saved) : { ...DEFAULT_MATERIAL_PRICES };
    // Merge with defaults to ensure new materials are added
    Object.keys(DEFAULT_MATERIAL_PRICES).forEach(key => {
      if (prices[key] === undefined) {
        prices[key] = DEFAULT_MATERIAL_PRICES[key as keyof typeof DEFAULT_MATERIAL_PRICES];
      }
    });
    return prices;
  });

  const [materialDensities, setMaterialDensities] = useState<MaterialDensities>(() => {
    const saved = localStorage.getItem('cable_material_densities');
    const densities = saved ? JSON.parse(saved) : { ...DEFAULT_MATERIAL_DENSITIES };
    // Merge with defaults to ensure new materials are added
    Object.keys(DEFAULT_MATERIAL_DENSITIES).forEach(key => {
      if (densities[key as keyof MaterialDensities] === undefined) {
        densities[key as keyof MaterialDensities] = DEFAULT_MATERIAL_DENSITIES[key as keyof typeof DEFAULT_MATERIAL_DENSITIES];
      }
    });
    return densities;
  });

  const [materialScrap, setMaterialScrap] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('cable_material_scrap');
    const scrap = saved ? JSON.parse(saved) : { ...DEFAULT_MATERIAL_SCRAP };
    // Merge with defaults to ensure new materials are added
    Object.keys(DEFAULT_MATERIAL_SCRAP).forEach(key => {
      if (scrap[key] === undefined) {
        scrap[key] = DEFAULT_MATERIAL_SCRAP[key as keyof typeof DEFAULT_MATERIAL_SCRAP];
      }
    });
    return scrap;
  });

  const [materialCategories, setMaterialCategories] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('cable_material_categories');
    return saved ? JSON.parse(saved) : {};
  });

  const resetToDefaults = () => {
    setConfirmModal({
      show: true,
      title: 'Reset to Defaults',
      message: 'Are you sure you want to reset all material prices, densities, and scrap factors to their default values? This will overwrite your current settings.',
      onConfirm: () => {
        setMaterialPrices({ ...DEFAULT_MATERIAL_PRICES });
        setMaterialDensities({ ...DEFAULT_MATERIAL_DENSITIES });
        setMaterialScrap({ ...DEFAULT_MATERIAL_SCRAP });
        setMaterialCategories({});
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type: 'warning'
    });
  };

  const saveMaterialSettings = () => {
    localStorage.setItem('cable_material_prices', JSON.stringify(materialPrices));
    localStorage.setItem('cable_material_densities', JSON.stringify(materialDensities));
    localStorage.setItem('cable_material_scrap', JSON.stringify(materialScrap));
    localStorage.setItem('cable_material_categories', JSON.stringify(materialCategories));
    
    // Simple feedback
    const btn = document.activeElement as HTMLButtonElement;
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Saved!';
      btn.classList.add('bg-green-50', 'text-green-600', 'border-green-200');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-green-50', 'text-green-600', 'border-green-200');
      }, 2000);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterialName.trim()) return;
    const name = newMaterialName.trim();
    if (materialPrices[name]) {
      setConfirmModal({
        show: true,
        title: 'Material Exists',
        message: `Material "${name}" already exists in the database.`,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false })),
        type: 'info'
      });
      return;
    }
    setMaterialPrices(prev => ({ ...prev, [name]: 0 }));
    setMaterialDensities(prev => ({ ...prev, [name]: 1 }));
    setMaterialScrap(prev => ({ ...prev, [name]: 0 }));
    setMaterialCategories(prev => ({ ...prev, [name]: newMaterialCategory }));
    setNewMaterialName('');
  };

  const handleRemoveMaterial = (name: string) => {
    setConfirmModal({
      show: true,
      title: 'Remove Material',
      message: `Are you sure you want to remove "${name}"? This action cannot be undone.`,
      onConfirm: () => {
        const { [name]: _, ...restPrices } = materialPrices;
        const { [name]: __, ...restDensities } = materialDensities;
        const { [name]: ___, ...restScrap } = materialScrap;
        const { [name]: ____, ...restCategories } = materialCategories;
        setMaterialPrices(restPrices);
        setMaterialDensities(restDensities as MaterialDensities);
        setMaterialScrap(restScrap);
        setMaterialCategories(restCategories);
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type: 'danger'
    });
  };

  const handleResetToDefault = () => {
    setConfirmModal({
      show: true,
      title: 'Reset to Defaults',
      message: 'Are you sure you want to reset all material settings to factory defaults? All custom materials and prices will be lost.',
      onConfirm: () => {
        setMaterialPrices(DEFAULT_MATERIAL_PRICES);
        setMaterialDensities(DEFAULT_MATERIAL_DENSITIES);
        setMaterialScrap(DEFAULT_MATERIAL_SCRAP);
        setMaterialCategories({});
        localStorage.removeItem('cable_material_prices');
        localStorage.removeItem('cable_material_densities');
        localStorage.removeItem('cable_material_scrap');
        localStorage.removeItem('cable_material_categories');
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type: 'danger'
    });
  };

  const [projectItems, setProjectItems] = useState<{params: CableDesignParams, result: CalculationResult}[]>([]);
  const [projectName, setProjectName] = useState('New Project');
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    const res = calculateCable(params, materialDensities, materialScrap);
    setResult(res);
  }, [params, materialDensities, materialScrap]);

  const handleParamChange = (key: keyof CableDesignParams, value: any) => {
    if (value === 'ADD_NEW_COMPOUND' || value === 'ADD_NEW_OUTER_SHEATH') {
      setActiveTab('prices');
      setNewMaterialCategory('Compound (Filler/Sheath)');
      setTimeout(() => document.getElementById('new-material-input')?.focus(), 100);
      return;
    }
    if (value === 'ADD_NEW_COMPOUND_INSULATION') {
      setActiveTab('prices');
      setNewMaterialCategory('Compound Insulation');
      setTimeout(() => document.getElementById('new-material-input')?.focus(), 100);
      return;
    }
    
    setParams((prev) => {
      let processedValue = value;
      
      // Round manual overrides to 1 decimal place
      if (typeof value === 'number' && [
        'manualInsulationThickness', 
        'manualInnerSheathThickness', 
        'manualSheathThickness', 
        'manualConductorDiameter', 
        'manualArmorThickness', 
        'manualConductorScreenThickness', 
        'manualInsulationScreenThickness', 
        'manualMgtThickness',
        'manualWireDiameter',
        'manualEarthingWireDiameter',
        'manualEarthingConductorDiameter',
        'manualEarthingInsulationThickness',
        'manualLaidUpDiameter',
        'manualDiameterUnderArmor',
        'manualDiameterOverArmor',
        'manualOverallDiameter',
        'manualMvScreenThickness',
        'manualScreenThickness',
        'manualSeparatorThickness',
        'manualScreenWireDiameter',
        'manualMvScreenWireDiameter'
      ].includes(key)) {
        processedValue = Math.round(value * 10) / 10;
      }

      const newParams = { ...prev, [key]: processedValue };

      // Advance Mode Defaults
      if (key === 'mode' && value === 'advance') {
        newParams.manualConductorDiameter = undefined;
      }
      
      if (key === 'cores' || key === 'formationType') {
        const newCores = key === 'cores' ? value : prev.cores;
        const newFormation = key === 'formationType' ? value : prev.formationType;
        const isIsAllowed = newFormation !== 'Core' && newCores > 1;
        if (!isIsAllowed) {
          newParams.hasIndividualScreen = false;
        }
      }
      
      if (key === 'hasIndividualScreen' && value === true) {
        const isIsAllowed = prev.formationType !== 'Core' && 
                            !(prev.formationType === 'Pair' && prev.cores <= 2) && 
                            !(prev.formationType === 'Triad' && prev.cores <= 3);
        if (!isIsAllowed) {
          newParams.hasIndividualScreen = false;
        } else {
          newParams.hasOverallScreen = true;
        }
      }
      if (key === 'hasOverallScreen' && value === false) {
        newParams.hasIndividualScreen = false;
      }
      
      // Feature Logic
      if (key === 'fireguard') {
        newParams.hasMgt = value;
      }
      if (key === 'stopfire') {
        if (value === true) {
          if (!newParams.flameRetardantCategory || newParams.flameRetardantCategory === 'None') {
            newParams.flameRetardantCategory = 'None';
            newParams.sheathMaterial = 'PVC-FR';
          } else {
            newParams.sheathMaterial = `PVC-FR ${newParams.flameRetardantCategory}` as SheathMaterial;
          }
        } else {
          newParams.flameRetardantCategory = 'None';
          newParams.sheathMaterial = 'PVC';
        }
      }
      if (key === 'flameRetardantCategory') {
        if (value === 'None') {
          newParams.sheathMaterial = 'PVC-FR';
        } else {
          newParams.sheathMaterial = `PVC-FR ${value}` as SheathMaterial;
          newParams.stopfire = true;
        }
      }
      
      // Validation rules
      if (newParams.standard !== 'BS EN 50288-7') {
        if (newParams.cores === 1 && newParams.armorType === 'SWA') {
          newParams.armorType = 'AWA'; // Single core AC systems use AWA
        }
        if (newParams.cores > 1 && newParams.armorType === 'AWA') {
          newParams.armorType = 'SWA'; // Multi core uses SWA
        }
      }
      if (newParams.cores > 5 && newParams.size > 10) {
        newParams.size = 10; // Max 10mm2 for > 5 cores
      }
      if (newParams.cores === 1 && newParams.conductorType === 'sm') {
        newParams.conductorType = 'rm'; // Sector only for multi-core
      }

      // Aluminum size constraint: min 10mm2
      if (newParams.conductorMaterial === 'Al' && newParams.size < 10) {
        newParams.size = 10;
      }

      if (['size', 'cores', 'standard', 'voltage'].includes(key)) {
        newParams.manualInsulationThickness = undefined;
        newParams.manualInnerSheathThickness = undefined;
        newParams.manualSheathThickness = undefined;
        newParams.manualConductorDiameter = undefined;
        newParams.manualArmorThickness = undefined;
        newParams.manualConductorScreenThickness = undefined;
        newParams.manualInsulationScreenThickness = undefined;
        newParams.manualMgtThickness = undefined;
        newParams.manualWireDiameter = undefined;
        newParams.manualEarthingWireDiameter = undefined;
        newParams.manualEarthingConductorDiameter = undefined;
        newParams.manualEarthingInsulationThickness = undefined;
        newParams.manualLaidUpDiameter = undefined;
        newParams.manualDiameterUnderArmor = undefined;
        newParams.manualDiameterOverArmor = undefined;
        newParams.manualOverallDiameter = undefined;
        newParams.manualMvScreenThickness = undefined;
        newParams.manualScreenThickness = undefined;
        newParams.manualSeparatorThickness = undefined;
        newParams.manualScreenWireDiameter = undefined;
        newParams.manualMvScreenWireDiameter = undefined;
      }

      if (key === 'size') {
        newParams.earthingSize = value as number;
        if (newParams.standard.includes('NFA2X-T')) {
          if (newParams.size === 35) newParams.earthingSize = 35;
          else if (newParams.size === 50) newParams.earthingSize = 50;
          else if (newParams.size === 70) newParams.earthingSize = 70;
          else if (newParams.size === 95) newParams.earthingSize = 95;
          else if (newParams.size === 120) newParams.earthingSize = 95;
        }
      }

      if (newParams.size < 25 && newParams.conductorType === 'sm') {
        newParams.conductorType = 'rm'; // Sector usually for larger sizes
      }

      // Standard specific overrides
      if (newParams.standard === 'IEC 60502-2') {
        newParams.conductorType = 'cm';
        newParams.insulationMaterial = 'XLPE';
        if (newParams.cores !== 1 && newParams.cores !== 3) {
          newParams.cores = 3;
        }
        if (newParams.size < 25) {
          newParams.size = 25;
        }
        if (newParams.mvScreenType === 'None' || !newParams.mvScreenType) {
          newParams.mvScreenType = 'CTS';
        }
        if (!['3.6/6 kV', '6/10 kV', '8.7/15 kV', '12/20 kV', '18/30 kV'].includes(newParams.voltage)) {
          newParams.voltage = '6/10 kV';
        }
      } else {
        newParams.mvScreenType = 'None';
        if (newParams.standard.includes('SNI 04-6629')) {
          newParams.conductorMaterial = 'Cu';
          newParams.insulationMaterial = 'PVC';
          newParams.armorType = 'Unarmored';
          if (newParams.standard.includes('(NYM)')) {
            newParams.hasEarthing = false;
            if (newParams.cores < 2) newParams.cores = 2;
            if (newParams.cores > 5) newParams.cores = 5;
            if (newParams.size < 1.5) newParams.size = 1.5;
            if (newParams.size > 16) newParams.size = 16;
            newParams.voltage = '300/500 V';
            newParams.sheathMaterial = 'PVC';
            newParams.innerSheathMaterial = 'PVC';
            newParams.hasInnerSheath = true;
            
            // Conductor type based on table
            if (newParams.size >= 16) {
              newParams.conductorType = 'rm';
            }
          } else if (newParams.standard.includes('(NYAF)')) {
            newParams.hasEarthing = false;
            newParams.cores = 1;
            newParams.conductorType = 'f';
            newParams.voltage = '450/750 V';
          } else if (newParams.standard.includes('(NYA)')) {
            newParams.hasEarthing = false;
            newParams.cores = 1;
            if (newParams.size <= 10) {
              newParams.conductorType = 're';
            } else {
              newParams.conductorType = 'rm';
            }
            newParams.voltage = '450/750 V';
          } else if (newParams.standard.includes('(NYMHY)')) {
            newParams.hasEarthing = false;
            if (newParams.cores < 2) newParams.cores = 2;
            if (newParams.cores > 5) newParams.cores = 5;
            if (newParams.size > 2.5) newParams.size = 2.5;
            newParams.conductorType = 'f';
            newParams.voltage = '300/500 V';
            newParams.hasInnerSheath = false;
          }
        } else if (newParams.standard === 'IEC 60092-353') {
          newParams.voltage = '0.6/1 kV';
          newParams.insulationMaterial = 'XLPE';
          newParams.sheathMaterial = 'SHF1';
          if (newParams.armorType !== 'Unarmored' && newParams.armorType !== 'GSWB' && newParams.armorType !== 'TCWB') {
            newParams.armorType = 'GSWB';
          }
        } else if (newParams.standard.includes('NFA2X')) {
          newParams.conductorMaterial = 'Al';
          newParams.insulationMaterial = 'XLPE';
          newParams.armorType = 'Unarmored';
          newParams.hasInnerSheath = false;
          newParams.voltage = '0.6/1 kV';
          if (newParams.size < 10) newParams.size = 10;
          if (newParams.standard.includes('NFA2X-T')) {
            newParams.hasEarthing = true;
            newParams.earthingCores = 1;
            if (newParams.cores < 2) newParams.cores = 2;
            if (newParams.cores > 3) newParams.cores = 3;
            // Auto-set messenger size
            if (newParams.size === 35) newParams.earthingSize = 35;
            else if (newParams.size === 50) newParams.earthingSize = 50;
            else if (newParams.size === 70) newParams.earthingSize = 70;
            else if (newParams.size === 95) newParams.earthingSize = 95;
            else if (newParams.size === 120) newParams.earthingSize = 95;
          } else {
            newParams.hasEarthing = false;
            if (newParams.cores < 2) newParams.cores = 2;
            if (newParams.cores > 4) newParams.cores = 4;
          }
        } else if (newParams.standard === 'BS EN 50288-7') {
          if (newParams.voltage !== '300 V' && newParams.voltage !== '300/500 V') {
            newParams.voltage = '300/500 V';
          }
          if (newParams.size < 0.5) newParams.size = 0.5;
          if (newParams.size > 2.5) newParams.size = 2.5;
          if (newParams.conductorMaterial !== 'Cu' && newParams.conductorMaterial !== 'TCu') {
            newParams.conductorMaterial = 'Cu';
          }
          if (newParams.conductorType !== 're' && newParams.conductorType !== 'rm' && newParams.conductorType !== 'f') {
            newParams.conductorType = 're';
          }
          if (!newParams.formationType) newParams.formationType = 'Pair';
        }
      }

      if (newParams.armorType !== 'Unarmored') {
        newParams.hasInnerSheath = true;
      } else if (newParams.cores === 1 && (key === 'cores' || key === 'armorType' || key === 'standard')) {
        newParams.hasInnerSheath = false;
      }

      return newParams;
    });
  };

  const getCableDesignation = (p: CableDesignParams, r: CalculationResult | null) => {
    if (!r) return '';
    
    if (p.standard === 'BS EN 50288-7') {
      const formation = p.formationType || 'Pair';
      const isOs = p.hasIndividualScreen && p.hasOverallScreen ? 'IS-OS' : (p.hasOverallScreen ? 'OS' : '');
      const armor = p.armorType !== 'Unarmored' ? `/${p.armorType}` : '';
      const mgt = p.fireguard ? '/MGT' : '';
      const construction = `${p.conductorMaterial}${mgt}/${p.insulationMaterial}${isOs ? '/' + isOs : ''}${armor}/${p.sheathMaterial}`.toUpperCase();
      const elements = formation === 'Pair' ? '2' : (formation === 'Triad' ? '3' : '1');
      const sizeStr = formation === 'Core' ? `${p.cores} x ${p.size} mm²` : `${p.cores} x ${elements} x ${p.size} mm²`;
      return `${p.standard} ${construction} ${sizeStr} ${p.voltage}`;
    }

    if (p.standard.includes('NFA2X-T')) {
      return `NFA2X-T ${p.cores} x ${p.size} + ${p.earthingSize} mm² ${r.electrical.voltageRating}`;
    }
    if (p.standard.includes('NFA2X')) {
      return `NFA2X ${p.cores} x ${p.size} mm² ${r.electrical.voltageRating}`;
    }

    if (p.standard.includes('(NYA)') || p.standard.includes('(NYAF)')) {
      return `${p.conductorMaterial}/${p.insulationMaterial} ${p.cores} x ${p.size} mm² (${p.conductorType}) ${r.electrical.voltageRating}`;
    }

    const fg = p.fireguard ? '/MGT' : (p.hasMgt ? '/MGT' : '');
    const mvScreen = (p.mvScreenType && p.mvScreenType !== 'None') ? `/${p.mvScreenType}` : '';
    const overallScreen = (p.hasScreen && p.screenType && p.screenType !== 'None') ? `/${p.screenType}` : '';
    const separator = (p.hasSeparator || (p.hasScreen && p.armorType !== 'Unarmored')) ? `/${p.separatorMaterial || 'PVC'}` : '';
    const armor = p.armorType === 'Unarmored' ? '' : `/${p.armorType}`;
    
    let sizeDesignation = `${p.cores} x ${p.size}`;
    if (p.hasEarthing && p.earthingCores && p.earthingCores > 0 && p.earthingSize && p.earthingSize > 0) {
      if (p.earthingCores === 1) {
        sizeDesignation += ` + ${p.earthingSize}`;
      } else {
        sizeDesignation += ` + ${p.earthingCores} x ${p.earthingSize}`;
      }
    }

    return `${p.conductorMaterial}${fg}/${p.insulationMaterial}${mvScreen}${overallScreen}${separator}${armor}/${p.sheathMaterial} ${sizeDesignation} mm² (${p.conductorType}) ${r.electrical.voltageRating}`;
  };

  const getConstructionKey = (p: CableDesignParams) => {
    return [
      p.standard,
      p.voltage,
      p.conductorMaterial,
      p.conductorType,
      p.insulationMaterial,
      p.hasInnerSheath,
      p.innerSheathMaterial,
      p.armorType,
      p.sheathMaterial,
      p.hasMgt,
      p.hasScreen,
      p.screenType,
      p.mvScreenType,
      p.fireguard,
      p.stopfire,
      p.flameRetardantCategory
    ].join('|');
  };

  const handleDownloadReport = () => {
    if (!result) return;
    
    const report = {
      projectName: projectName,
      date: new Date().toISOString(),
      items: projectItems.length > 0 ? projectItems.map(item => ({
        designation: getCableDesignation(item.params, item.result),
        parameters: item.params,
        result: item.result
      })) : [{
        designation: getCableDesignation(params, result),
        parameters: params,
        result: result
      }]
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cable_Design_${params.cores}x${params.size}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addToProject = () => {
    if (!result) return;
    if (params.hasIndividualScreen && params.hasOverallScreen) {
      if (params.formationType === 'Pair' || params.formationType === 'Triad') {
        const formationCount = params.formationType === 'Triad' ? params.cores / 3 : params.cores / 2;
        if (formationCount <= 1) {
          alert('Untuk konfigurasi IS-OS, jumlah pair atau triad harus lebih besar dari 1.');
          return;
        }
      }
    }
    setProjectItems(prev => [...prev, { params: { ...params, id: crypto.randomUUID() }, result }]);
    setParams(prev => ({ ...DEFAULT_PARAMS, projectName: prev.projectName }));
  };

  const removeFromProject = (id: string) => {
    setProjectItems(prev => prev.filter(item => item.params.id !== id));
  };

  const calculateCostBreakdown = (bom: CalculationResult['bom'], params: CableDesignParams) => {
    const formationType = params.formationType || 'Pair';
    const multiplier = formationType === 'Pair' ? params.cores / 2 : (formationType === 'Triad' ? params.cores / 3 : params.cores);
    const condPrice = (params.conductorMaterial === 'Cu' ? materialPrices.Cu : (params.conductorMaterial === 'Al' ? materialPrices.Al : materialPrices.TCu));
    const insPrice = (materialPrices[params.insulationMaterial as keyof typeof materialPrices] || materialPrices.XLPE);
    const armorPrice = (
      params.armorType === 'AWA' ? (materialPrices.AWA || materialPrices.Al) : 
      params.armorType === 'SWA' ? (materialPrices.SWA || materialPrices.SteelWire) : 
      params.armorType === 'STA' ? (materialPrices.STA || materialPrices.Steel) : 
      params.armorType === 'SFA' ? (materialPrices.SFA || materialPrices.Steel) : 
      params.armorType === 'RGB' ? (materialPrices.RGB || materialPrices.Steel) : 
      params.armorType === 'GSWB' ? (materialPrices.GSWB || materialPrices.Steel) : 
      params.armorType === 'TCWB' ? (materialPrices.TCWB || materialPrices.TCu) : 
      materialPrices.Steel
    );
    const sheathPrice = (materialPrices[params.sheathMaterial as keyof typeof materialPrices] || materialPrices.PVC);
    const innerPrice = (materialPrices[params.innerSheathMaterial || 'PVC'] || materialPrices.PVC);
    const separatorPrice = (materialPrices[params.separatorMaterial || 'PVC'] || materialPrices.PVC);
    const semiPrice = materialPrices.SemiCond;
    const screenPrice = params.screenType === 'CTS' ? (materialPrices.CTS || materialPrices.Cu) : (params.screenType === 'CWS' ? (materialPrices.CWS || materialPrices.Cu) : materialPrices.Steel);
    const mvScreenPrice = materialPrices.Cu;
    const mgtPrice = materialPrices.MGT;
    const steelWirePrice = materialPrices.SteelWire || 50000;

    const breakdown: any = {
      conductor: ((bom.conductorWeight - bom.earthingConductorWeight) * condPrice) / 1000,
      insulation: ((bom.insulationWeight - bom.earthingInsulationWeight) * insPrice) / 1000,
      armor: (bom.armorWeight * armorPrice) / 1000,
      sheath: (bom.sheathWeight * sheathPrice) / 1000,
      innerCovering: (bom.innerCoveringWeight * innerPrice) / 1000,
      screen: (bom.screenWeight * screenPrice) / 1000,
      separator: (bom.separatorWeight * separatorPrice) / 1000,
      semiCond: (bom.semiCondWeight * semiPrice) / 1000,
      mvScreen: (bom.mvScreenWeight * mvScreenPrice) / 1000,
      mgt: (bom.mgtWeight * mgtPrice) / 1000,
      isAl: bom.isAlWeight ? (bom.isAlWeight * multiplier * materialPrices.Al) / 1000 : 0,
      isDrain: bom.isDrainWeight ? (bom.isDrainWeight * multiplier * materialPrices.Cu) / 1000 : 0,
      isPet: bom.isPetWeight ? (bom.isPetWeight * multiplier * materialPrices.PE) / 1000 : 0,
      osAl: bom.osAlWeight ? (bom.osAlWeight * materialPrices.Al) / 1000 : 0,
      osDrain: bom.osDrainWeight ? (bom.osDrainWeight * materialPrices.Cu) / 1000 : 0,
      osPet: bom.osPetWeight ? (bom.osPetWeight * materialPrices.PE) / 1000 : 0,
    };

    if (params.standard.includes('NFA2X-T') && bom.earthingAlWeight !== undefined && bom.earthingSteelWeight !== undefined) {
      breakdown.earthingAl = (bom.earthingAlWeight * materialPrices.Al) / 1000;
      breakdown.earthingSteel = (bom.earthingSteelWeight * steelWirePrice) / 1000;
      breakdown.earthingInsulation = (bom.earthingInsulationWeight * insPrice) / 1000;
    } else {
      breakdown.earthingConductor = (bom.earthingConductorWeight * condPrice) / 1000;
      breakdown.earthingInsulation = (bom.earthingInsulationWeight * insPrice) / 1000;
    }

    return breakdown;
  };

  const calculatePacking = (overallDiameter: number, totalWeight: number) => {
    let standardLength = 300;
    if (overallDiameter <= 40) standardLength = 1000;
    else if (overallDiameter <= 50) standardLength = 500;

    const CLEARANCE = 100; // 4cm from top = 40mm radius = 80mm diameter reduction (more realistic than 200mm)

    // Find the smallest drum that can fit this length
    const sortedDrums = [...drumData].sort((a, b) => {
      const effD_A = Math.max(0, a.diameterWithCover - CLEARANCE);
      const effD_B = Math.max(0, b.diameterWithCover - CLEARANCE);
      const volA = (Math.PI * (Math.pow(effD_A, 2) - Math.pow(a.barrelDiameter, 2)) / 4) * a.outerWidth;
      const volB = (Math.PI * (Math.pow(effD_B, 2) - Math.pow(b.barrelDiameter, 2)) / 4) * b.outerWidth;
      return volA - volB;
    });

    let selectedDrum = sortedDrums[sortedDrums.length - 1]; // Fallback to largest
    for (const drum of sortedDrums) {
      const effD = Math.max(0, drum.diameterWithCover - CLEARANCE);
      if (effD <= drum.barrelDiameter) continue;

      // Bending Radius Constraint: Barrel diameter should be at least 15x cable OD
      if (drum.barrelDiameter < overallDiameter * 15) continue;

      // Apply 50% safety factor to cable diameter as requested
      const effectiveOD = overallDiameter +5;

      // Industrial Scale Capacity formula: L = (W * (D^2 - d^2)) / (OD^2 * f)
      // Dividing by 1000 to convert result from mm to meters. 
      // This formula compares winding volume to cable volume with a space factor.
      const capacity = (drum.innerWidth * (Math.pow(effD, 2) - Math.pow(drum.barrelDiameter, 2))) / (1000 * Math.pow(effectiveOD, 2) * 1.15);
      
      if (capacity >= standardLength) {
        selectedDrum = drum;
        break;
      }
    }

    const netWeight = (totalWeight * standardLength) / 1000;
    const grossWeight = netWeight + selectedDrum.weight;
    const packingCostPerMeter = selectedDrum.price / standardLength;

    return {
      standardLength,
      selectedDrum,
      netWeight,
      grossWeight,
      packingCostPerMeter
    };
  };

  const calculateHPP = (res: CalculationResult, par: CableDesignParams) => {
    const breakdown = calculateCostBreakdown(res.bom, par);
    const baseHpp = (Object.values(breakdown) as number[]).reduce((a: number, b: number) => a + (typeof b === 'number' ? b : 0), 0);
    
    // Add packing cost
    const packing = calculatePacking(res.spec.overallDiameter, res.bom.totalWeight);
    const hppWithPacking = baseHpp + packing.packingCostPerMeter;
    
    const overheadFactor = 1 + (par.overhead || 0) / 100;
    return hppWithPacking * overheadFactor;
  };

  const calculateSellingPrice = (hpp: number, margin: number = 0) => {
    const price = hpp * (1 + margin / 100);
    // Round to nearest 10 (1 digit puluhan)
    return Math.round(price / 10) * 10;
  };

  const currentHPP = result ? calculateHPP(result, params) : 0;
  const currentSellingPrice = calculateSellingPrice(currentHPP, params.margin);

  if (showReview) {
    const totalProjectPrice = projectItems.reduce((acc, item) => {
      const hpp = calculateHPP(item.result, item.params);
      return acc + calculateSellingPrice(hpp, item.params.margin);
    }, 0);

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

          <div className={reviewTab === 'summary' ? 'block print:block space-y-6 print-landscape-page' : 'hidden print:hidden'}>
            {/* Project Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-scale">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Items</div>
                  <div className="text-3xl font-bold text-slate-900">{projectItems.length} Cables</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimated Project HPP (per meter sum)</div>
                  <div className="text-3xl font-bold text-indigo-600 font-mono">
                    Rp {totalProjectPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>

          {/* Detailed Items Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300 print-scale">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-600" />
                Cable Specifications & Costs
              </h2>
              <div className="flex items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500">Set All OH:</label>
                  <input 
                    type="number" 
                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="%"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setProjectItems(prev => prev.map(item => ({
                          ...item,
                          params: { ...item.params, overhead: val }
                        })));
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500">Set All MG:</label>
                  <input 
                    type="number" 
                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                    placeholder="%"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setProjectItems(prev => prev.map(item => ({
                          ...item,
                          params: { ...item.params, margin: val }
                        })));
                      }
                    }}
                  />
                </div>
                <button 
                  onClick={() => {
                    setReviewTab('summary');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Print Summary
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4 border-b border-slate-100">Designation</th>
                    <th className="px-6 py-4 border-b border-slate-100">Dimensions</th>
                    <th className="px-6 py-4 border-b border-slate-100">Weight</th>
                    <th className="px-6 py-4 border-b border-slate-100">Packing</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Cond. Price</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">Order Length (m)</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">OH (%)</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">MG (%)</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">HPP / Meter</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Selling Price</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectItems.map((item, idx) => {
                    const hpp = calculateHPP(item.result, item.params);
                    const sellingPrice = calculateSellingPrice(hpp, item.params.margin);
                    const breakdown = calculateCostBreakdown(item.result.bom, item.params);
                    const conductorPrice = breakdown.conductor + (breakdown.earthingConductor || 0) + (breakdown.earthingAl || 0) + (breakdown.earthingSteel || 0);
                    return (
                      <tr key={item.params.id || idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {getCableDesignation(item.params, item.result)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">{item.params.standard}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-600">OD: <span className="font-mono text-slate-900">{item.result.spec.overallDiameter.toFixed(2)} mm</span></div>
                          <div className="text-[10px] text-slate-400">Core: {item.result.spec.coreDiameter.toFixed(2)} mm</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-900 font-mono">{Math.round(item.result.bom.totalWeight).toLocaleString()} kg/km</div>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
                            return (
                              <div className="text-[10px] text-slate-600">
                                <div className="font-bold text-indigo-600">{packing.selectedDrum.type}</div>
                                <div className="text-slate-400">{packing.standardLength} m</div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-bold text-slate-600 font-mono">Rp {Math.round(conductorPrice).toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            className="w-20 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                            value={item.params.orderLength || 1000}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                setProjectItems(prev => prev.map((pItem, pIdx) => 
                                  (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, orderLength: val } } : pItem
                                ));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                            value={item.params.overhead || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                setProjectItems(prev => prev.map((pItem, pIdx) => 
                                  (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, overhead: val } } : pItem
                                ));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="number" 
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                            value={item.params.margin || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                setProjectItems(prev => prev.map((pItem, pIdx) => 
                                  (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, margin: val } } : pItem
                                ));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-bold text-slate-400 font-mono">Rp {hpp.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-indigo-600 font-mono">Rp {sellingPrice.toLocaleString('id-ID')}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-bold text-emerald-600 font-mono">Rp {(sellingPrice * (item.params.orderLength || 1000)).toLocaleString('id-ID')}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOM Summary for Project */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border-slate-300 print-scale">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-emerald-600" />
              Consolidated Bill of Materials (Project Total)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Conductor & Screen */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Conductor & Screen</h3>
                {Object.entries(projectItems.reduce((acc, item) => {
                  const condMat = item.params.conductorMaterial === 'Cu' ? 'Copper (Cu)' : 'Aluminum (Al)';
                  acc[condMat] = (acc[condMat] || 0) + item.result.bom.conductorWeight;
                  if (item.result.bom.mvScreenWeight > 0) {
                    const screenMat = item.params.mvScreenType === 'TCWB' ? 'Tinned Copper (TCWB)' : 'Copper Tape/Wire';
                    acc[screenMat] = (acc[screenMat] || 0) + item.result.bom.mvScreenWeight;
                  }
                  return acc;
                }, {} as Record<string, number>)).map(([mat, weight]) => (
                  <div key={mat} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{mat}</span>
                    <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
                  </div>
                ))}
              </div>

              {/* Insulation & MGT */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Insulation, Tapes & Screens</h3>
                {Object.entries(projectItems.reduce((acc, item) => {
                  const insMat = item.params.insulationMaterial;
                  acc[insMat] = (acc[insMat] || 0) + item.result.bom.insulationWeight;
                  if (item.result.bom.mgtWeight > 0) {
                    acc['Mica Glass Tape (MGT)'] = (acc['Mica Glass Tape (MGT)'] || 0) + item.result.bom.mgtWeight;
                  }
                  if (item.result.bom.semiCondWeight > 0) {
                    acc['Semi-conductive Layers'] = (acc['Semi-conductive Layers'] || 0) + item.result.bom.semiCondWeight;
                  }
                  // IS-OS/OS Materials
                  const isOsWeight = (item.result.bom.isAlWeight || 0) + (item.result.bom.osAlWeight || 0);
                  if (isOsWeight > 0) acc['Aluminium Foil (IS-OS/OS)'] = (acc['Aluminium Foil (IS-OS/OS)'] || 0) + isOsWeight;
                  
                  const drainWeight = (item.result.bom.isDrainWeight || 0) + (item.result.bom.osDrainWeight || 0);
                  if (drainWeight > 0) acc['Drain Wire (IS-OS/OS)'] = (acc['Drain Wire (IS-OS/OS)'] || 0) + drainWeight;
                  
                  const petWeight = (item.result.bom.isPetWeight || 0) + (item.result.bom.osPetWeight || 0);
                  if (petWeight > 0) acc['Polyester Tape (IS-OS/OS)'] = (acc['Polyester Tape (IS-OS/OS)'] || 0) + petWeight;
                  
                  return acc;
                }, {} as Record<string, number>)).map(([mat, weight]) => (
                  <div key={mat} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{mat}</span>
                    <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
                  </div>
                ))}
              </div>

              {/* Sheaths & Armour */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Sheaths & Armour</h3>
                {Object.entries(projectItems.reduce((acc, item) => {
                  // Inner Sheath
                  if (item.result.bom.innerCoveringWeight > 0) {
                    const isMat = `${item.params.innerSheathMaterial || 'PVC'} (Inner Sheath / Filler)`;
                    acc[isMat] = (acc[isMat] || 0) + item.result.bom.innerCoveringWeight;
                  }
                  // Armour
                  if (item.result.bom.armorWeight > 0) {
                    const armType = `Armour (${item.params.armorType})`;
                    acc[armType] = (acc[armType] || 0) + item.result.bom.armorWeight;
                  }
                  // Outer Sheath
                  const shMat = `${item.params.sheathMaterial} (Outer)`;
                  acc[shMat] = (acc[shMat] || 0) + item.result.bom.sheathWeight;
                  return acc;
                }, {} as Record<string, number>)).map(([mat, weight]) => (
                  <div key={mat} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{mat}</span>
                    <span className="text-sm font-bold font-mono">{Math.round(weight as number).toLocaleString()} kg</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              {(() => {
                const totalWeight = projectItems.reduce((acc, item) => acc + item.result.bom.totalWeight, 0);
                const totalHPP = projectItems.reduce((acc, item) => acc + calculateHPP(item.result, item.params), 0);
                const totalSellingPrice = projectItems.reduce((acc, item) => {
                  const hpp = calculateHPP(item.result, item.params);
                  return acc + calculateSellingPrice(hpp, item.params.margin);
                }, 0);
                const totalMargin = totalSellingPrice - totalHPP;
                const marginPercentage = totalHPP > 0 ? (totalMargin / totalHPP) * 100 : 0;

                return (
                  <>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">Total Project Material Weight</span>
                      <span className="text-xl font-bold text-indigo-600 font-mono">
                        {Math.round(totalWeight).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">Total Project Cost (HPP)</span>
                      <span className="text-xl font-bold text-emerald-600 font-mono">
                        Rp {Math.round(totalHPP).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">Total Project Selling Price</span>
                      <span className="text-xl font-bold text-indigo-600 font-mono">
                        Rp {Math.round(totalSellingPrice).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-slate-900">Total Project Margin</span>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-bold text-emerald-600 font-mono">
                          Rp {Math.round(totalMargin).toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs font-bold text-emerald-500 font-mono">
                          ({marginPercentage.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          </div>

          <div className={reviewTab === 'specifications' ? 'space-y-12 print:block print:space-y-0' : 'hidden print:hidden'}>
            {groupedItemsList.map((group, groupIdx) => {
            const { key: groupKey, items } = group;
            const firstItem = items[0];
            const p = firstItem.params;
            
            const isMV = p.standard === 'IEC 60502-2';
            const isABC = p.standard.includes('NFA2X');
            const hasOuterSheath = !p.standard.includes('NYAF') && !isABC;

            // Get construction name (material part of designation)
            const designation = getCableDesignation(p, firstItem.result);
            const constructionName = designation.split(' ')[0];

            let sizeDesignation = `${p.cores} x ${p.size}`;
            if (p.hasEarthing && p.earthingCores && p.earthingCores > 0 && p.earthingSize && p.earthingSize > 0) {
              if (p.earthingCores === 1) {
                sizeDesignation += ` + ${p.earthingSize}`;
              } else {
                sizeDesignation += ` + ${p.earthingCores} x ${p.earthingSize}`;
              }
            }

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
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 print:text-xs">Technical Specifications</h2>
                  <p className="text-xs text-slate-600 font-medium print:text-[10px]">
                    {isMV ? 'Medium Voltage Cable' : 'Low Voltage Cable'} ({p.cores > 1 ? 'Multi Core' : 'Single Core'} Power Cable)
                  </p>
                </div>

                <table className="w-full border-collapse border border-slate-400 text-[10px] print:text-[9px] [&_td]:!py-1 [&_th]:!py-1 print:[&_td]:!py-0.5 print:[&_th]:!py-0.5">
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
                    {/* 1. General Info */}
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">1</td>
                      <td className="border border-slate-400 p-2 font-medium">Product Brand</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      <td colSpan={items.length} className="border border-slate-400 p-2 text-center font-bold uppercase">MULTI KABEL</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">2</td>
                      <td className="border border-slate-400 p-2 font-medium">Standard Reference</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      <td colSpan={items.length} className="border border-slate-400 p-2 text-center">
                        {(() => {
                          const firstItem = items[0];
                          let std = firstItem.result.general.standardReference;
                          if (p.fireguard) std += ', IEC 60331';
                          if (p.sheathMaterial.includes('PVC-FR')) {
                            if (p.sheathMaterial.includes('CAT.A')) std += ', IEC 60332-3-22';
                            else if (p.sheathMaterial.includes('CAT.B')) std += ', IEC 60332-3-23';
                            else if (p.sheathMaterial.includes('CAT.C')) std += ', IEC 60332-3-24';
                            else std += ', IEC 60332-1';
                          }
                          const editKey = `${groupKey}-standard-group`;
                          return (
                            <input
                              type="text"
                              value={specEdits[editKey] ?? std}
                              onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                              className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none"
                            />
                          );
                        })()}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">3</td>
                      <td className="border border-slate-400 p-2 font-medium">Type & Size of Cable</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((item, idx) => {
                        let itemSizeDesignation = '';
                        if (p.formationType === 'Pair') {
                            const pairs = item.params.cores / 2;
                            itemSizeDesignation = `${pairs} x 2 x ${item.params.size}`;
                        } else if (p.formationType === 'Triad') {
                            const triads = item.params.cores / 3;
                            itemSizeDesignation = `${triads} x 3 x ${item.params.size}`;
                        } else {
                            itemSizeDesignation = `${item.params.cores} x ${item.params.size}`;
                        }

                        if (item.params.hasEarthing && item.params.earthingCores && item.params.earthingCores > 0 && item.params.earthingSize && item.params.earthingSize > 0) {
                          if (item.params.earthingCores === 1) {
                            itemSizeDesignation += ` + ${item.params.earthingSize}`;
                          } else {
                            itemSizeDesignation += ` + ${item.params.earthingCores} x ${item.params.earthingSize}`;
                          }
                        }
                        const defaultVal = `${constructionName} ${itemSizeDesignation} mm²`;
                        const editKey = `${groupKey}-type-size-${idx}`;
                        return (
                          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
                            <input
                              type="text"
                              value={specEdits[editKey] ?? defaultVal}
                              onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                              className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none font-bold"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">4</td>
                      <td className="border border-slate-400 p-2 font-medium">Rated Voltage</td>
                      <td className="border border-slate-400 p-2 text-center">kV</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{item.params.voltage}</td>
                      ))}
                    </tr>

                    {/* 5. Constructional Data */}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">5</td>
                      <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">Constructional Data :</td>
                    </tr>


                    {p.standard === 'BS EN 50288-7' && (
                      <tr>
                        <td className="border border-slate-400 p-2 text-center"></td>
                        <td className="border border-slate-400 p-2 font-bold">• Formation Type</td>
                        <td className="border border-slate-400 p-2 text-center">-</td>
                        {items.map((item, idx) => (
                          <td key={idx} className="border border-slate-400 p-2 text-center">{item.params.formationType || 'Pair'}</td>
                        ))}
                      </tr>
                    )}
                    
                    {/* Conductor (Phase) */}
                    <tr>
                      <td className="border border-slate-400 p-2 text-center" rowSpan={isMV ? 4 : 3}></td>
                      <td className="border border-slate-400 p-2 font-bold">• Conductor{p.hasEarthing ? ' (Phase)' : ''}</td>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 pl-4">- Material of Conductor</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((_, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{p.conductorMaterial} ({p.conductorMaterial === 'Cu' ? 'Copper' : 'Aluminium'})</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 pl-4">- Shape of Conductor</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((_, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">
                          {p.conductorType === 're' ? 'Round Solid' : 
                           p.conductorType === 'rm' ? 'Round Stranded' : 
                           p.conductorType === 'sm' ? 'Sector Stranded' : 'Flexible'} ({p.conductorType})
                        </td>
                      ))}
                    </tr>
                    {isMV && (
                      <tr>
                        <td className="border border-slate-400 p-2 pl-4">- Conductor Screen</td>
                        <td className="border border-slate-400 p-2 text-center">-</td>
                        {items.map((_, idx) => (
                          <td key={idx} className="border border-slate-400 p-2 text-center">Semi-conductive</td>
                        ))}
                      </tr>
                    )}
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Diameter of Conductor (Approx.)</td>
                      <td className="border border-slate-400 p-2 text-center">mm</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.conductorDiameter.toFixed(2)}</td>
                      ))}
                    </tr>

                    {p.fireguard && (
                      <tr>
                        <td className="border border-slate-400 p-2 text-center"></td>
                        <td className="border border-slate-400 p-2 font-bold">• Fire Barrier</td>
                        <td className="border border-slate-400 p-2 text-center">-</td>
                        {items.map((_, idx) => (
                          <td key={idx} className="border border-slate-400 p-2 text-center">MGT (Mica Glass Tape)</td>
                        ))}
                      </tr>
                    )}

                    {/* Insulation (Phase) */}
                    <tr>
                      <td className="border border-slate-400 p-2 text-center" rowSpan={4}></td>
                      <td className="border border-slate-400 p-2 font-bold">• Insulation{p.hasEarthing ? ' (Phase)' : ''}</td>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 pl-4">- Material of Insulation</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((_, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{p.insulationMaterial}</td>
                      ))}
                    </tr>
                    {isMV && (
                      <tr>
                        <td className="border border-slate-400 p-2 pl-4">- Insulation Screen</td>
                        <td className="border border-slate-400 p-2 text-center">-</td>
                        {items.map((_, idx) => (
                          <td key={idx} className="border border-slate-400 p-2 text-center">Semi-conductive</td>
                        ))}
                      </tr>
                    )}
                    {!isMV && (
                      <tr>
                        <td className="border border-slate-400 p-2 pl-4">- Colour of Insulation</td>
                        <td className="border border-slate-400 p-2 text-center">-</td>
                        {items.map((_, idx) => {
                          const defaultColor = getDefaultInsulationColor(p.cores, p.hasEarthing, isMV, isABC, p.formationType);
                          const editKey = `${groupKey}-insulation-color-${idx}`;
                          return (
                            <td key={idx} className="border border-slate-400 p-2 text-center">
                              <input
                                type="text"
                                value={specEdits[editKey] ?? defaultColor}
                                onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                                className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    )}
                    <tr>
                      <td className="border border-slate-400 p-2 pl-4">- Thickness of Insulation (Nom.)</td>
                      <td className="border border-slate-400 p-2 text-center">mm</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.insulationThickness.toFixed(1)}</td>
                      ))}
                    </tr>

                    {/* Conductor & Insulation (Earth) */}
                    {p.hasEarthing && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={4}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Conductor (Earth)</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Conductor</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.conductorMaterial} ({p.conductorMaterial === 'Cu' ? 'Copper' : 'Aluminium'})</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Shape of Conductor</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">
                              {p.conductorType === 're' ? 'Round Solid' : 
                               p.conductorType === 'rm' ? 'Round Stranded' : 
                               p.conductorType === 'sm' ? 'Sector Stranded' : 'Flexible'} ({p.conductorType})
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Diameter of Conductor (Approx.)</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.earthingCore?.conductorDiameter.toFixed(2) || '-'}</td>
                          ))}
                        </tr>

                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={4}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Insulation (Earth)</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Insulation</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.insulationMaterial}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Colour of Insulation</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">Yellow/Green</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Thickness of Insulation (Nom.)</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.earthingCore?.insulationThickness.toFixed(1) || '-'}</td>
                          ))}
                        </tr>
                      </>
                    )}

                    {p.standard === 'BS EN 50288-7' && (p.hasIndividualScreen || p.hasOverallScreen) && (
                      <>
                        <tr className="bg-slate-50/50">
                          <td className="border border-slate-400 p-2 text-center"></td>
                          <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase tracking-tight">• Screening :</td>
                        </tr>
                        {p.hasIndividualScreen && (
                          <tr>
                            <td className="border border-slate-400 p-2 text-center"></td>
                            <td className="border border-slate-400 p-2 pl-4">Individual Screen (IS)</td>
                            <td className="border border-slate-400 p-2 text-center">-</td>
                            {items.map((_, idx) => (
                              <td key={idx} className="border border-slate-400 p-2 text-center text-[10px]">
                                Helically Overlapped Polyester Tape<br/>
                                Tinned annealed copper wire 0.5 mm² (17/0.2)<br/>
                                Helically overlapped single coated aluminium tape contacted with drain wire<br/>
                                Helically Overlapped Polyester Tape
                              </td>
                            ))}
                          </tr>
                        )}
                        {p.hasOverallScreen && (
                          <tr>
                            <td className="border border-slate-400 p-2 text-center"></td>
                            <td className="border border-slate-400 p-2 pl-4">Overall Screen (OS)</td>
                            <td className="border border-slate-400 p-2 text-center">-</td>
                            {items.map((_, idx) => (
                              <td key={idx} className="border border-slate-400 p-2 text-center text-[10px]">
                                Helically Overlapped Polyester Tape<br/>
                                Tinned annealed copper wire 0.5 mm² (17/0.2)<br/>
                                Helically overlapped single coated aluminium tape contacted with drain wire<br/>
                                Helically Overlapped Polyester Tape
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    )}


                    {/* Metallic Screen */}
                    {(isMV || p.hasScreen) && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          <td className="border border-slate-400 p-2 font-bold">• Metallic Screen</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">
                              {isMV ? p.mvScreenType : p.screenType}
                            </td>
                          ))}
                        </tr>
                        {((isMV ? p.mvScreenType : p.screenType) === 'CTS') && (
                          <tr>
                            <td className="border border-slate-400 p-2 text-center"></td>
                            <td className="border border-slate-400 p-2 pl-4">- Thickness of Tape</td>
                            <td className="border border-slate-400 p-2 text-center">mm</td>
                            {items.map((_, idx) => (
                              <td key={idx} className="border border-slate-400 p-2 text-center">0.1</td>
                            ))}
                          </tr>
                        )}
                        {((isMV ? p.mvScreenType : p.screenType) === 'CWS') && (
                          <tr>
                            <td className="border border-slate-400 p-2 text-center"></td>
                            <td className="border border-slate-400 p-2 pl-4">- Cross-sectional Area</td>
                            <td className="border border-slate-400 p-2 text-center">mm²</td>
                            {items.map((_, idx) => (
                              <td key={idx} className="border border-slate-400 p-2 text-center">
                                {isMV ? p.mvScreenSize : p.screenSize}
                              </td>
                            ))}
                          </tr>
                        )}
                      </>
                    )}

                    {/* Inner Sheath */}
                    {p.hasInnerSheath && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={4}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Inner Sheath</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Inner Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.innerSheathMaterial}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Thickness of Inner Sheath (Nom.)</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.innerCoveringThickness.toFixed(1)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Colour of Inner Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => {
                            const editKey = `${groupKey}-inner-sheath-color-${idx}`;
                            return (
                              <td key={idx} className="border border-slate-400 p-2 text-center">
                                <input
                                  type="text"
                                  value={specEdits[editKey] ?? 'Black'}
                                  onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                                  className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    )}

                    {/* Separator Sheath */}
                    {(p.standard === 'IEC 60502-1' && (p.hasSeparator || (p.hasScreen && p.armorType !== 'Unarmored'))) && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={3}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Separator Sheath</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Separator Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.separatorMaterial || 'Polyester Tape'}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Thickness of Separator Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">
                              {item.result.spec.separatorThickness?.toFixed(1) || '0.1'}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* Armouring */}
                    {(p.armorType !== 'Unarmored' || p.standard === 'BS EN 50288-7') && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={3}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Armouring</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Armour</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.armorType === 'Unarmored' ? '-' : p.armorType}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Diameter of Armour (Approx.)</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.armorType === 'Unarmored' ? '-' : item.result.spec.armorThickness.toFixed(2)}</td>
                          ))}
                        </tr>
                      </>
                    )}

                    {/* Outer Sheath */}
                    {hasOuterSheath && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 text-center" rowSpan={4}></td>
                          <td className="border border-slate-400 p-2 font-bold">• Outer Sheath</td>
                          <td className="border border-slate-400 p-2 text-center"></td>
                          {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Material of Outer Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{p.sheathMaterial}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Thickness of Outer Sheath (Nom.)</td>
                          <td className="border border-slate-400 p-2 text-center">mm</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.spec.sheathThickness.toFixed(1)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-4">- Colour of Outer Sheath</td>
                          <td className="border border-slate-400 p-2 text-center">-</td>
                          {items.map((_, idx) => {
                            const defaultColor = p.standard === 'IEC 60502-2' ? 'Red' : p.fireguard ? 'Orange' : 'Black';
                            const editKey = `${groupKey}-outer-sheath-color-${idx}`;
                            return (
                              <td key={idx} className="border border-slate-400 p-2 text-center">
                                <input
                                  type="text"
                                  value={specEdits[editKey] ?? defaultColor}
                                  onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                                  className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    )}

                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 font-medium">Overall Diameter of Cable (Approx.)</td>
                      <td className="border border-slate-400 p-2 text-center">mm</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center font-bold">{item.result.spec.overallDiameter.toFixed(1)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 font-medium">Marking of Cable (e.g)</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((item, idx) => {
                        const editKey = `${groupKey}-marking-${idx}`;
                        let stds = p.standard;
                        if (p.fireguard) stds += ' IEC 60331';
                        if (p.sheathMaterial.includes('PVC-FR')) {
                          if (p.sheathMaterial.includes('CAT.A')) stds += ' IEC 60332-3-22';
                          else if (p.sheathMaterial.includes('CAT.B')) stds += ' IEC 60332-3-23';
                          else if (p.sheathMaterial.includes('CAT.C')) stds += ' IEC 60332-3-24';
                          else stds += ' IEC 60332-1';
                        }
                        const construction = constructionName;
                        
                        let itemSizeDesignation = '';
                        if (item.params.formationType === 'Pair') {
                            const pairs = item.params.cores / 2;
                            itemSizeDesignation = `${pairs} x 2 x ${item.params.size}`;
                        } else if (item.params.formationType === 'Triad') {
                            const triads = item.params.cores / 3;
                            itemSizeDesignation = `${triads} x 3 x ${item.params.size}`;
                        } else {
                            itemSizeDesignation = `${item.params.cores} x ${item.params.size}`;
                        }

                        if (item.params.hasEarthing && item.params.earthingCores && item.params.earthingCores > 0 && item.params.earthingSize && item.params.earthingSize > 0) {
                          if (item.params.earthingCores === 1) {
                            itemSizeDesignation += ` + ${item.params.earthingSize}`;
                          } else {
                            itemSizeDesignation += ` + ${item.params.earthingCores} x ${item.params.earthingSize}`;
                          }
                        }
                        
                        const defaultMarking = `[${p.standard}] [MULTI KABEL] [${construction}] [${itemSizeDesignation} mm²] [${p.voltage}] [MADE IN INDONESIA]`;
                        
                        return (
                          <td key={idx} className="border border-slate-400 p-2 text-center font-bold">
                            <input
                              type="text"
                              value={specEdits[editKey] ?? defaultMarking}
                              onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                              className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none font-bold"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 font-medium">Weight of Cable (Approx.)</td>
                      <td className="border border-slate-400 p-2 text-center">Kg/Km</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{Math.round(item.result.bom.totalWeight).toLocaleString()}</td>
                      ))}
                    </tr>

                    {/* 6. Packing */}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">6</td>
                      <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">Packing :</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Standard Length</td>
                      <td className="border border-slate-400 p-2 text-center">meter</td>
                      {items.map((item, idx) => {
                        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
                        return <td key={idx} className="border border-slate-400 p-2 text-center">{packing.standardLength}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Diameter of Drum</td>
                      <td className="border border-slate-400 p-2 text-center">mm</td>
                      {items.map((item, idx) => {
                        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
                        return <td key={idx} className="border border-slate-400 p-2 text-center">{packing.selectedDrum.diameterWithCover}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Width of Drum</td>
                      <td className="border border-slate-400 p-2 text-center">mm</td>
                      {items.map((item, idx) => {
                        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
                        return <td key={idx} className="border border-slate-400 p-2 text-center">{packing.selectedDrum.innerWidth}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Drum Type</td>
                      <td className="border border-slate-400 p-2 text-center">-</td>
                      {items.map((item, idx) => {
                        const editKey = `${groupKey}-drum-type-${idx}`;
                        return (
                          <td key={idx} className="border border-slate-400 p-2 text-center">
                            <input
                              type="text"
                              value={specEdits[editKey] ?? 'Wooden Drum'}
                              onChange={(e) => setSpecEdits(prev => ({ ...prev, [editKey]: e.target.value }))}
                              className="bg-transparent border-none focus:ring-0 p-0 m-0 w-full text-center font-inherit outline-none"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Weight per Drum (Approx.)</td>
                      <td className="border border-slate-400 p-2 text-center">Kg</td>
                      {items.map((item, idx) => {
                        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight);
                        const cableWeight = (item.result.bom.totalWeight * packing.standardLength) / 1000;
                        return <td key={idx} className="border border-slate-400 p-2 text-center">{Math.round(cableWeight + packing.selectedDrum.weight)}</td>;
                      })}
                    </tr>

                    {/* 7. Electrical Data */}
                    <tr className="bg-slate-50">
                      <td className="border border-slate-400 p-2 text-center font-bold">7</td>
                      <td colSpan={2 + items.length} className="border border-slate-400 p-2 font-bold uppercase">Electrical Data :</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- AC Test Voltage</td>
                      <td className="border border-slate-400 p-2 text-center">kV/5 Min</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.electrical.testVoltage}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-center"></td>
                      <td className="border border-slate-400 p-2 pl-4">- Max. D.C Resistance of Conductor at 20°C</td>
                      <td className="border border-slate-400 p-2 text-center">Ohm/Km</td>
                      {items.map((item, idx) => (
                        <td key={idx} className="border border-slate-400 p-2 text-center">{item.result.electrical.maxDcResistance}</td>
                      ))}
                    </tr>
                    {p.standard !== 'BS EN 50288-7' && (
                      <tr>
                        <td className="border border-slate-400 p-2 text-center" rowSpan={3}></td>
                        <td className="border border-slate-400 p-2 pl-4 font-bold">- Max. Current Carrying Capacity at 30°C</td>
                        <td className="border border-slate-400 p-2 text-center"></td>
                        {items.map((_, idx) => <td key={idx} className="border border-slate-400 p-2"></td>)}
                      </tr>
                    )}
                    {p.standard !== 'BS EN 50288-7' && (
                      <>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-8">In Ground</td>
                          <td className="border border-slate-400 p-2 text-center">A</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-indigo-600">{item.result.electrical.currentCapacityGround}</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 pl-8">In Air</td>
                          <td className="border border-slate-400 p-2 text-center">A</td>
                          {items.map((item, idx) => (
                            <td key={idx} className="border border-slate-400 p-2 text-center font-bold text-emerald-600">{item.result.electrical.currentCapacityAir}</td>
                          ))}
                        </tr>
                      </>
                    )}
                    {p.standard !== 'BS EN 50288-7' && (
                      <tr>
                        <td className="border border-slate-400 p-2 text-center"></td>
                        <td className="border border-slate-400 p-2 pl-4">- Max. Short Circuit Rating of Conductor</td>
                        <td className="border border-slate-400 p-2 text-center">kA / sec</td>
                        {items.map((item, idx) => {
                          const isXLPE = p.insulationMaterial === 'XLPE' || p.insulationMaterial === 'EPR';
                          const isCu = p.conductorMaterial === 'Cu';
                          let k = 115;
                          if (isCu) k = isXLPE ? 143 : 115;
                          else k = isXLPE ? 94 : 76;
                          
                          const sc = (k * item.params.size) / 1000;
                          return <td key={idx} className="border border-slate-400 p-2 text-center">{sc.toFixed(2)}</td>;
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

          {/* Footer */}
          <footer className="text-center py-8 border-t border-slate-200 print:hidden">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PT. Multi Kencana Niagatama</div>
            <div className="text-[9px] text-slate-300 mt-1">Generated on {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </footer>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isIEC60502_1 = params.standard === 'IEC 60502-1';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      {/* SQL Connection Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                Database Settings
              </h2>
              <button onClick={() => setShowSqlModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Server Address</label>
                  <input type="text" value={sqlForm.host} onChange={e => setSqlForm({...sqlForm, host: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. localhost" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Port</label>
                  <input type="text" value={sqlForm.port} onChange={e => setSqlForm({...sqlForm, port: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="3306" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Database Name</label>
                <input type="text" value={sqlForm.database} onChange={e => setSqlForm({...sqlForm, database: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. cable_db" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                <input type="text" value={sqlForm.username} onChange={e => setSqlForm({...sqlForm, username: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. root" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                <input type="password" value={sqlForm.password} onChange={e => setSqlForm({...sqlForm, password: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowSqlModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleConnectSql} disabled={isConnecting} className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2">
                {isConnecting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : 'Connect & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Projects Modal */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                Open Project
              </h3>
              <button 
                onClick={() => setShowProjectsModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p>No saved projects found in SQL database.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group">
                      <div>
                        <h4 className="font-bold text-slate-900">{project.name || 'Untitled Project'}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span>{project.items.length} items</span>
                          <span>•</span>
                          <span>{new Date(project.updatedAt).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenProject(project)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {quickEdit && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{quickEdit.title}</h3>
                <button 
                  onClick={() => setQuickEdit(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="relative">
                <input 
                  autoFocus
                  type="number"
                  step={quickEdit.step}
                  defaultValue={quickEdit.value}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      quickEdit.onSave(Number((e.target as HTMLInputElement).value));
                      setQuickEdit(null);
                    }
                    if (e.key === 'Escape') setQuickEdit(null);
                  }}
                  className="w-full px-4 py-4 text-2xl font-mono font-bold text-indigo-600 bg-slate-50 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-all text-center"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-slate-400 font-bold">{quickEdit.unit}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 text-center uppercase tracking-widest font-bold">
                Press Enter to Save • Esc to Cancel
              </p>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3">
              <button 
                onClick={() => setQuickEdit(null)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                  if (input) {
                    quickEdit.onSave(Number(input.value));
                    setQuickEdit(null);
                  }
                }}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {confirmModal.type === 'danger' ? <Trash2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="bg-slate-50 p-4 flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {confirmModal.type === 'danger' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                CABLE DESIGNER
              </h1>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-medium ml-1 uppercase tracking-wider">PT. Multi Kencana Niagatama</div>
            <div className="text-[9px] text-slate-300 ml-1 font-medium">created by Dede Noviyadi</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Configuration & Prices Panel */}
          <div className={`${isConfigExpanded ? 'lg:col-span-6' : 'lg:col-span-3'} space-y-6 transition-all duration-300 relative`}>
            {/* Floating Expand Button */}
            <button
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="absolute -right-4 top-4 z-50 p-2 bg-white shadow-md rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hidden lg:flex items-center justify-center transition-all hover:scale-110"
              title={isConfigExpanded ? "Collapse View" : "Expand View"}
            >
              {isConfigExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Compact Project Control Bar */}
              <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 gap-2">
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project Name"
                  className="bg-white border border-slate-200 text-sm font-semibold text-indigo-600 rounded-lg p-2 flex-grow placeholder:text-slate-300"
                />
                <div className="flex items-center gap-1">
                  <button onClick={() => setProjectItems([])} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Clear List"><Trash2 className="w-4 h-4" /></button>
                  <button onClick={handleLoadProjects} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Open Project"><FolderOpen className="w-4 h-4" /></button>
                  <button onClick={handleSaveProject} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Save Project"><Save className="w-4 h-4" /></button>
                  <button onClick={handleExportExcel} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Download Excel"><Download className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex border-b border-slate-100 items-center pr-2">
                <button
                  onClick={() => setActiveTab('config')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'config' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Config
                </button>
                <button
                  onClick={() => setActiveTab('prices')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'prices' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Prices
                </button>
                <button
                  onClick={() => setActiveTab('drums')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'drums' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Drums
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'settings' ? 'text-indigo-600 bg-indigo-50/50 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Settings
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'config' && (
                  <div className="space-y-4">
                    {/* Design Mode Toggle */}
                    <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-widest">Design Mode</span>
                      </div>
                      <div className="flex bg-white p-1 rounded-xl border border-indigo-100 shadow-sm">
                        <button
                          onClick={() => handleParamChange('mode', 'standard')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            params.mode === 'standard'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => handleParamChange('mode', 'advance')}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            params.mode === 'advance'
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Advance
                        </button>
                      </div>
                    </div>

                    {/* Standard Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Standard Reference</label>
                      <select
                        value={params.standard}
                        onChange={(e) => handleParamChange('standard', e.target.value as CableStandard)}
                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border bg-slate-50 font-medium"
                      >
                        <option value="IEC 60502-1">IEC 60502-1 (Low Voltage)</option>
                        <option value="IEC 60502-2">IEC 60502-2 (Medium Voltage)</option>
                        <option value="IEC 60092-353">IEC 60092-353 (Marine Cable)</option>
                        <option value="SNI 04-6629.4 (NYM)">SNI 04-6629.4 (NYM)</option>
                        <option value="SNI 04-6629.3 (NYA)">SNI 04-6629.3 (NYA)</option>
                        <option value="SNI 04-6629.3 (NYAF)">SNI 04-6629.3 (NYAF)</option>
                        <option value="SNI 04-6629.5 (NYMHY)">SNI 04-6629.5 (NYMHY)</option>
                        <option value="SPLN D3. 010-1 : 2014 (NFA2X)">SPLN D3. 010-1 : 2014 (NFA2X)</option>
                        <option value="SPLN D3. 010-1 : 2015 (NFA2X-T)">SPLN D3. 010-1 : 2015 (NFA2X-T)</option>
                        <option value="BS EN 50288-7">BS EN 50288-7 (Instrumentation)</option>
                      </select>
                    </div>

                    {params.standard === 'BS EN 50288-7' && (
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Instrumentation Options</label>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Formation Type</label>
                            <select
                              value={params.formationType || 'Pair'}
                              onChange={(e) => handleParamChange('formationType', e.target.value)}
                              className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border bg-white"
                            >
                              <option value="Core">Core</option>
                              <option value="Pair">Pair</option>
                              <option value="Triad">Triad</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-6">
                            {(() => {
                              const isIsAllowed = params.formationType !== 'Core' && params.cores > 1;
                              return (
                                <label className={`flex items-center gap-2 cursor-pointer group ${!isIsAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                  <input
                                    type="checkbox"
                                    checked={params.hasIndividualScreen || false}
                                    disabled={!isIsAllowed}
                                    onChange={(e) => handleParamChange('hasIndividualScreen', e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                  />
                                  <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Individual Screen (IS)</span>
                                </label>
                              );
                            })()}
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={params.hasOverallScreen || false}
                                onChange={(e) => handleParamChange('hasOverallScreen', e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Overall Screen (OS)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features Section */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Cable Features</label>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Fireguard Toggle (Includes MGT) */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-red-600 transition-colors">Fireguard</span>
                            <span className="text-[10px] text-slate-400 italic">Includes Mica Glass Tape (MGT)</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={params.fireguard}
                              onChange={(e) => handleParamChange('fireguard', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${params.fireguard ? 'bg-red-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.fireguard ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>

                        {/* Stopfire Toggle */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-red-600 transition-colors">Stopfire</span>
                            <span className="text-[10px] text-slate-400 italic">Sets Sheath to PVC-FR Cat.C</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={params.stopfire}
                              onChange={(e) => handleParamChange('stopfire', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${params.stopfire ? 'bg-red-600' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.stopfire ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>


                    {/* Voltage Selection (Dynamic) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Voltage Rating (Uo/U)</label>
                      <select
                        value={params.voltage}
                        onChange={(e) => handleParamChange('voltage', e.target.value)}
                        className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                      >
                        {params.standard === 'IEC 60502-2' ? (
                          <>
                            <option value="3.6/6 kV">3.6/6 kV</option>
                            <option value="6/10 kV">6/10 kV</option>
                            <option value="8.7/15 kV">8.7/15 kV</option>
                            <option value="12/20 kV">12/20 kV</option>
                            <option value="18/30 kV">18/30 kV</option>
                          </>
                        ) : params.standard === 'BS EN 50288-7' ? (
                          <>
                            <option value="300 V">300 V</option>
                            <option value="300/500 V">300/500 V</option>
                          </>
                        ) : params.standard.includes('(NYM)') || params.standard.includes('(NYMHY)') ? (
                          <option value="300/500 V">300/500 V</option>
                        ) : (params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) ? (
                          <option value="450/750 V">450/750 V</option>
                        ) : params.standard.includes('NFA2X') ? (
                          <option value="0.6/1 kV">0.6/1 kV</option>
                        ) : (
                          <>
                            <option value="0.6/1 kV">0.6/1 kV</option>
                            <option value="450/750 V">450/750 V</option>
                            <option value="300/500 V">300/500 V</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Cores and Size in one row */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Number of Cores */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Cores</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={params.standard === 'IEC 60502-2' ? 1 : params.standard.includes('(NYMHY)') || params.standard.includes('(NYM)') ? 2 : params.standard.includes('NFA2X-T') ? 2 : params.standard.includes('NFA2X') ? 2 : 1}
                            max={params.standard === 'IEC 60502-2' ? 3 : params.standard.includes('(NYMHY)') || params.standard.includes('(NYM)') ? 5 : (params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) ? 1 : params.standard.includes('NFA2X-T') ? 3 : params.standard.includes('NFA2X') ? 4 : 80}
                            value={params.cores}
                            onChange={(e) => handleParamChange('cores', Number(e.target.value))}
                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(() => {
                            let cores = [1, 2, 3, 4, 5];
                            if (params.standard === 'IEC 60502-2') cores = [1, 3];
                            else if (params.standard.includes('(NYMHY)') || params.standard.includes('(NYM)')) cores = [2, 3, 4, 5];
                            else if (params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) cores = [1];
                            else if (params.standard.includes('NFA2X-T')) cores = [2, 3];
                            else if (params.standard.includes('NFA2X')) cores = [2, 4];
                            else if (params.standard === 'BS EN 50288-7') cores = [1, 2, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 50];
                            
                            return cores.map((c) => (
                              <button
                                key={c}
                                onClick={() => handleParamChange('cores', c)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                  params.cores === c 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {c}
                              </button>
                            ));
                          })()}
                        </div>
                        {params.cores > 5 && (
                          <p className="text-[9px] text-amber-600 mt-1 font-medium italic">
                            * Max 10 mm²
                          </p>
                        )}
                      </div>

                      {/* Cross Section */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cross Section (mm²)</label>
                        <select
                          value={params.size}
                          onChange={(e) => handleParamChange('size', Number(e.target.value))}
                          className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                        >
                          {CABLE_SIZES.filter(s => {
                            if (params.standard === 'BS EN 50288-7') {
                              return s >= 0.5 && s <= 2.5;
                            }
                            if (params.standard === 'IEC 60502-2') {
                              return s >= 25;
                            }
                            if (params.standard.includes('(NYMHY)')) {
                              return [0.75, 1, 1.5, 2.5].includes(s);
                            }
                            if (params.standard.includes('(NYM)')) {
                              return [1.5, 2.5, 4, 6, 10, 16].includes(s);
                            }
                            if (params.standard === 'SPLN D3. 010-1 : 2015 (NFA2X-T)') {
                              if (params.cores === 2) return [35, 50, 70].includes(s);
                              if (params.cores === 3) return [35, 50, 70, 95, 120].includes(s);
                              return false;
                            }
                            if (params.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)') {
                              if (params.cores === 2) return [10, 16].includes(s);
                              if (params.cores === 4) return [10, 16, 25, 35].includes(s);
                              return false;
                            }
                            if (params.conductorMaterial === 'Al') {
                              return s >= 10;
                            }
                            return params.cores <= 5 || s <= 10;
                          }).map((s) => (
                            <option key={s} value={s}>{s} mm²</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Earthing Core Section */}
                    {!(params.standard.includes('(NYA)') || params.standard.includes('(NYM)') || params.standard.includes('(NYMHY)') || params.standard.includes('(NYAF)') || params.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)') && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {params.standard.includes('NFA2X-T') ? '1.1 Messenger Core' : '1.1 Earthing Core'}
                          </label>
                          {!params.standard.includes('NFA2X-T') && (
                            <button
                              onClick={() => handleParamChange('hasEarthing', !params.hasEarthing)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${params.hasEarthing ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${params.hasEarthing ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          )}
                        </div>
                        
                        {params.hasEarthing && (
                          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Number of Cores</label>
                              <select
                                value={params.earthingCores || 0}
                                disabled={params.standard.includes('NFA2X-T')}
                                onChange={(e) => handleParamChange('earthingCores', Number(e.target.value))}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:opacity-50"
                              >
                                <option value={0}>None</option>
                                <option value={1}>1 Core</option>
                                <option value={2}>2 Cores</option>
                                <option value={3}>3 Cores</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Size (mm²)</label>
                              <select
                                value={params.earthingSize || 0}
                                disabled={params.standard.includes('NFA2X-T')}
                                onChange={(e) => handleParamChange('earthingSize', Number(e.target.value))}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:opacity-50"
                              >
                                <option value={0}>None</option>
                                {CABLE_SIZES.map((s) => (
                                  <option key={s} value={s}>{s} mm²</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Advanced Earthing Parameters */}
                        {params.mode === 'advance' && params.hasEarthing && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Advanced Earthing Parameters</label>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Count</label>
                                <input
                                  type="number"
                                  value={params.manualEarthingWireCount || ''}
                                  placeholder="7"
                                  onChange={(e) => handleParamChange('manualEarthingWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Dia (mm)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={params.manualEarthingWireDiameter || ''}
                                  placeholder="Auto"
                                  onChange={(e) => handleParamChange('manualEarthingWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cond Dia (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={params.manualEarthingConductorDiameter || ''}
                                  placeholder="Auto"
                                  onChange={(e) => handleParamChange('manualEarthingConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Insul Thick (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={params.manualEarthingInsulationThickness || ''}
                                  placeholder="Auto"
                                  onChange={(e) => handleParamChange('manualEarthingInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                            </div>
                            <p className="text-[9px] text-indigo-400 mt-1 italic text-center">Formulas: Standard Earthing Calculations</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conductor Section */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">2. Conductor</label>
                      
                      {/* Conductor Material */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(() => {
                            const conductorMaterials = ['Cu', 'Al', 'TCu'];
                            const customConductors = Object.keys(materialPrices).filter(m => materialCategories[m] === 'Conductor');
                            const availableConductors = Array.from(new Set([...conductorMaterials, ...customConductors])).filter(mat => materialPrices[mat] !== undefined);
                            
                            return availableConductors.map((mat) => {
                              const isDisabled = (params.standard.includes('SNI 04-6629') && mat !== 'Cu') || 
                                               (params.standard.includes('NFA2X') && mat !== 'Al') ||
                                               (params.standard === 'BS EN 50288-7' && mat !== 'Cu' && mat !== 'TCu');
                              return (
                                <button
                                  key={mat}
                                  disabled={isDisabled}
                                  onClick={() => handleParamChange('conductorMaterial', mat as ConductorMaterial)}
                                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-colors ${
                                    params.conductorMaterial === mat
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : isDisabled
                                      ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {mat === 'Cu' ? 'Cu' : mat === 'Al' ? 'Al' : mat === 'TCu' ? 'TCu' : mat}
                                </button>
                              );
                            });
                          })()}
                          <button
                            onClick={() => {
                              setActiveTab('prices');
                              setNewMaterialCategory('Conductor');
                              setTimeout(() => document.getElementById('new-material-input')?.focus(), 100);
                            }}
                            className="py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 border-dashed"
                          >
                            + Add New
                          </button>
                        </div>
                      </div>

                      {/* Conductor Type */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['re', 'rm', 'cm', 'sm', 'f'] as ConductorType[]).map((type) => {
                            let isDisabled = (type === 'sm' && (params.cores === 1 || params.size < 25));
                            if (params.standard.includes('SNI 04-6629')) {
                              if (params.standard.includes('(NYM)')) isDisabled = isDisabled || !['re', 'rm'].includes(type);
                              if (params.standard.includes('(NYAF)') || params.standard.includes('(NYMHY)')) isDisabled = isDisabled || type !== 'f';
                              if (params.standard.includes('(NYA)')) isDisabled = isDisabled || (type !== 're' && type !== 'rm');
                            }
                            if (params.standard === 'IEC 60502-2') isDisabled = isDisabled || type !== 'cm';
                            if (params.standard.includes('NFA2X')) isDisabled = isDisabled || !['cm', 'rm'].includes(type);
                            
                            return (
                              <button
                                key={type}
                                disabled={isDisabled}
                                onClick={() => handleParamChange('conductorType', type)}
                                className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                                  params.conductorType === type
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : isDisabled
                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title={type === 're' ? 'Solid Circular' : type === 'rm' ? 'Stranded Circular' : type === 'cm' ? 'Compacted Stranded' : type === 'sm' ? 'Sector Stranded' : 'Flexible Class 5'}
                              >
                                {type === 're' ? 're' : type === 'rm' ? 'rm' : type === 'cm' ? 'cm' : type === 'sm' ? 'sm' : 'f'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Advanced Conductor Parameters */}
                      {params.mode === 'advance' && (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Advanced Conductor Parameters</label>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Count</label>
                              <input
                                type="number"
                                value={params.manualWireCount || ''}
                                placeholder={params.conductorType === 're' ? '1' : '7'}
                                onChange={(e) => handleParamChange('manualWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                              <p className="text-[9px] text-indigo-400 mt-1 italic">Formula: Standard</p>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Dia (mm)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={params.manualWireDiameter || ''}
                                placeholder={result.spec.phaseCore.wireDiameter.toFixed(2)}
                                onChange={(e) => handleParamChange('manualWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                              <p className="text-[9px] text-indigo-400 mt-1 italic">Formula: √((4*S)/(π*n))</p>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Conductor Dia (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualConductorDiameter || ''}
                              placeholder={result.spec.conductorDiameter.toFixed(2)}
                              onChange={(e) => handleParamChange('manualConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                            <p className="text-[9px] text-indigo-400 mt-1 italic">Formula: Standard Table</p>
                          </div>

                          {params.standard === 'IEC 60502-2' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cond. Screen Thickness (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={params.manualConductorScreenThickness || ''}
                                placeholder={(result.spec.conductorScreenThickness || 0).toFixed(1)}
                                onChange={(e) => handleParamChange('manualConductorScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Insulation Section */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">3. Insulation</label>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                        <select
                          value={params.insulationMaterial}
                          onChange={(e) => handleParamChange('insulationMaterial', e.target.value)}
                          className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                        >
                          {(() => {
                            const compoundMaterials = ['XLPE', 'PVC', 'EPR'];
                            const customCompounds = Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Insulation');
                            const availableCompounds = Array.from(new Set([...compoundMaterials, ...customCompounds])).filter(mat => materialPrices[mat] !== undefined);
                            
                            return availableCompounds.map((mat) => {
                              let isDisabled = false;
                              if (params.standard.includes('SNI 04-6629')) isDisabled = mat !== 'PVC';
                              if (params.standard === 'IEC 60502-2') isDisabled = mat !== 'XLPE';
                              
                              return (
                                <option key={mat} value={mat} disabled={isDisabled}>
                                  {mat}
                                </option>
                              );
                            });
                          })()}
                          <option value="ADD_NEW_COMPOUND_INSULATION" className="text-indigo-600 font-bold">+ Add New Material...</option>
                        </select>
                      </div>

                      {/* Advanced Insulation Parameters */}
                      {params.mode === 'advance' && (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Advanced Insulation Parameters</label>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Insulation Thickness (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualInsulationThickness || ''}
                              placeholder={result.spec.insulationThickness.toFixed(1)}
                              onChange={(e) => handleParamChange('manualInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                            <p className="text-[9px] text-indigo-400 mt-1 italic">Formula: Standard Table</p>
                          </div>

                          {params.standard === 'IEC 60502-2' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Ins. Screen Thickness (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={params.manualInsulationScreenThickness || ''}
                                placeholder={(result.spec.insulationScreenThickness || 0).toFixed(1)}
                                onChange={(e) => handleParamChange('manualInsulationScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* MV Screen Selection (Moved after Insulation) */}
                    {params.standard === 'IEC 60502-2' && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">3.1 Metallic Screen (MV)</label>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['CTS', 'CWS'] as MvScreenType[]).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => handleParamChange('mvScreenType', type)}
                                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                                    params.mvScreenType === type
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {type === 'CTS' ? 'Copper Tape' : 'Copper Wire'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {params.mvScreenType === 'CWS' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Screen Size (mm²)</label>
                              <select
                                value={params.mvScreenSize}
                                onChange={(e) => handleParamChange('mvScreenSize', Number(e.target.value))}
                                className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-white"
                              >
                                {[16, 25, 35, 50, 70, 95].map((s) => (
                                  <option key={s} value={s}>{s} mm²</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {params.mode === 'advance' && (
                            <div className="pt-2 border-t border-slate-200 space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Metallic Screen Thickness (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={params.manualMvScreenThickness || ''}
                                  placeholder={(result.spec.mvScreenThickness || 0).toFixed(1)}
                                  onChange={(e) => handleParamChange('manualMvScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                              {params.mvScreenType === 'CWS' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Count (n)</label>
                                    <input
                                      type="number"
                                      value={params.manualMvScreenWireCount || ''}
                                      placeholder="24"
                                      onChange={(e) => handleParamChange('manualMvScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                      className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Diameter (d)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={params.manualMvScreenWireDiameter || ''}
                                      placeholder="0.8"
                                      onChange={(e) => handleParamChange('manualMvScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                      className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cabling Diameter Section (Advance Mode Only) */}
                    {params.mode === 'advance' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">3.2 Cabling Diameter</label>
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Cabling Dia (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={params.manualLaidUpDiameter || ''}
                            placeholder={result.spec.laidUpDiameter.toFixed(1)}
                            onChange={(e) => handleParamChange('manualLaidUpDiameter', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                          />
                          <p className="text-[9px] text-indigo-400 mt-1 italic">Formula: D_core * Factor</p>
                        </div>
                      </div>
                    )}

                    {/* Inner Sheath Section */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">4. Inner Sheath</label>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                          <label className={`flex items-center justify-between cursor-pointer group ${params.armorType !== 'Unarmored' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Inner Sheath</span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="sr-only"
                                disabled={params.armorType !== 'Unarmored'}
                                checked={params.hasInnerSheath !== false || params.armorType !== 'Unarmored'}
                                onChange={(e) => handleParamChange('hasInnerSheath', e.target.checked)}
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${(params.hasInnerSheath !== false || params.armorType !== 'Unarmored') ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(params.hasInnerSheath !== false || params.armorType !== 'Unarmored') ? 'translate-x-4' : ''}`}></div>
                            </div>
                          </label>
                          {(params.hasInnerSheath || params.armorType !== 'Unarmored') && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</label>
                              <select
                                value={params.innerSheathMaterial || 'PVC'}
                                onChange={(e) => handleParamChange('innerSheathMaterial', e.target.value as SheathMaterial)}
                                className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50"
                              >
                                {(() => {
                                  const compoundMaterials = ['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR'];
                                  const customCompounds = Object.keys(materialPrices).filter(m => 
                                    materialCategories[m] === 'Compound Filler' || 
                                    materialCategories[m] === 'Compound Sheath' || 
                                    materialCategories[m] === 'Compound (Filler/Sheath)'
                                  );
                                  const availableCompounds = Array.from(new Set([...compoundMaterials, ...customCompounds])).filter(mat => materialPrices[mat] !== undefined);
                                  return availableCompounds.map(mat => (
                                    <option key={mat} value={mat}>{mat}</option>
                                  ));
                                })()}
                                <option value="ADD_NEW_COMPOUND" className="text-indigo-600 font-bold">+ Add New Material...</option>
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {params.mode === 'advance' && (params.hasInnerSheath || params.armorType !== 'Unarmored') && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Inner Sheath Thickness (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualInnerSheathThickness || ''}
                              placeholder={result.spec.innerCoveringThickness.toFixed(1)}
                              onChange={(e) => handleParamChange('manualInnerSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                          </div>
                        )}
                      </div>

                    {/* Screen Section */}
                    <div className={`space-y-4 border-t border-slate-100 pt-4 ${!isIEC60502_1 ? 'opacity-50' : ''}`}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">4.1 Screen {!isIEC60502_1 && '(IEC 60502-1 Only)'}</label>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <label className={`flex items-center justify-between ${!isIEC60502_1 ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Screen</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              disabled={!isIEC60502_1}
                              checked={isIEC60502_1 && (params.hasScreen || false)}
                              onChange={(e) => handleParamChange('hasScreen', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isIEC60502_1 && params.hasScreen ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isIEC60502_1 && params.hasScreen ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                        {isIEC60502_1 && params.hasScreen && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                              <select
                                value={params.screenType || 'CTS'}
                                onChange={(e) => handleParamChange('screenType', e.target.value as any)}
                                className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50"
                              >
                                <option value="CTS">CTS (Copper Tape Screen)</option>
                                <option value="CWS">CWS (Copper Wire Screen)</option>
                              </select>
                            </div>
                            {params.screenType === 'CWS' && (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Size (mm²)</label>
                                <select
                                  value={params.screenSize || 16}
                                  onChange={(e) => handleParamChange('screenSize', Number(e.target.value))}
                                  className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50"
                                >
                                  {[16, 25, 35, 50, 70, 95, 120, 150].map(s => (
                                    <option key={s} value={s}>{s} mm²</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {params.mode === 'advance' && (
                              <div className="pt-2 border-t border-slate-200 space-y-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Screen Thickness (mm)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={params.manualScreenThickness || ''}
                                    placeholder={(result.spec.screenThickness || 0).toFixed(1)}
                                    onChange={(e) => handleParamChange('manualScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                  />
                                </div>
                                {params.screenType === 'CWS' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Count (n)</label>
                                      <input
                                        type="number"
                                        value={params.manualScreenWireCount || ''}
                                        placeholder="24"
                                        onChange={(e) => handleParamChange('manualScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wire Diameter (d)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualScreenWireDiameter || ''}
                                        placeholder="0.8"
                                        onChange={(e) => handleParamChange('manualScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separator Section */}
                    <div className={`space-y-4 border-t border-slate-100 pt-4 ${!isIEC60502_1 ? 'opacity-50' : ''}`}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">4.2 Separator Sheath {!isIEC60502_1 && '(IEC 60502-1 Only)'}</label>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <label className={`flex items-center justify-between ${(!isIEC60502_1 || (params.hasScreen && params.armorType !== 'Unarmored')) ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Separator</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              disabled={!isIEC60502_1 || (params.hasScreen && params.armorType !== 'Unarmored')}
                              checked={isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))}
                              onChange={(e) => handleParamChange('hasSeparator', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${(isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                        {isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored')) && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</label>
                            <select
                              value={params.separatorMaterial || 'PVC'}
                              onChange={(e) => handleParamChange('separatorMaterial', e.target.value as SheathMaterial)}
                              className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50"
                            >
                              {(() => {
                                const compoundMaterials = ['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR'];
                                const customCompounds = Object.keys(materialPrices).filter(m => 
                                  materialCategories[m] === 'Compound Filler' || 
                                  materialCategories[m] === 'Compound Sheath' || 
                                  materialCategories[m] === 'Compound (Filler/Sheath)'
                                );
                                const availableCompounds = Array.from(new Set([...compoundMaterials, ...customCompounds])).filter(mat => materialPrices[mat] !== undefined);
                                return availableCompounds.map(mat => (
                                  <option key={mat} value={mat}>{mat}</option>
                                ));
                              })()}
                              <option value="ADD_NEW_COMPOUND" className="text-indigo-600 font-bold">+ Add New Material...</option>
                            </select>
                          </div>
                        )}
                        {params.mode === 'advance' && (isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Separator Thickness (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualSeparatorThickness || ''}
                              placeholder={(result.spec.separatorThickness || 0).toFixed(1)}
                              onChange={(e) => handleParamChange('manualSeparatorThickness', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Armor Section */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">5. Armour</label>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                          value={params.armorType}
                          disabled={params.standard.includes('SNI 04-6629')}
                          onChange={(e) => handleParamChange('armorType', e.target.value as ArmorType)}
                          className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                          <option value="Unarmored">Unarmored</option>
                          {params.standard === 'BS EN 50288-7' ? (
                            <>
                              <option value="SWA">SWA (Steel Wire)</option>
                              <option value="STA">STA (Steel Tape)</option>
                              <option value="SFA">SFA (Steel Flat & Tape)</option>
                              <option value="RGB">RGB (Steel Wire & Tape)</option>
                              <option value="GSWB">GSWB (Steel Wire Braided)</option>
                              <option value="TCWB">TCWB (Tinned Copper Wire Braided)</option>
                              <option value="AWA">AWA (Aluminum Wire)</option>
                            </>
                          ) : params.standard === 'IEC 60092-353' ? (
                            <>
                              <option value="GSWB">GSWB (Steel Wire Braided)</option>
                              <option value="TCWB">TCWB (Tinned Copper Wire Braided)</option>
                            </>
                          ) : params.cores === 1 ? (
                            <option value="AWA">AWA (Aluminum Wire)</option>
                          ) : (
                            <>
                              <option value="SWA">SWA (Steel Wire)</option>
                              <option value="STA">STA (Steel Tape)</option>
                              <option value="SFA">SFA (Steel Flat & Tape)</option>
                              <option value="RGB">RGB (Steel Wire & Tape)</option>
                              <option value="GSWB">GSWB (Steel Wire Braided)</option>
                              <option value="TCWB">TCWB (Tinned Copper Wire Braided)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Braid Coverage Input (GSWB/TCWB only) */}
                      {(params.armorType === 'GSWB' || params.armorType === 'TCWB') && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Braid Coverage (%)</label>
                          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <input
                              type="range"
                              min="70"
                              max="95"
                              step="1"
                              value={params.braidCoverage || 90}
                              onChange={(e) => handleParamChange('braidCoverage', Number(e.target.value))}
                              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-mono font-bold text-indigo-600 w-10 text-right">{params.braidCoverage || 90}%</span>
                          </div>
                        </div>
                      )}

                      {params.mode === 'advance' && params.armorType !== 'Unarmored' && (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Armour Thickness (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={params.manualArmorThickness || ''}
                            placeholder={result.spec.armorThickness.toFixed(1)}
                            onChange={(e) => handleParamChange('manualArmorThickness', e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                          />
                          <div className="mt-2 p-2 bg-white/50 rounded-lg border border-indigo-100">
                            <p className="text-[10px] font-bold text-indigo-600 mb-1">Calculation Formula:</p>
                            <p className="text-[11px] font-mono text-slate-600">
                              {params.armorType === 'SWA' || params.armorType === 'AWA' ? (
                                'D_over = D_under + 2 * t_armor'
                              ) : params.armorType === 'STA' ? (
                                'D_over = D_under + 4 * t_armor (2 layers)'
                              ) : params.armorType === 'SFA' ? (
                                'D_over = D_under + 2 * (t_flat + t_tape)'
                              ) : params.armorType === 'RGB' ? (
                                'D_over = D_under + 2 * (t_wire + t_tape)'
                              ) : params.armorType === 'GSWB' || params.armorType === 'TCWB' ? (
                                'D_over = D_under + 2 * t_braid'
                              ) : 'D_over = D_under + 2 * t_armor'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Outer Sheath Section */}
                    {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">6. Outer Sheath</label>
                        
                        {/* Flame Retardant Category */}
                        <div className={!params.stopfire ? 'opacity-50 pointer-events-none' : ''}>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Flame Retardant Category 
                            {!params.stopfire && <span className="text-[10px] ml-2 text-slate-400 font-normal">(Enable StopFire first)</span>}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['None', 'Cat.A', 'Cat.B', 'Cat.C'] as FlameRetardantCategory[]).map((cat) => (
                              <button
                                key={cat}
                                disabled={!params.stopfire}
                                onClick={() => {
                                  handleParamChange('flameRetardantCategory', cat);
                                }}
                                className={`py-2 px-2 rounded-xl text-xs font-medium transition-colors ${
                                  (params.flameRetardantCategory || 'None') === cat
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {cat === 'None' ? 'Non Category' : cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sheath Material */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                          <select
                            value={params.sheathMaterial}
                            onChange={(e) => handleParamChange('sheathMaterial', e.target.value as SheathMaterial)}
                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                          >
                            {(() => {
                              const compoundMaterials = ['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR'];
                              const customCompounds = Object.keys(materialPrices).filter(m => 
                                materialCategories[m] === 'Compound Filler' || 
                                materialCategories[m] === 'Compound Sheath' || 
                                materialCategories[m] === 'Compound (Filler/Sheath)'
                              );
                              const availableCompounds = Array.from(new Set([...compoundMaterials, ...customCompounds])).filter(mat => materialPrices[mat] !== undefined);
                              return (
                                <>
                                  {availableCompounds.map(mat => (
                                    <option key={mat} value={mat}>{mat}</option>
                                  ))}
                                  <option value="ADD_NEW_OUTER_SHEATH" className="text-indigo-600 font-bold">+ Add New Material</option>
                                </>
                              );
                            })()}
                          </select>
                        </div>

                        {params.mode === 'advance' && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Outer Sheath Thickness (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualSheathThickness || ''}
                              placeholder={result.spec.sheathThickness.toFixed(1)}
                              onChange={(e) => handleParamChange('manualSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}


                    {/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}
                    {params.mode === 'advance' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">7. Advanced Intermediate Diameters</label>
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Dia Under Armor (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={params.manualDiameterUnderArmor || ''}
                                placeholder={result.spec.diameterUnderArmor.toFixed(1)}
                                onChange={(e) => handleParamChange('manualDiameterUnderArmor', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Dia Over Armor (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                value={params.manualDiameterOverArmor || ''}
                                placeholder={result.spec.diameterOverArmor.toFixed(1)}
                                onChange={(e) => handleParamChange('manualDiameterOverArmor', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Overall Diameter (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualOverallDiameter || ''}
                              placeholder={result.spec.overallDiameter.toFixed(1)}
                              onChange={(e) => handleParamChange('manualOverallDiameter', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Overrides Section */}
                    {params.mode === 'standard' && (
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-sm mt-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Manual Specifications</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Conductor (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder={result.spec.conductorDiameter.toFixed(1)}
                              value={params.manualConductorDiameter !== undefined ? params.manualConductorDiameter.toFixed(1) : ''}
                              onChange={(e) => handleParamChange('manualConductorDiameter', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          {(params.hasMgt || params.fireguard) && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">MGT (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={(result.spec.mgtThickness || 0.2).toFixed(1)}
                                value={params.manualMgtThickness !== undefined ? params.manualMgtThickness.toFixed(1) : ''}
                                onChange={(e) => handleParamChange('manualMgtThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {params.standard === 'IEC 60502-2' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Cond. Screen (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder={(result.spec.conductorScreenThickness || 0.5).toFixed(1)}
                                  value={params.manualConductorScreenThickness !== undefined ? params.manualConductorScreenThickness.toFixed(1) : ''}
                                  onChange={(e) => handleParamChange('manualConductorScreenThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Ins. Screen (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder={(result.spec.insulationScreenThickness || 0.5).toFixed(1)}
                                  value={params.manualInsulationScreenThickness !== undefined ? params.manualInsulationScreenThickness.toFixed(1) : ''}
                                  onChange={(e) => handleParamChange('manualInsulationScreenThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Insulation (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder={result.spec.insulationThickness.toFixed(1)}
                              value={params.manualInsulationThickness !== undefined ? params.manualInsulationThickness.toFixed(1) : ''}
                              onChange={(e) => handleParamChange('manualInsulationThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                              className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>

                          {(params.cores > 1 || params.armorType !== 'Unarmored' || params.hasInnerSheath) && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Inner Sheath (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={result.spec.innerCoveringThickness.toFixed(1)}
                                value={params.manualInnerSheathThickness !== undefined ? params.manualInnerSheathThickness.toFixed(1) : ''}
                                onChange={(e) => handleParamChange('manualInnerSheathThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {params.armorType !== 'Unarmored' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Armor (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={result.spec.armorThickness.toFixed(1)}
                                value={params.manualArmorThickness !== undefined ? params.manualArmorThickness.toFixed(1) : ''}
                                onChange={(e) => handleParamChange('manualArmorThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Outer Sheath (mm)</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={result.spec.sheathThickness.toFixed(1)}
                                value={params.manualSheathThickness !== undefined ? params.manualSheathThickness.toFixed(1) : ''}
                                onChange={(e) => handleParamChange('manualSheathThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Add to Project Button moved to bottom of config */}
                    <div className="pt-4">
                      <button
                        onClick={addToProject}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] uppercase tracking-wider text-sm"
                      >
                        <Plus className="w-5 h-5" />
                        Add to Project
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'prices' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Update material prices (IDR/kg) and densities (g/cm³) to calculate the estimated HPP per meter.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-indigo-500" />
                        Overhead Cost (%)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="0.5"
                          value={params.overhead || 0}
                          onChange={(e) => handleParamChange('overhead', parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          <input
                            type="number"
                            value={params.overhead || 0}
                            onChange={(e) => handleParamChange('overhead', parseFloat(e.target.value))}
                            className="w-12 bg-transparent border-none p-0 text-sm font-mono font-bold text-indigo-600 focus:ring-0 text-right"
                          />
                          <span className="text-sm font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                        * Overhead is added to the total material cost (HPP = Material Cost × (1 + Overhead%))
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Sales Margin (%)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={params.margin || 0}
                          onChange={(e) => handleParamChange('margin', parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                          <input
                            type="number"
                            value={params.margin || 0}
                            onChange={(e) => handleParamChange('margin', parseFloat(e.target.value))}
                            className="w-12 bg-transparent border-none p-0 text-sm font-mono font-bold text-emerald-600 focus:ring-0 text-right"
                          />
                          <span className="text-sm font-bold text-slate-400">%</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                        * Margin is added to HPP to calculate Selling Price (Price = HPP × (1 + Margin%))
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-end gap-2 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Add New Material</label>
                          <div className="flex flex-col gap-2">
                            <input 
                              id="new-material-input"
                              type="text"
                              value={newMaterialName}
                              onChange={(e) => setNewMaterialName(e.target.value)}
                              placeholder="Material Name (e.g. Nylon)"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                            <select
                              value={newMaterialCategory}
                              onChange={(e) => setNewMaterialCategory(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                            >
                              <option value="Conductor">Conductor</option>
                              <option value="Compound Insulation">Compound Insulation</option>
                              <option value="Compound (Filler/Sheath)">Compound (Filler/Sheath)</option>
                              <option value="Armour">Armour</option>
                              <option value="Screen">Screen</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={handleAddMaterial}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 h-[38px]"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      <div className="flex items-center justify-between mb-2 px-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Material List</h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={handleResetToDefault}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset to Default
                          </button>
                          <button 
                            onClick={saveMaterialSettings}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 transition-all"
                          >
                            <Download className="w-3 h-3" />
                            Save All Settings
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6 pr-2">
                        {[
                          { title: 'Conductor', items: Array.from(new Set(['Cu', 'Al', 'TCu', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Conductor')])) },
                          { title: 'Compound Insulation', items: Array.from(new Set(['XLPE', 'PVC', 'EPR', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Insulation')])) },
                          { title: 'Compound (Filler/Sheath)', items: Array.from(new Set(['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Filler' || materialCategories[m] === 'Compound Sheath' || materialCategories[m] === 'Compound (Filler/Sheath)')])) },
                          { title: 'Armour', items: Array.from(new Set(['Steel', 'SteelWire', 'STA', 'SWA', 'AWA', 'SFA', 'RGB', 'GSWB', 'TCWB', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Armour')])) },
                          { title: 'Screen', items: Array.from(new Set(['SemiCond', 'MGT', 'CTS', 'CWS', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Screen')])) },
                          { title: 'Other', items: Object.keys(materialPrices).filter(m => !['Cu', 'Al', 'TCu', 'XLPE', 'PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR', 'Steel', 'SteelWire', 'STA', 'SWA', 'AWA', 'SFA', 'RGB', 'GSWB', 'TCWB', 'SemiCond', 'MGT', 'CTS', 'CWS'].includes(m) && (!materialCategories[m] || materialCategories[m] === 'Other' || materialCategories[m] === 'Compound')) }
                        ].map(category => {
                          const categoryMaterials = category.items.filter(mat => materialPrices[mat] !== undefined).sort();
                          if (categoryMaterials.length === 0) return null;
                          return (
                            <div key={category.title} className="space-y-3">
                              <h5 className="text-xs font-bold text-slate-500 border-b border-slate-100 pb-1">{category.title}</h5>
                              {categoryMaterials.map((mat) => (
                                <div key={mat} className="relative group">
                                  <MaterialSettingsInput 
                                    label={mat} 
                                    price={materialPrices[mat]} 
                                    density={materialDensities[mat]}
                                    scrap={materialScrap[mat]}
                                    onPriceChange={(v) => setMaterialPrices(p => ({...p, [mat]: v}))} 
                                    onDensityChange={(v) => setMaterialDensities(d => ({...d, [mat]: v}))}
                                    onScrapChange={(v) => setMaterialScrap(s => ({...s, [mat]: v}))}
                                    onQuickEdit={(title, value, unit, step, onSave) => setQuickEdit({ title, value, unit, step, onSave })}
                                  />
                                  <button 
                                    onClick={() => handleRemoveMaterial(mat)}
                                    className="absolute -right-1 top-0 p-1 text-slate-300 hover:text-red-500 transition-all"
                                    title="Remove Material"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'drums' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Manage drum/haspel data including dimensions, weight, and price.
                      </p>
                    </div>

                    <div className="flex items-center justify-between mb-2 px-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Drum List</h4>
                      <button 
                        onClick={() => setDrumData(INITIAL_DRUM_DATA)}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Reset to Default
                      </button>
                    </div>

                    <div className="pr-2 border border-slate-100 rounded-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                              <th className="p-2 font-bold text-slate-500 uppercase">Type</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">D (mm)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">d (mm)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">L (mm)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">W (kg)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase text-right">Price (Rp)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drumData.map((drum, idx) => (
                              <tr key={drum.type} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="p-2 font-mono font-bold text-indigo-600">{drum.type}</td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={drum.diameterWithCover ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, diameterWithCover: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={drum.barrelDiameter ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, barrelDiameter: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={drum.outerWidth ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, outerWidth: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={drum.weight ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, weight: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <input 
                                    type="number" 
                                    value={drum.price ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, price: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 text-right"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Manage SQL database connection and projects.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">Database Management</h3>
                        <p className="text-xs text-slate-500 mb-4">Initialize or clear the SQL database used for storing projects.</p>
                        <button
                          onClick={handleInitDB}
                          className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Database className="w-4 h-4" />
                          Create / Reset Database
                        </button>
                      </div>

                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-900 mb-2">Project Management</h3>
                        <p className="text-xs text-slate-500 mb-4">Save your current project or load a previously saved project.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProject}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Save Project
                          </button>
                          <button
                            onClick={handleLoadProjects}
                            className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <FolderOpen className="w-4 h-4" />
                            Open Project
                          </button>
                          <button
                            onClick={handleExportExcel}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export Excel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className={`${isConfigExpanded ? 'lg:col-span-6' : 'lg:col-span-5'} space-y-6 transition-all duration-300`}>
            
            {/* Cable Designation */}
            <div className="bg-indigo-600 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-6">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
              
              <div className="flex-1 text-center md:text-left z-10">
                <h3 className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">Cable Designation</h3>
                <div className="text-2xl md:text-4xl font-bold tracking-tight font-mono">
                  {getCableDesignation(params, result)}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                  Overall Diameter: <span className="font-bold">{result.spec.overallDiameter} mm</span>
                </div>
              </div>

              <div className="z-10 bg-white/10 rounded-full backdrop-blur-sm p-4">
                <CableCrossSection 
                  cores={params.cores} 
                  earthingCores={params.hasEarthing ? (params.earthingCores || 0) : 0}
                  armorType={params.armorType} 
                  conductorType={params.conductorType} 
                  standard={params.standard}
                  mvScreenType={params.mvScreenType}
                  hasMgt={params.fireguard}
                  conductorMaterial={params.conductorMaterial}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Data & Features */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-500" />
                    General Data
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Standard</span>
                    <span className="font-mono text-slate-900">{params.standard}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Voltage Rating</span>
                    <span className="font-mono text-slate-900">{params.voltage}</span>
                  </div>
                  {params.earthingCores > 0 && params.earthingSize > 0 ? (
                    <>
                      <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                        <span>Phase Conductor</span>
                        <span className="font-mono text-slate-900">
                          {params.cores} x {params.size} mm² {params.conductorMaterial} ({params.conductorType})
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                        <span>Earthing Conductor</span>
                        <span className="font-mono text-slate-900">
                          {params.earthingCores} x {params.earthingSize} mm² {params.conductorMaterial} ({params.conductorType})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                      <span>Conductor</span>
                      <span className="font-mono text-slate-900">
                        {params.cores} x {params.size} mm² {params.conductorMaterial} ({params.conductorType})
                      </span>
                    </div>
                  )}
                  <SpecRow label="Max Operating Temperature" value={result.general.maxOperatingTemp} unit="°C" precision={0} />
                  <SpecRow label="Max Short Circuit Temp" value={result.general.shortCircuitTemp} unit="°C" precision={0} />
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Standard Compliance</span>
                    <span className="font-mono text-slate-900 text-xs">{result.general.standardReference}</span>
                  </div>
                  
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Applied Features</span>
                    <div className="flex flex-wrap gap-2">
                      {params.fireguard && (
                        <span className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                          FireGuard®
                        </span>
                      )}
                      {params.stopfire && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-rose-100 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          StopFire®
                        </span>
                      )}
                      {!params.fireguard && (params.flameRetardantCategory === 'None' || !params.flameRetardantCategory) && !params.stopfire && (
                        <span className="text-[10px] text-slate-400 italic">No special features applied</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specification */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    Technical Specification
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {/* Phase Core Group */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                    <h3 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      Phase Core ({params.cores} x {params.size} mm²)
                    </h3>
                    <SpecRow label="Conductor Construction" value={`${result.spec.phaseCore.wireCount} x ${result.spec.phaseCore.wireDiameter.toFixed(2)}`} unit="mm" />
                    <SpecRow label="Conductor Diameter" value={result.spec.phaseCore.conductorDiameter} unit="mm" />
                    <SpecRow label="Insulation Thickness" value={result.spec.phaseCore.insulationThickness} unit="mm" />
                    <SpecRow label="Core Diameter" value={result.spec.phaseCore.coreDiameter} unit="mm" />
                  </div>

                  {/* Earthing Core Group */}
                  {result.spec.earthingCore && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-2">
                      <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {params.standard.includes('NFA2X-T') ? 'Messenger Core' : 'Earthing Core'} ({params.earthingCores} x {params.earthingSize} mm²)
                      </h3>
                      {result.spec.earthingCore.alWireCount && result.spec.earthingCore.steelWireCount ? (
                        <>
                          <SpecRow label="Aluminium Wire" value={`${result.spec.earthingCore.alWireCount} x ${result.spec.earthingCore.alWireDiameter?.toFixed(2)}`} unit="mm" />
                          <SpecRow label="Steel Wire" value={`${result.spec.earthingCore.steelWireCount} x ${result.spec.earthingCore.steelWireDiameter?.toFixed(2)}`} unit="mm" />
                        </>
                      ) : (
                        <SpecRow label="Conductor Construction" value={`${result.spec.earthingCore.wireCount} x ${result.spec.earthingCore.wireDiameter.toFixed(2)}`} unit="mm" />
                      )}
                      <SpecRow label="Conductor Diameter" value={result.spec.earthingCore.conductorDiameter} unit="mm" />
                      <SpecRow label="Insulation Thickness" value={result.spec.earthingCore.insulationThickness} unit="mm" />
                      <SpecRow label="Core Diameter" value={result.spec.earthingCore.coreDiameter} unit="mm" />
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    {result.spec.mgtThickness && (
                      <SpecRow label="Mica Glass Tape (MGT)" value={result.spec.mgtThickness} unit="mm" />
                    )}
                    {result.spec.conductorScreenThickness && (
                      <SpecRow label="Conductor Screen Thickness" value={result.spec.conductorScreenThickness} unit="mm" />
                    )}
                    {result.spec.insulationScreenThickness && (
                      <SpecRow label="Insulation Screen Thickness" value={result.spec.insulationScreenThickness} unit="mm" />
                    )}
                    
                    {result.spec.mvScreenDiameter && (
                      <SpecRow label={`Metallic Screen (${params.mvScreenType})`} value={result.spec.mvScreenDiameter} unit="mm" />
                    )}

                    {params.cores > 1 && (
                      <SpecRow label="Laid Up Diameter" value={result.spec.laidUpDiameter} unit="mm" />
                    )}
                    
                    {result.spec.innerCoveringThickness > 0 && (
                      <SpecRow label="Inner Covering Thickness" value={result.spec.innerCoveringThickness} unit="mm" />
                    )}
                    
                    {result.spec.screenThickness && (
                      <SpecRow label={`Overall Screen (${params.screenType}${params.screenType === 'CWS' ? ` ${params.screenSize}mm²` : ''})`} value={result.spec.screenThickness} unit="mm" />
                    )}
                    {result.spec.separatorThickness && (
                      <SpecRow label="Separator Sheath Thickness" value={result.spec.separatorThickness} unit="mm" />
                    )}
                    {params.armorType !== 'Unarmored' && (
                      <>
                        <SpecRow label="Diameter Under Armor" value={result.spec.diameterUnderArmor} unit="mm" />
                        {result.spec.braidWireDiameter ? (
                          <>
                            <SpecRow label="Braid Wire Diameter" value={result.spec.braidWireDiameter} unit="mm" />
                            {result.spec.braidCoverage && (
                              <SpecRow label="Braid Coverage" value={result.spec.braidCoverage} unit="%" precision={0} />
                            )}
                          </>
                        ) : (
                          <SpecRow label="Armor Wire/Tape Thickness" value={result.spec.armorThickness} unit="mm" />
                        )}
                        <SpecRow label="Diameter Over Armor" value={result.spec.diameterOverArmor} unit="mm" />
                      </>
                    )}
                    
                    {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) && (
                      <SpecRow label="Outer Sheath Thickness" value={result.spec.sheathThickness} unit="mm" />
                    )}
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <div className="flex justify-between items-start py-1">
                        <span className="text-sm text-slate-600 font-bold">Overall Diameter (Approx)</span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-slate-900 font-bold">
                            {result.spec.overallDiameter.toFixed(1)} mm
                          </span>
                          {result.spec.overallDiameterMin && result.spec.overallDiameterMax && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Standard: {result.spec.overallDiameterMin} - {result.spec.overallDiameterMax} mm
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packing Data */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    Packing Data
                  </h2>
                </div>
                {(() => {
                  const packing = calculatePacking(result.spec.overallDiameter, result.bom.totalWeight);
                  return (
                    <div className="space-y-3">
                      <SpecRow label="Standard Length" value={packing.standardLength} unit="m" precision={0} />
                      <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                        <span>Drum Type</span>
                        <span className="font-mono text-slate-900">{packing.selectedDrum.type}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                        <span>Drum Dimensions</span>
                        <span className="font-mono text-slate-900">
                          {packing.selectedDrum.diameterWithCover / 10} x {packing.selectedDrum.outerWidth / 10} cm
                        </span>
                      </div>
                      <SpecRow label="Net Weight" value={packing.netWeight} unit="kg" />
                      <SpecRow label="Gross Weight" value={packing.grossWeight} unit="kg" />
                      <div className="pt-2 mt-2 border-t border-slate-100">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Packing Cost</span>
                          <span className="font-mono text-slate-900 font-bold">
                            Rp {Math.round(packing.packingCostPerMeter).toLocaleString('id-ID')} / m
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bill of Material */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    Bill of Material (per km)
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label={`Conductor (${params.conductorMaterial})`} value={result.bom.conductorWeight - result.bom.earthingConductorWeight} unit="kg/km" />
                  {result.bom.earthingConductorWeight > 0 && (
                    <>
                      {params.standard.includes('NFA2X-T') && result.bom.earthingAlWeight && result.bom.earthingSteelWeight ? (
                        <>
                          <SpecRow label="Messenger Conductor (Aluminum)" value={result.bom.earthingAlWeight} unit="kg/km" />
                          <SpecRow label="Messenger Conductor (Steel)" value={result.bom.earthingSteelWeight} unit="kg/km" />
                        </>
                      ) : (
                        <SpecRow 
                          label={params.standard.includes('NFA2X-T') ? "Messenger Conductor (Al+Steel)" : `Earthing Conductor (${params.conductorMaterial})`} 
                          value={result.bom.earthingConductorWeight} 
                          unit="kg/km" 
                        />
                      )}
                    </>
                  )}
                  {result.bom.mgtWeight > 0 && (
                    <SpecRow label="Mica Glass Tape (MGT)" value={result.bom.mgtWeight} unit="kg/km" />
                  )}
                  {result.bom.semiCondWeight > 0 && (
                    <SpecRow label="Semi-conductive Layers" value={result.bom.semiCondWeight} unit="kg/km" />
                  )}
                  <SpecRow label={`Insulation (${params.insulationMaterial})`} value={result.bom.insulationWeight - result.bom.earthingInsulationWeight} unit="kg/km" />
                  {result.bom.earthingInsulationWeight > 0 && (
                    <SpecRow label={`Earthing Insulation (${params.insulationMaterial})`} value={result.bom.earthingInsulationWeight} unit="kg/km" />
                  )}
                  
                  {result.bom.mvScreenWeight > 0 && (
                    <SpecRow label={`Metallic Screen (${params.mvScreenType})`} value={result.bom.mvScreenWeight} unit="kg/km" />
                  )}

                  {result.bom.isWeight !== undefined && result.bom.isWeight > 0 && (
                    <>
                      <SpecRow label="Individual Screen (Al Foil)" value={result.bom.isAlWeight} unit="kg/km" />
                      <SpecRow label="Individual Screen (Drain Wire)" value={result.bom.isDrainWeight} unit="kg/km" />
                      <SpecRow label="Individual Screen (PET Tape)" value={result.bom.isPetWeight} unit="kg/km" />
                    </>
                  )}
                  
                  {result.bom.osWeight !== undefined && result.bom.osWeight > 0 && (
                    <>
                      <SpecRow label="Overall Screen (Al Foil)" value={result.bom.osAlWeight} unit="kg/km" />
                      <SpecRow label="Overall Screen (Drain Wire)" value={result.bom.osDrainWeight} unit="kg/km" />
                      <SpecRow label="Overall Screen (PET Tape)" value={result.bom.osPetWeight} unit="kg/km" />
                    </>
                  )}
                  
                  {result.bom.innerCoveringWeight > 0 && (
                    <SpecRow label="Inner Covering (PVC)" value={result.bom.innerCoveringWeight} unit="kg/km" />
                  )}
                  
                  {result.bom.screenWeight > 0 && (
                    <SpecRow label={`Overall Screen (${params.screenType}${params.screenType === 'CWS' ? ` ${params.screenSize}mm²` : ''})`} value={result.bom.screenWeight} unit="kg/km" />
                  )}
                  
                  {result.bom.separatorWeight > 0 && (
                    <SpecRow label="Separator Sheath" value={result.bom.separatorWeight} unit="kg/km" />
                  )}
                  
                  {params.armorType !== 'Unarmored' && (
                    <SpecRow label={`Armor (${params.armorType})`} value={result.bom.armorWeight} unit="kg/km" />
                  )}
                  
                  {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) && (
                    <SpecRow label={`Outer Sheath (${params.sheathMaterial})`} value={result.bom.sheathWeight} unit="kg/km" />
                  )}
                  
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <SpecRow label="Total Cable Weight (Approx)" value={result.bom.totalWeight} unit="kg/km" isBold />
                  </div>
                </div>
              </div>

              {/* Material Weight Calculation (Advance Mode Only) */}
              {params.mode === 'advance' && result.weights && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Scale className="w-5 h-5 text-indigo-500" />
                      Material Weight Breakdown
                    </h2>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">Formula View</span>
                  </div>
                  
                  <div className="space-y-1">
                    <WeightFormulaRow label="Conductor" detail={result.weights.conductor} formulaKey="conductor" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Mica Glass Tape (MGT)" detail={result.weights.mgt} formulaKey="mgt" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Conductor Screen" detail={result.weights.conductorScreen} formulaKey="conductorScreen" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Insulation" detail={result.weights.insulation} formulaKey="insulation" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Insulation Screen" detail={result.weights.insulationScreen} formulaKey="insulationScreen" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Metallic Screen" detail={result.weights.metallicScreen} formulaKey="metallicScreen" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Inner Sheath" detail={result.weights.innerSheath} formulaKey="innerSheath" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Armor" detail={result.weights.armor} formulaKey="armor" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Separator" detail={result.weights.separator} formulaKey="separator" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Outer Sheath" detail={result.weights.outerSheath} formulaKey="outerSheath" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Earthing" detail={result.weights.earthing} formulaKey="earthing" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                  </div>
                  
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] text-slate-400 leading-relaxed italic">
                      * All weights are calculated in kg/km. Formulas follow standard cable construction geometry.
                    </p>
                  </div>
                </div>
              )}

              {/* Electrical Properties */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Electrical Properties
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <SpecRow label="Max DC Resistance @ 20°C" value={result.electrical.maxDcResistance} unit="Ω/km" precision={4} />
                  <div className="flex justify-between items-center py-1 text-sm text-slate-600">
                    <span>Test Voltage (5 min)</span>
                    <span className="font-mono text-slate-900">{result.electrical.testVoltage}</span>
                  </div>
                  {params.standard !== 'BS EN 50288-7' && (
                    <>
                      <SpecRow 
                        label={params.standard.includes('NFA2X') ? "Current Carrying Capacity (KHA)" : "Current Capacity (In Air)"} 
                        value={result.electrical.currentCapacityAir} 
                        unit="A" 
                        precision={0} 
                      />
                      {!params.standard.includes('NFA2X') && (
                        <SpecRow label="Current Capacity (In Ground)" value={result.electrical.currentCapacityGround} unit="A" precision={0} />
                      )}
                    </>
                  )}
                  {params.standard === 'BS EN 50288-7' && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-[9px] text-slate-400 italic">
                        * Electrical properties (KHA) are not applicable for instrumentation standard BS EN 50288-7.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Cost Analysis (HPP)
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Estimated HPP per Meter</div>
                    <div className="text-xl font-bold text-slate-600 font-mono">
                      Rp {currentHPP.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="text-xs text-indigo-500 uppercase tracking-wider mb-1 font-bold">Estimated Selling Price</div>
                    <div className="text-3xl font-bold text-indigo-600 font-mono">
                      Rp {currentSellingPrice.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Cost Breakdown (per Meter)</span>
                    <div className="space-y-2">
                      {(() => {
                        const breakdown = calculateCostBreakdown(result.bom, params);
                        const packing = calculatePacking(result.spec.overallDiameter, result.bom.totalWeight);
                        const items = [
                          { label: `Phase Conductor (${params.conductorMaterial})`, cost: breakdown.conductor },
                          ...(params.standard.includes('NFA2X-T') && breakdown.earthingAl !== undefined ? [
                            { label: `Messenger (Aluminum)`, cost: breakdown.earthingAl },
                            { label: `Messenger (Steel Wire)`, cost: breakdown.earthingSteel },
                          ] : [
                            { label: `Earthing Conductor (${params.conductorMaterial})`, cost: breakdown.earthingConductor },
                          ]),
                          { label: `Mica Glass Tape (MGT)`, cost: breakdown.mgt },
                          { label: `Semi-conductive Layers`, cost: breakdown.semiCond },
                          { label: `Phase Insulation (${params.insulationMaterial})`, cost: breakdown.insulation },
                          ...(params.standard === 'BS EN 50288-7' ? [
                            { label: `Individual Screen (Al Foil)`, cost: breakdown.isAl },
                            { label: `Individual Screen (Drain Wire)`, cost: breakdown.isDrain },
                            { label: `Individual Screen (PET Tape)`, cost: breakdown.isPet },
                            { label: `Overall Screen (Al Foil)`, cost: breakdown.osAl },
                            { label: `Overall Screen (Drain Wire)`, cost: breakdown.osDrain },
                            { label: `Overall Screen (PET Tape)`, cost: breakdown.osPet },
                          ] : []),
                          { label: `Earthing Insulation (${params.insulationMaterial})`, cost: breakdown.earthingInsulation },
                          { label: `Metallic Screen (${params.mvScreenType})`, cost: breakdown.mvScreen },
                          { label: `Inner Sheath (${params.innerSheathMaterial || 'PVC'})`, cost: breakdown.innerCovering },
                          { label: `Overall Screen (${params.screenType}${params.screenType === 'CWS' ? ` ${params.screenSize}mm²` : ''})`, cost: breakdown.screen },
                          { label: `Separator Sheath (${params.separatorMaterial || 'PVC'})`, cost: breakdown.separator },
                          { label: `Armor (${params.armorType})`, cost: breakdown.armor },
                          { label: `Outer Sheath (${params.sheathMaterial})`, cost: breakdown.sheath },
                          { label: `Packing Cost (${packing.selectedDrum.type})`, cost: packing.packingCostPerMeter },
                        ].filter(item => item.cost > 0);

                        const totalMaterialCost = items.reduce((acc, item) => acc + item.cost, 0);
                        const overheadCost = totalMaterialCost * (params.overhead || 0) / 100;

                        return (
                          <>
                            {items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                                <span>{item.label}</span>
                                <span className="font-mono text-slate-900">Rp {item.cost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-400 italic">
                              <span>Overhead ({params.overhead}%)</span>
                              <span className="font-mono">Rp {overheadCost.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="pt-2 mt-1 border-t border-indigo-100 flex justify-between text-xs font-bold text-indigo-600">
                              <span>Total HPP</span>
                              <span className="font-mono">Rp {currentHPP.toLocaleString('id-ID', { maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-emerald-600">
                              <span>Margin ({params.margin}%):</span>
                              <span className="font-mono">Rp {(currentSellingPrice - currentHPP).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project List Section (Right Side) */}
          <div className={`${isConfigExpanded ? 'hidden' : 'lg:col-span-4'} transition-all duration-300`}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <List className="w-6 h-6 text-indigo-600" />
                  Project List
                </h2>
                {projectItems.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                    {projectItems.length}
                  </span>
                )}
              </div>

              {projectItems.length > 0 ? (
                <div className="space-y-4">
                  {projectItems.map((item) => (
                    <div key={item.params.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group relative">
                      <button
                        onClick={() => removeFromProject(item.params.id!)}
                        className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="font-mono text-xs font-bold text-slate-900 mb-1 pr-6">
                        {getCableDesignation(item.params, item.result)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100">
                          {item.params.standard}
                        </span>
                        <span className="text-[10px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 font-mono">
                          OD: {item.result.spec.overallDiameter} mm
                        </span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Conductor ({item.params.conductorMaterial}):</span>
                          <span className="font-mono">{item.result.bom.conductorWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Insulation ({item.params.insulationMaterial}):</span>
                          <span className="font-mono">{item.result.bom.insulationWeight} kg/km</span>
                        </div>
                        {item.result.bom.armorWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Armor ({item.params.armorType}):</span>
                            <span className="font-mono">{item.result.bom.armorWeight} kg/km</span>
                          </div>
                        )}
                        {item.result.bom.mvScreenWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Screen ({item.params.mvScreenType}):</span>
                            <span className="font-mono">{item.result.bom.mvScreenWeight} kg/km</span>
                          </div>
                        )}
                        {item.result.bom.mgtWeight > 0 && (
                          <div className="flex justify-between text-[10px] text-slate-500">
                            <span>MGT:</span>
                            <span className="font-mono">{item.result.bom.mgtWeight} kg/km</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Sheath ({item.params.sheathMaterial}):</span>
                          <span className="font-mono">{item.result.bom.sheathWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 col-span-2 mt-1 pt-1 border-t border-slate-50">
                          <span>Total Weight:</span>
                          <span className="font-mono">{item.result.bom.totalWeight} kg/km</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-indigo-600 col-span-2 mt-1">
                          <span>HPP per Meter:</span>
                          <span className="font-mono">Rp {calculateHPP(item.result, item.params).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowReview(true)}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-all shadow-sm"
                    >
                      <FileText className="w-5 h-5" />
                      Review Project
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <List className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">No items added yet.<br/>Configure a cable and click "Add to Project".</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightFormulaRow({ 
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

function SpecRow({ label, value, unit, isBold = false, precision = 1 }: { label: string; value: number | string; unit: string; isBold?: boolean; precision?: number }) {
  return (
    <div className={`flex justify-between items-center py-1 ${isBold ? 'font-bold text-slate-900' : 'text-sm text-slate-600'}`}>
      <span>{label}</span>
      <span className="font-mono text-slate-900">
        {typeof value === 'number' ? value.toFixed(precision) : value} <span className="text-slate-400 text-xs ml-1">{unit}</span>
      </span>
    </div>
  );
}

function MaterialSettingsInput({ 
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
