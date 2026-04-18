import React, { useState, useEffect, useRef } from 'react';
import { Settings, FileText, Package, Download, Zap, Info, Plus, Trash2, List, DollarSign, BarChart3, ArrowLeft, Printer, TrendingUp, RotateCcw, Maximize2, Minimize2, CheckCircle2, Database, Save, FolderOpen, Scale, X, Upload, FilePlus, Search, FileJson, Layers, Calendar, ChevronRight, Ruler } from 'lucide-react';
import { NYCY_DATA } from '../utils/nycyData';
import { AAC_SIZES, AAC_DATA, AAACS_SIZES, AAACS_DATA } from '../utils/aacData';
import { NFA2XT_DATA, getWeightAdditionFactor } from '../utils/abcData';
import {
  CONDUCTOR_RESISTIVITY,
  RESISTANCE_CU,
  RESISTANCE_TCU,
  RESISTANCE_AL,
  RESISTANCE_CU_CLASS5,
  RESISTANCE_TCU_CLASS5,
  INSTRUMENT_FACTORS,
} from '../utils/conductorData';
import {
  CABLE_DATA,
  CWS_WIRE_DIAMETERS,
} from '../utils/sharedData';
import {
  calculateCable,
  CableDesignParams,
  OtherItem,
  CalculationResult,
  CABLE_SIZES,
  ConductorMaterial,
  ConductorType,
  InsulationMaterial,
  ArmorType,
  SheathMaterial,
  CableStandard,
  MvScreenType,
    FlameRetardantCategory,
} from '../utils/cableCalculations';
import {
  DEFAULT_MATERIAL_PRICES,
  DEFAULT_MATERIAL_DENSITIES,
  DEFAULT_MATERIAL_SCRAP,
  DEFAULT_PARAMS,
  CABLE_STANDARDS,
} from '../utils/designerData';
import { 
  getCableDesignation, 
  getConstructionKey, 
  calculateCostBreakdown, 
  calculatePacking, 
  calculateHPP,
  calculateSellingPrice
} from '../utils/designerUtils';
import { MaterialDensities } from '../utils/sharedData';
import { getLayingUpFactor } from '../utils/cableCalculations';
import { INITIAL_DRUM_DATA, DrumData } from '../utils/drumData';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { initDB, saveProjectToDB, getProjectsFromDB, deleteProjectFromDB, SavedProject, setDbHandle, getDbHandle } from '../lib/db';
import * as XLSX from 'xlsx-js-style';
import { MaterialSettingsInput, SpecRow, WeightFormulaRow, EditableCell } from './designer/CableDesignerComponents';
import { ReviewSpecifications } from './designer/ReviewSpecifications';

export default function CableDesigner() {
  const [params, setParams] = useState<CableDesignParams>(() => {
    if (typeof window !== 'undefined') {
      const savedMargin = safeLocalStorage.getItem('cable_default_margin');
      const savedOverhead = safeLocalStorage.getItem('cable_default_overhead');
      return {
        ...DEFAULT_PARAMS,
        margin: savedMargin ? parseFloat(savedMargin) : DEFAULT_PARAMS.margin,
        overhead: savedOverhead ? parseFloat(savedOverhead) : DEFAULT_PARAMS.overhead,
      };
    }
    return DEFAULT_PARAMS;
  });


  const isMV = params.voltage.includes('/') && (
    params.voltage.includes('3.6/6') || 
    params.voltage.includes('6/10') || 
    params.voltage.includes('8.7/15') || 
    params.voltage.includes('12/20') || 
    params.voltage.includes('18/30')
  );
  const isInstrumentation = params.standard === 'BS EN 50288-7' || (params.standard === 'Manufacturing Specification' && params.hasScreen) || params.standard.includes('Instrument');

  const [lmeData, setLmeData] = useState<{date: string, copper: number | null, aluminium: number | null, exchangeRate?: number | null} | null>(null);

  useEffect(() => {
    fetch('/api/lme-prices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLmeData(data);
        }
      })
      .catch(err => console.error("Failed to fetch LME data:", err));
  }, []);

  const [activeTab, setActiveTab] = useState<'config' | 'prices' | 'drums' | 'settings'>('config');
  const [isConfigExpanded, setIsConfigExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true; // Default to true now for better UX
  });

  useEffect(() => {
    if (activeTab === 'config') {
      setIsConfigExpanded(true);
    }
  }, [activeTab]);
  const [showReview, setShowReview] = useState(false);
  const [reviewTab, setReviewTab] = useState<'summary' | 'specifications'>('summary');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCategory, setNewMaterialCategory] = useState('Compound Insulation');
  const [printedSheets, setPrintedSheets] = useState<Set<number>>(new Set());
  const [printingGroupId, setPrintingGroupId] = useState<number | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loadedProjectConfig, setLoadedProjectConfig] = useState<{lmeParams?: any, materialPrices?: any, exchangeRate?: number} | null>(null);
  const [projectName, setProjectName] = useState('New Project');
  const [projectNumber, setProjectNumber] = useState('');
  const [showStandardPopup, setShowStandardPopup] = useState(false);
  const [standardSearchQuery, setStandardSearchQuery] = useState('');
  const standardPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (standardPopupRef.current && !standardPopupRef.current.contains(event.target as Node)) {
        setShowStandardPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [standardPopupRef]);

  const filteredStandards = CABLE_STANDARDS.filter(s => 
    s.label.toLowerCase().includes(standardSearchQuery.toLowerCase()) ||
    s.value.toLowerCase().includes(standardSearchQuery.toLowerCase())
  );
  const [projectItems, setProjectItems] = useState<{params: CableDesignParams, result: CalculationResult}[]>([]);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  const [isBulkCalculationEnabled, setIsBulkCalculationEnabled] = useState(false);
  const [bulkItems, setBulkItems] = useState<{ cores: number, size: number }[]>([]);
  const [manualBulkCore, setManualBulkCore] = useState<number>(1);
  const [selectedBulkSizes, setSelectedBulkSizes] = useState<number[]>([]);

  const updateProjectItemParam = (idx: number, key: string, value: any) => {
    setProjectItems(prev => prev.map((item, i) => {
      if (i === idx) {
        let newParams = { ...item.params, [key]: value };
        
        let newResult = calculateCable(newParams, materialDensities, materialScrap);
        
        // Auto switch SFA to RGB if diameterUnderArmor < 15mm
        if (newParams.armorType === 'SFA' && newParams.autoSwitchSfaToRgb && newResult.spec.diameterUnderArmor < 15) {
          newParams = { ...newParams, armorType: 'RGB' };
          newResult = calculateCable(newParams, materialDensities, materialScrap);
        }

        return { params: newParams, result: newResult };
      }
      return item;
    }));
  };

  const updateProjectItemCustomPrice = (idx: number, material: string, price: number) => {
    setProjectItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const newCustomPrices = { ...(item.params.customMaterialPrices || {}), [material]: price };
        const newParams = { ...item.params, customMaterialPrices: newCustomPrices };
        return { params: newParams, result: item.result };
      }
      return item;
    }));
  };

  const [dbFileHandle, setDbFileHandle] = useState<any>(null);
  const [sqlConfig, setSqlConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = safeLocalStorage.getItem('cable_sql_config');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlForm, setSqlForm] = useState({ host: '', port: '', database: '', username: '', password: '' });
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [showSaveConfigModal, setShowSaveConfigModal] = useState(false);
  const [saveConfigName, setSaveConfigName] = useState('cable_config');
  const [showLoadConfigModal, setShowLoadConfigModal] = useState(false);

  const handleConnectSql = async () => {
    setIsConnecting(true);
    // Simulate connection delay
    setTimeout(async () => {
      setIsConnecting(false);
      setSqlConfig(sqlForm);
      safeLocalStorage.setItem('cable_sql_config', JSON.stringify(sqlForm));
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

  useEffect(() => {
    const loadDbHandle = async () => {
      try {
        const handle = await getDbHandle();
        if (handle) {
          // Verify if we still have permission, if not we will request it when saving
          const options = { mode: 'readwrite' };
          if ((await handle.queryPermission(options)) === 'granted') {
            setDbFileHandle(handle);
          } else {
            // We have the handle but lack permission. We can still set it, 
            // and request permission when the user tries to save.
            setDbFileHandle(handle);
          }
        }
      } catch (e) {
        console.error('Failed to load DB handle from IndexedDB', e);
      }
    };
    loadDbHandle();
  }, []);

  const handleSaveProject = async () => {
    if (projectItems.length === 0) {
      alert('No items to save.');
      return;
    }
    
    const id = projectId || crypto.randomUUID();
    const project: SavedProject = {
      id,
      name: projectName,
      projectNumber,
      items: projectItems,
      updatedAt: Date.now(),
      lmeParams,
      materialPrices,
      exchangeRate: lmeParams.kurs,
    };

    if (dbFileHandle) {
      try {
        // Request permission if not granted
        if ((await dbFileHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
          const permission = await dbFileHandle.requestPermission({ mode: 'readwrite' });
          if (permission !== 'granted') {
            alert('Izin ditolak. Tidak dapat menyimpan ke database lokal.');
            return;
          }
        }

        const file = await dbFileHandle.getFile();
        const contents = await file.text();
        let allProjects = [];
        try {
          allProjects = JSON.parse(contents);
        } catch(e) {}
        
        const existingIdx = allProjects.findIndex((p: any) => p.id === id);
        if (existingIdx >= 0) {
          allProjects[existingIdx] = project;
        } else {
          allProjects.push(project);
        }
        
        const writable = await dbFileHandle.createWritable();
        await writable.write(JSON.stringify(allProjects));
        await writable.close();
        
        setProjectId(id);
        alert('Project saved successfully to local database!');
        return;
      } catch (err) {
        console.error('Error saving to local DB:', err);
        alert('Gagal menyimpan ke database lokal. Pastikan Anda memberikan izin.');
      }
    }

    if (!sqlConfig) {
      setShowSqlModal(true);
      return;
    }
    try {
      await saveProjectToDB(project);
      setProjectId(id);
      alert('Project saved successfully to SQL database!');
    } catch (err) {
      console.error(err);
      alert('Failed to save project to SQL database.');
    }
  };

  const handleLoadProjects = async () => {
    setProjectSearchQuery('');
    if (dbFileHandle) {
      try {
        const file = await dbFileHandle.getFile();
        const contents = await file.text();
        const projects = JSON.parse(contents);
        setSavedProjects(projects.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
        setShowProjectsModal(true);
        return;
      } catch (err) {
        console.error('Error loading from local DB:', err);
        alert('Gagal memuat dari database lokal.');
      }
    }

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

  const handleExportExcel = async () => {
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
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: bgColor } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
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
        params.formationType,
        params.cores === 1 ? '1C' : 'MC'
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
      const d: Record<string, number> = { Cu: 8.89, Al: 2.7, TCu: 8.89, XLPE: 0.922, PVC: 1.44, PE: 0.93, LSZH: 1.48, 'PVC-FR': 1.44, SHF1: 1.48, SHF2: 1.48, EPR: 1.25, HEPR: 1.25, Steel: 7.85, SteelWire: 7.85, 'Inner Semi Conductive': 1.15, 'Outer Semi Conductive': 1.15, MGT: 1.4 };
      return d[material] || 1.44;
    };

    (Object.entries(groupedItems) as [string, { item: { params: CableDesignParams, result: CalculationResult }, index: number }[]][]).forEach(([groupKey, items]) => {
      const sampleItem = items[0].item;
      const isMV = sampleItem.params.voltage.includes('/') && (
        sampleItem.params.voltage.includes('3.6/6') || 
        sampleItem.params.voltage.includes('6/10') || 
        sampleItem.params.voltage.includes('8.7/15') || 
        sampleItem.params.voltage.includes('12/20') || 
        sampleItem.params.voltage.includes('18/30')
      );
      const isInstrumentation = sampleItem.params.standard === 'BS EN 50288-7' || (sampleItem.params.standard === 'Manufacturing Specification' && sampleItem.params.hasScreen) || sampleItem.params.standard.includes('Instrument');
      const isIEC60502_1 = sampleItem.params.standard === 'IEC 60502-1';
      const hasScreen = isMV ? (sampleItem.params.mvScreenType && sampleItem.params.mvScreenType !== 'None') : (sampleItem.params.hasScreen && sampleItem.params.screenType && sampleItem.params.screenType !== 'None');
      const hasArmor = sampleItem.params.armorType && sampleItem.params.armorType !== 'Unarmored';
      const hasEarth = sampleItem.params.hasEarthing && sampleItem.params.earthingSize && sampleItem.params.earthingSize > 0;
      const isNoSheath = sampleItem.params.standard.includes('NYA') || sampleItem.params.standard.includes('NYAF') || sampleItem.params.standard.includes('NFA2X');
      const hasInnerSheath = !isNoSheath && (sampleItem.params.hasInnerSheath !== false) && ((sampleItem.params.armorType && sampleItem.params.armorType !== 'Unarmored') || sampleItem.params.hasInnerSheath || (sampleItem.params.innerSheathMaterial && sampleItem.params.innerSheathMaterial !== 'None'));
      const hasSeparator = isIEC60502_1 && (sampleItem.params.hasSeparator || (hasScreen && hasArmor));
      const hasOuterSheath = !sampleItem.params.standard.includes('NYA') && !sampleItem.params.standard.includes('NFA2X') && sampleItem.params.standard !== 'SPLN 41-6 : 1981 AAC' && sampleItem.params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && sampleItem.params.hasOuterSheath !== false;
      const isNFA2XT = sampleItem.params.standard.includes('NFA2X-T');
      const isNFA2X = sampleItem.params.standard.includes('NFA2X') && !isNFA2XT;
      const isAAC = sampleItem.params.standard === 'SPLN 41-6 : 1981 AAC';
      const isAAACS = sampleItem.params.standard === 'SPLN 41-10 : 1991 (AAAC-S)';
      const hasPetTapeInGroup = isMV ? items.some(i => i.item.params.cores === 1) : true;

      let sheetName = getCableDesignation(sampleItem.params, sampleItem.result).split(' ')[0];
      if (isInstrumentation) {
        sheetName = `Inst ${sampleItem.params.formationType || 'Pair'}`;
      }
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
      const generalHeaders = ['No'];
      if (isInstrumentation) {
        generalHeaders.push('Total Core', sampleItem.params.formationType || 'Pair');
      } else {
        generalHeaders.push('Core');
      }
      generalHeaders.push('Size', 'Laid-up Dia');
      addGroup('General', hGen, generalHeaders);
      
      // Conductor
      addGroup('Conductor', hCond, ['Wires', 'Wire Dia', 'DC Res (Ω/km)', 'Resistivity', 'Calc Area (mm2)', 'Cond OD', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (sampleItem.params.fireguard) {
        addGroup('MGT', hMGT, ['Thk (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      }

      if (isMV) addGroup('Cond Screen', hCScr, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (!isAAC) addGroup('Insulation', hIns, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (isMV) addGroup('Ins Screen', hIScr, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (isMV && hasScreen) {
        if (sampleItem.params.mvScreenType === 'CTS') {
          addGroup('Met Screen', hMScr, hasPetTapeInGroup
            ? ['Cu Tape Thk (mm)', 'PET Tape Thk (mm)', 'OD (mm)', 'Cu Tape Wt (kg/km)', 'PET Tape Wt (kg/km)', 'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']
            : ['Cu Tape Thk (mm)', 'OD (mm)', 'Cu Tape Wt (kg/km)', 'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else {
          addGroup('Met Screen', hMScr, hasPetTapeInGroup
            ? ['Size (mm2)', 'Wire Dia (mm)', 'Wire Count', 'Cu Tape Thk (mm)', 'PET Tape Thk (mm)', 'OD (mm)', 'Cu Wire Wt (kg/km)', 'Cu Tape Wt (kg/km)', 'PET Tape Wt (kg/km)', 'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']
            : ['Size (mm2)', 'Wire Dia (mm)', 'Wire Count', 'Cu Tape Thk (mm)', 'OD (mm)', 'Cu Wire Wt (kg/km)', 'Cu Tape Wt (kg/km)', 'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        }
      }
      
      if (hasEarth) {
        if (isNFA2XT) addGroup('Earth Core', hEarth, ['Size', 'Al Wires', 'Al Dia', 'St Wires', 'St Dia', 'Cond OD (mm)', 'Wt (kg/km)', 'Cst (Rp/m)', 'Ins Thk', 'Ins Wt', 'Ins Cst']);
        else addGroup('Earth Core', hEarth, ['Size', 'Wires', 'Wire Dia (mm)', 'Calc Area (mm2)', 'Cond OD (mm)', 'Wt (kg/km)', 'Cst (Rp/m)', 'Ins Thk', 'Ins Wt', 'Ins Cst']);
      }

      if (isInstrumentation && sampleItem.params.hasIndividualScreen) addGroup('Indv Screen', hMScr, ['Al Foil Qty', 'Al Foil Thk', 'OD (mm)', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wire Qty', 'Drain Size (mm2)', 'Drain Wt', 'Drain Prc', 'PET Tape Qty', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);
      if (isInstrumentation && sampleItem.params.hasOverallScreen) addGroup('Ovrl Screen', hMScr, ['Al Foil Qty', 'Al Foil Thk', 'OD (mm)', 'Al Foil Wt', 'Al Foil Prc', 'Drain Wire Qty', 'Drain Size (mm2)', 'Drain Wt', 'Drain Prc', 'PET Tape Qty', 'PET Thk', 'PET Wt', 'PET Prc', 'Cst (Rp/m)']);
      const hasBinderTape = sampleItem.params.conductorType === 'sm' && sampleItem.params.cores > 1;
      if (hasBinderTape) addGroup('Binder Tape', hInSh, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (hasInnerSheath) addGroup('Inner Sheath', hInSh, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (!isMV && !isInstrumentation && hasScreen) {
        if (sampleItem.params.screenType === 'CTS') {
          addGroup('Met Screen', hMScr, ['Cu Tape Thk (mm)', 'PET Tape Thk (mm)', 'OD (mm)', 'Cu Tape Wt (kg/km)', 'PET Tape Wt (kg/km)', 'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else {
          addGroup('Met Screen', hMScr, ['Dia Wire Screen (mm)', 'Cu Tape Thk (mm)', 'PET Tape Thk (mm)', 'OD (mm)', 'Cu Wire Wt (kg/km)', 'Cu Tape Wt (kg/km)', 'PET Tape Wt (kg/km)',  'Total Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        }
      }
      if (hasSeparator) addGroup('Separator', hSep, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      if (hasArmor) {
        const armorLabel = sampleItem.params.standard === 'LiYCY' ? 'Braid Screen' : 'Armor';
        if (sampleItem.params.armorType === 'STA') {
          addGroup(`${armorLabel} (STA)`, hArm, ['Steel Tape Thk (mm)', 'Tape Overlap (%)', 'OD (mm)', 'Tape Wt (kg/km)', 'Tape Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else if (sampleItem.params.armorType === 'SWA' || sampleItem.params.armorType === 'AWA') {
          addGroup(`${armorLabel} (${sampleItem.params.armorType})`, hArm, ['Armor Wire Dia (mm)', 'OD (mm)', 'Wire Wt (kg/km)', 'Wire Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else if (sampleItem.params.armorType === 'SFA') {
          addGroup(`${armorLabel} (SFA)`, hArm, ['Steel Flat Thk (mm)', 'Steel Tape Thk (mm)', 'OD (mm)', 'Flat Wt (kg/km)', 'Tape Wt (kg/km)', 'Wire Prc (Rp/kg)', 'Tape Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else if (sampleItem.params.armorType === 'RGB') {
          addGroup(`${armorLabel} (RGB)`, hArm, ['Armor Wire Dia (mm)', 'Armor Tape Thk (mm)', 'OD (mm)', 'Wire Wt (kg/km)', 'Tape Wt (kg/km)', 'Wire Prc (Rp/kg)', 'Tape Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else if (sampleItem.params.armorType === 'GSWB' || sampleItem.params.armorType === 'TCWB') {
          const wireLabel = sampleItem.params.standard === 'LiYCY' ? 'Braid Wire Dia (mm)' : 'Braid Wire Dia (mm)';
          addGroup(`${armorLabel} (${sampleItem.params.armorType})`, hArm, [wireLabel, 'No. of Carriers', 'Wires/Carrier', 'Lay Pitch (mm)', 'Braid Coverage (%)', 'OD (mm)', 'Wire Wt (kg/km)', 'Wire Prc (Rp/kg)', 'Cst (Rp/m)']);
        } else {
          addGroup(armorLabel, hArm, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
        }
      }
      const hasBinderTapeOverArmor = sampleItem.params.armorType === 'SWA' || sampleItem.params.armorType === 'AWA';
      if (hasBinderTapeOverArmor) {
        addGroup('Binder Tape (Armor)', hArm, ['Thk (mm)', 'OD (mm)', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      }
      if (hasOuterSheath) {
        const sheathThkLabel = sampleItem.params.standard === 'LiYCY' ? 'Min. Thk (mm)' : 'Thk (mm)';
        addGroup('Outer Sheath', hOutSh, [sheathThkLabel, 'Overall Dia', 'Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      }
      if (!isMV && !isAAC) {
        addGroup('Masterbatch', hOutSh, ['Wt (kg/km)', 'Prc (Rp/kg)', 'Cst (Rp/m)']);
      }

      addGroup('Summary', hTot, ['Pack Cst', 'Base HPP', 'OH (%)', 'HPP/m', 'MG (%)', 'Selling Price']);

      sheetsData[sheetName] = [topHeaders, subHeaders];
      sheetsMerges[sheetName] = merges;

      items.forEach(({ item, index }) => {
        const r = sheetsData[sheetName].length + 1;
        
        const customPrices = item.params.customMaterialPrices || {};
        const getPrice = (mat: string, fallback: number) => customPrices[mat] !== undefined ? customPrices[mat] : (materialPrices[mat] !== undefined ? materialPrices[mat] : fallback);

        const condPrice = (item.params.conductorMaterial === 'Cu' ? getPrice('Cu', 0) : (item.params.conductorMaterial === 'Al' ? getPrice('Al', 0) : getPrice('TCu', 0)));
        const insPrice = getPrice(item.params.insulationMaterial, getPrice('XLPE', 0));
        const innerPrice = getPrice(item.params.innerSheathMaterial || 'PVC', getPrice('PVC', 0));
        
        const armorMat = item.params.armorType === 'AWA' ? 'AWA' : (item.params.armorType === 'ATA' ? 'ATA' : (item.params.armorType === 'SWA' ? 'SWA' : (item.params.armorType === 'STA' ? 'STA' : (item.params.armorType === 'SFA' ? 'SFA' : (item.params.armorType === 'RGB' ? 'RGB' : (item.params.armorType === 'GSWB' ? 'GSWB' : (item.params.armorType === 'TCWB' ? 'TCWB' : 'Steel')))))));
        const armorWirePrice = (
          item.params.armorType === 'AWA' ? getPrice('AWA', getPrice('Al', 0)) : 
          item.params.armorType === 'SWA' ? getPrice('SWA', getPrice('SteelWire', 0)) : 
          item.params.armorType === 'SFA' ? getPrice('SFA', getPrice('SteelWire', 0)) : 
          item.params.armorType === 'RGB' ? getPrice('RGB', getPrice('SteelWire', 0)) : 
          item.params.armorType === 'GSWB' ? getPrice('GSWB', getPrice('SteelWire', 0)) : 
          item.params.armorType === 'TCWB' ? getPrice('TCWB', getPrice('TCu', 0)) : 
          getPrice('SteelWire', getPrice('Steel', 0))
        );
        const armorTapePrice = (item.params.armorType === 'ATA' ? getPrice('ATA', getPrice('Al', 0)) : getPrice('STA', getPrice('Steel', 0)));

        const sheathPrice = getPrice(item.params.sheathMaterial, getPrice('PVC', 0));
        const innerSemiPrice = getPrice('Inner Semi Conductive', 65000);
        const outerSemiPrice = getPrice('Outer Semi Conductive', 65000);
        const isMvCts = isMV && item.params.mvScreenType === 'CTS';
        const isLvCts = !isMV && item.params.screenType === 'CTS';
        const metScreenPrice = (isMvCts || isLvCts) ? getPrice('CTS', getPrice('Cu', 0)) : getPrice('Cu', 0);
        const separatorPrice = getPrice(item.params.separatorMaterial || 'PVC', getPrice('PVC', 0));

        const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
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

        const mvCabFactor = (isMV && item.params.cores > 1) ? 1.003 : 1.0;
        const lvCabFactor = item.params.cores > 1 ? 1.01 : 1.0;
        const inShCabFactor = (isMV && item.params.cores > 1) ? 1.01 : (item.params.cores > 1 ? lvCabFactor : 1.0);

        // General
        pushCol(index + 1);
        const totalCoresDisplay = isInstrumentation 
          ? (item.params.formationCount || 1) * (item.params.formationType === 'Triad' ? 3 : (item.params.formationType === 'Quad' ? 4 : 2)) 
          : item.params.cores;
        
        let coreCol = '';
        if (isInstrumentation) {
          coreCol = pushCol(totalCoresDisplay);
          pushCol(item.params.formationCount || 1);
        } else {
          coreCol = pushCol(item.params.cores);
        }
        
        const sizeVal = isInstrumentation ? (item.params.instrumentationSize || item.params.size) : item.params.size;
        const sizeCol = pushCol(sizeVal);
        
        // We will fill Laid-up Dia formula later once we know Core OD
        const laidUpDiaColIdx = colIdx;
        const laidUpDiaCol = getColName(colIdx++);
        row.push(null); // Placeholder for Laid-up Dia

        // Conductor
        const wiresCol = pushCol(item.result.spec.phaseCore.wireCount || 0);
        const wireDiaCol = pushCol(item.result.spec.phaseCore.wireDiameter || 0, fmtNum);
        
        const dcResCol = pushCol(item.result.electrical.maxDcResistance || 0, fmtNum);
        const rhoVal = CONDUCTOR_RESISTIVITY[item.params.conductorMaterial] || 17.241;
        const rhoCol = pushCol(rhoVal, fmtNum);

        let calcAreaFormula = `${wiresCol}${r}*PI()/4*POWER(${wireDiaCol}${r},2)`;
        let condOdFormula: string | null = null;
        if ((item.params.conductorType === 'sm' || item.params.conductorType === 'cm') && item.result.electrical.maxDcResistance > 0) {
          if (isMV) {
            calcAreaFormula = `${rhoCol}${r}/(${dcResCol}${r}/${mvCabFactor})*1.02`;
            condOdFormula = `POWER((${rhoCol}${r}/(${dcResCol}${r}/${mvCabFactor})*1.02)/((PI()/4)*0.89), 0.5)`;
          } else {
            calcAreaFormula = `${rhoCol}${r}/(${dcResCol}${r}/${lvCabFactor})*1.01`;
            condOdFormula = `POWER((${rhoCol}${r}/((${dcResCol}${r}/${lvCabFactor})*1.01)*${coreCol}${r})/((PI()/4)*0.9), 0.5)/2*0.99`;
          }
        } else if (item.params.conductorType === 'sm' || item.params.conductorType === 'cm') {
          const compactionFactor = item.params.conductorType === 'cm' ? 0.92 : 0.95;
          condOdFormula = `POWER((4*${getColName(colIdx)}${r})/(PI()*${compactionFactor}), 0.5)`;
        }
        const calcAreaCol = pushCol(null, fmtNum, calcAreaFormula);
        const condOdCol = condOdFormula 
          ? pushCol(null, fmtNum, condOdFormula.replace(getColName(colIdx - 1), calcAreaCol))
          : pushCol(item.result.spec.phaseCore.conductorDiameter || 0, fmtNum);
        
        let condWtFormula = `${calcAreaCol}${r}*${getDensity(item.params.conductorMaterial)}*${coreCol}${r}*1.008*${isInstrumentation ? '1.02' : '1.01'}*(1+${materialScrap[item.params.conductorMaterial] || 0}/100)`;
        if (isNFA2X || isNFA2XT) {
          condWtFormula = `${item.result.bom.conductorWeight - (item.result.bom.earthingConductorWeight || 0)}`;
        }
        const condWtCol = pushCol(null, fmtNum, condWtFormula);
        
        const condPrcCol = pushCol(condPrice, fmtRp);
        const condCstCol = pushCol(null, fmtRp, `${condWtCol}${r}*${condPrcCol}${r}/1000`);

        let currentDiaFormula = `${condOdCol}${r}`;

        // MGT
        let mgtCstCol;
        if (item.params.fireguard) {
          const mgtThkCol = pushCol(item.result.spec.mgtThickness || 0.2, fmtNum);
          const mgtWtCol = pushCol(item.result.bom.mgtWeight || 0, fmtNum);
          const mgtPrcCol = pushCol(getPrice(item.params.fireProofMaterial || 'MGT', 120000), fmtRp);
          mgtCstCol = pushCol(null, fmtRp, `${mgtWtCol}${r}*${mgtPrcCol}${r}/1000`);
          currentDiaFormula = `(${currentDiaFormula}+2*${mgtThkCol}${r})`;
        }

        // Cond Screen
        let cScrCstCol, cScrThkCol, cScrWtCol;
        if (isMV) {
          cScrThkCol = pushCol(item.result.spec.conductorScreenThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${cScrThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          const cScrFactor = isInstrumentation ? 1.02 : mvCabFactor;
          cScrWtCol = pushCol(null, fmtNum, `PI()*${cScrThkCol}${r}*(${currentDiaFormula}-2*${cScrThkCol}${r}+${cScrThkCol}${r})*${getDensity('Inner Semi Conductive')}*${coreCol}${r}*1.1*${cScrFactor}*(1+${materialScrap['Inner Semi Conductive'] || 0}/100)`);
          const cScrPrcCol = pushCol(innerSemiPrice, fmtRp);
          cScrCstCol = pushCol(null, fmtRp, `${cScrWtCol}${r}*${cScrPrcCol}${r}/1000`);
        }

        // Insulation
        const diaBeforeIns = currentDiaFormula;
        let insThkCol = "", insWtCol = "", insCstCol = "", insPrcCol = "";
        if (!isAAC) {
          insThkCol = pushCol(item.result.spec.phaseCore.insulationThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${insThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          
          // Only apply filling factor if there is no conductor screen
          const hasCondScreen = isMV && (item.result.spec.conductorScreenThickness || 0) > 0;
          const insulationFactor = (!hasCondScreen && item.params.conductorType !== 're') ? getWeightAdditionFactor(item.result.spec.phaseCore.wireCount || 7) : 0;
          
          // Adopsi rumus skala industri detail: ROUND ((([Diameter konduktor]+[Thickness Insul] ) xPI()x( [Thickness Insul]+([Diameter konduktor]x[getWeightAdditionFactor(wireCount)])x[berat jenis]x[jumlah core] x 1,01
          const insFormula = `(${diaBeforeIns}+${insThkCol}${r})*PI()*(${insThkCol}${r}+(${diaBeforeIns}*${insulationFactor}))`;

          const insFactor = isInstrumentation ? 1.02 : (isMV ? mvCabFactor : lvCabFactor);
          insWtCol = pushCol(null, fmtNum, `ROUND(${insFormula}*${getDensity(item.params.insulationMaterial)}*${coreCol}${r}*${insFactor}*(1+${materialScrap[item.params.insulationMaterial] || 0}/100), 2)`);
          insPrcCol = pushCol(insPrice, fmtRp);
          insCstCol = pushCol(null, fmtRp, `${insWtCol}${r}*${insPrcCol}${r}/1000`);
        }

        // Ins Screen
        let iScrCstCol, iScrThkCol, iScrWtCol;
        if (isMV) {
          iScrThkCol = pushCol(item.result.spec.insulationScreenThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${iScrThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          const iScrFactor = isInstrumentation ? 1.02 : mvCabFactor;
          iScrWtCol = pushCol(null, fmtNum, `PI()*${iScrThkCol}${r}*(${currentDiaFormula}-2*${iScrThkCol}${r}+${iScrThkCol}${r})*${getDensity('Outer Semi Conductive')}*${coreCol}${r}*${iScrFactor}*(1+${materialScrap['Outer Semi Conductive'] || 0}/100)`);
          const iScrPrcCol = pushCol(outerSemiPrice, fmtRp);
          iScrCstCol = pushCol(null, fmtRp, `${iScrWtCol}${r}*${iScrPrcCol}${r}/1000`);
        }

        // Met Screen (MV)
        let mScrCstCol, mScrThkCol, mScrWtCol;
        if (isMV && hasScreen) {
          if (item.params.mvScreenType === 'CTS') {
            const tapeThkCol = pushCol(item.params.manualMvScreenThickness || 0.1, fmtNum);
            
            let petThkCol = '';
            let petThkRef = '0';
            if (hasPetTapeInGroup) {
              petThkCol = pushCol(item.params.cores === 1 ? 0.05 : 0, fmtNum);
              petThkRef = `${petThkCol}${r}`;
            }
            
            currentDiaFormula = `(${currentDiaFormula}+2*(2*${tapeThkCol}${r}+2*${petThkRef}))`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            const mScrFactor = isInstrumentation ? 1.02 : mvCabFactor;
            const cuTapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${tapeThkCol}${r}-2*${petThkRef}+${tapeThkCol}${r})*${tapeThkCol}${r}*${getDensity('Cu')}*1.25*${coreCol}${r}*${mScrFactor}*(1+${materialScrap['Cu'] || 0}/100)`);
            
            let petTapeWtCol = '';
            let petTapeWtRef = '0';
            if (hasPetTapeInGroup) {
              petTapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${petThkRef}+${petThkRef})*${petThkRef}*${getDensity('Polyester Tape')}*1.25*${coreCol}${r}*${mScrFactor}*(1+${materialScrap['Polyester Tape'] || 0}/100)`);
              petTapeWtRef = `${petTapeWtCol}${r}`;
            }
            
            mScrWtCol = pushCol(null, fmtNum, `${cuTapeWtCol}${r}+${petTapeWtRef}`);
            const mScrPrcCol = pushCol(metScreenPrice, fmtRp); // Price of Cu
            mScrCstCol = pushCol(null, fmtRp, `(${cuTapeWtCol}${r}*${mScrPrcCol}${r} + ${petTapeWtRef}*${getPrice('Polyester Tape', 0)})/1000`);
          } else {
            const sizeCol = pushCol(item.params.mvScreenSize || 0, fmtNum); // Size
            const wireDia = (item.params.mvScreenSize || 16) <= 35 ? 0.66 : 1.35;
            const wireDiaCol = pushCol(item.params.manualMvScreenWireDiameter || wireDia, fmtNum);
            const wireCountCol = pushCol(null, fmtNum, `CEILING(${sizeCol}${r} / (PI() * POWER(${wireDiaCol}${r} / 2, 2)), 1)`); // Wire Count
            
            const tapeThkCol = pushCol(0.1, fmtNum);
            
            let petThkCol = '';
            let petThkRef = '0';
            if (hasPetTapeInGroup) {
              petThkCol = pushCol(item.params.cores === 1 ? 0.05 : 0, fmtNum);
              petThkRef = `${petThkCol}${r}`;
            }
            
            currentDiaFormula = `(${currentDiaFormula}+2*(${wireDiaCol}${r}+${tapeThkCol}${r}+2*${petThkRef}))`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            const mScrFactor = isInstrumentation ? 1.02 : mvCabFactor;
            const cuWireWtCol = pushCol(null, fmtNum, `${wireCountCol}${r}*(PI()*POWER(${wireDiaCol}${r}/2,2))*${getDensity('Cu')}*1.05*${coreCol}${r}*${mScrFactor}*(1+${materialScrap['Cu'] || 0}/100)`);
            const cuTapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${tapeThkCol}${r}-2*${petThkRef}+${tapeThkCol}${r})*${tapeThkCol}${r}*${getDensity('Cu')}*0.25*1.05*${coreCol}${r}*${mScrFactor}*(1+${materialScrap['Cu'] || 0}/100)`);
            
            let petTapeWtCol = '';
            let petTapeWtRef = '0';
            if (hasPetTapeInGroup) {
              petTapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${petThkRef}+${petThkRef})*${petThkRef}*${getDensity('Polyester Tape')}*1.25*${coreCol}${r}*${mScrFactor}*(1+${materialScrap['Polyester Tape'] || 0}/100)`);
              petTapeWtRef = `${petTapeWtCol}${r}`;
            }
            
            mScrWtCol = pushCol(null, fmtNum, `${cuWireWtCol}${r}+${cuTapeWtCol}${r}+${petTapeWtRef}`);
            const mScrPrcCol = pushCol(metScreenPrice, fmtRp); // Price of Cu for wire
            const ctsPrc = getPrice('CTS', getPrice('Cu', 0));
            mScrCstCol = pushCol(null, fmtRp, `(${cuWireWtCol}${r}*${mScrPrcCol}${r} + ${cuTapeWtCol}${r}*${ctsPrc} + ${petTapeWtRef}*${getPrice('Polyester Tape', 0)})/1000`);
          }
        }

        // Now we have Core OD in currentDiaFormula. Let's set Laid-up Dia formula.
        const coreDiaFormula = currentDiaFormula;
        const totalCores = item.params.cores + (item.params.earthingCores || 0);
        let layUpFactor = getLayingUpFactor(totalCores);
        
        if (isInstrumentation) {
          const isMultiplier = item.result.bom.isMultiplier || 1;
          if (INSTRUMENT_FACTORS[isMultiplier]) {
            layUpFactor = INSTRUMENT_FACTORS[isMultiplier];
          } else {
            // Fallback to calculated factor from result for complex instrumentation cases
            layUpFactor = item.result.spec.laidUpDiameter / (item.result.spec.mvScreenDiameter || item.result.spec.coreDiameter || 1);
          }
        }
        
        // Use diameterOverScreen for MV cables in Excel formula if available
        let baseDiaFormula = currentDiaFormula;
        row[laidUpDiaColIdx] = { t: 'n', f: `${baseDiaFormula}*${layUpFactor.toFixed(3)}`, z: fmtNum };
        currentDiaFormula = `${laidUpDiaCol}${r}`;

        // Earth
        let earthCstCol, earthInsCstCol, earthWtCol, earthInsWtCol;
        if (hasEarth) {
          const earthSizeCol = pushCol(item.params.earthingSize || 0, fmtNum);
          if (isNFA2XT) {
            const alWiresCol = pushCol(item.result.spec.earthingCore?.alWireCount || 0);
            const alDiaCol = pushCol(item.result.spec.earthingCore?.alWireDiameter || 0, fmtNum);
            const stWiresCol = pushCol(item.result.spec.earthingCore?.steelWireCount || 0);
            const stDiaCol = pushCol(item.result.spec.earthingCore?.steelWireDiameter || 0, fmtNum);
            const earthCondOdCol = pushCol(item.result.spec.earthingCore?.conductorDiameter || 0, fmtNum);
            
            earthWtCol = pushCol(null, fmtNum, `(PI()*(${alDiaCol}${r}/2)^2*${alWiresCol}${r}*${getDensity('Al')}*(1+${materialScrap['Al'] || 0}/100) + PI()*(${stDiaCol}${r}/2)^2*${stWiresCol}${r}*${getDensity('SteelWire')}*(1+${materialScrap['SteelWire'] || 0}/100))*1.05*1.008*1.01`);
            if (item.result.bom.earthingAlWeight !== undefined && item.result.bom.earthingSteelWeight !== undefined) {
              earthCstCol = pushCol(null, fmtRp, `(${item.result.bom.earthingAlWeight}*${getPrice('Al', 0)}+${item.result.bom.earthingSteelWeight}*${getPrice('SteelWire', 0)})/1000`);
            } else {
              earthCstCol = pushCol(null, fmtRp, `${earthWtCol}${r}*${condPrcCol}${r}/1000`);
            }
          } else {
            const earthWiresCol = pushCol(item.result.spec.earthingCore?.wireCount || 0);
            const earthWireDiaCol = pushCol(item.result.spec.earthingCore?.wireDiameter || 0, fmtNum);
            let earthCalcAreaFormula = `${earthWiresCol}${r}*PI()/4*POWER(${earthWireDiaCol}${r},2)`;
            if ((item.params.conductorType === 'sm' || item.params.conductorType === 'cm') && item.result.electrical.earthingMaxDcResistance && item.result.electrical.earthingMaxDcResistance > 0) {
              const rho = CONDUCTOR_RESISTIVITY[item.params.conductorMaterial] || 17.241;
              earthCalcAreaFormula = `${rho}/(${item.result.electrical.earthingMaxDcResistance}/${lvCabFactor})*1.01`;
            }
            const earthCalcAreaCol = pushCol(null, fmtNum, earthCalcAreaFormula);
            const earthCondOdCol = pushCol(item.result.spec.earthingCore?.conductorDiameter || 0, fmtNum);
            earthWtCol = pushCol(null, fmtNum, `${earthCalcAreaCol}${r}*${getDensity(item.params.conductorMaterial)}*${item.params.earthingCores || 1}*1.008*${isInstrumentation ? '1.02' : '1.01'}*(1+${materialScrap[item.params.conductorMaterial] || 0}/100)`);
            earthCstCol = pushCol(null, fmtRp, `${earthWtCol}${r}*${condPrcCol}${r}/1000`);
          }
          
          const earthInsThkCol = pushCol(item.result.spec.earthingCore?.insulationThickness || 0, fmtNum);
          let earthCurrentDiaFormula = `(${getColName(colIdx - 4)}${r})`;
          const earthingInsFactor = item.params.conductorType !== 're' ? getWeightAdditionFactor(item.result.spec.earthingCore?.wireCount || 7) : 0;
          
          // Adopsi rumus skala industri detail: ROUND ((([Diameter konduktor]+[Thickness Insul] ) xPI()x( [Thickness Insul]+([Diameter konduktor]x[getWeightAdditionFactor(wireCount)])x[berat jenis]x[jumlah core] x 1,01
          earthInsWtCol = pushCol(null, fmtNum, `ROUND((${earthCurrentDiaFormula}+${earthInsThkCol}${r})*PI()*(${earthInsThkCol}${r}+(${earthCurrentDiaFormula}*${earthingInsFactor}))*${getDensity(item.params.insulationMaterial)}*${item.params.earthingCores || 1}*${isInstrumentation ? '1.02' : '1.01'}*(1+${materialScrap[item.params.insulationMaterial] || 0}/100), 2)`);
          earthInsCstCol = pushCol(null, fmtRp, `${earthInsWtCol}${r}*${insPrcCol}${r}/1000`);
        }

        // IS
        let isCstCol, isAlWtCol, isDrainWtCol, isPetWtCol;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) {
          const isMultiplier = item.result.bom.isMultiplier || 1;
          const pairTriadFactor = item.params.formationType === 'Triad' ? 2.15 : (item.params.formationType === 'Pair' ? 2 : 1);
          let isDiaFormula = `(${coreDiaFormula}*${pairTriadFactor})`;

          pushCol(isMultiplier, fmtNum); // Al Foil Qty
          const isAlThkCol = pushCol(item.params.manualIsAluminiumThickness || item.result.spec.aluminiumThickness || 0.05, fmtNum); // Al Foil Thk
          const isAlOverlap = item.params.manualIsAluminiumOverlap !== undefined ? item.params.manualIsAluminiumOverlap : 25;
          isDiaFormula = `(${isDiaFormula}+${isAlOverlap > 0 ? 4 : 2}*${isAlThkCol}${r})`;
          pushCol(null, fmtNum, isDiaFormula); // OD
          isAlWtCol = pushCol(null, fmtNum, `PI()*(${isDiaFormula}-${isAlOverlap > 0 ? 2 : 1}*${isAlThkCol}${r})*${isAlThkCol}${r}*${getDensity('Al')}*(1+${isAlOverlap}/100)*${isMultiplier}*1.02*(1+${materialScrap['Al'] || 0}/100)`);
          const isAlPrcCol = pushCol(getPrice('Aluminium Foil', getPrice('Al', 0)), fmtRp);
          const isDrainCount = item.params.manualIsDrainWireCount || 17;
          pushCol(isDrainCount * isMultiplier, fmtNum); // Drain Wire Qty
          const isDrainDia = item.params.manualIsDrainWireDiameter || 0.2;
          const defaultDrainSize = Math.PI * Math.pow(isDrainDia / 2, 2);
          const drainSizeCol = pushCol(item.params.manualIsDrainWireSize || item.result.spec.drainWireSize || defaultDrainSize, fmtNum); // Drain Size (mm2)
          isDrainWtCol = pushCol(null, fmtNum, `${drainSizeCol}${r}*${getDensity('TCu')}*1.02*${isMultiplier}*(1+${materialScrap['TCu'] || 0}/100)`);
          const isDrainPrcCol = pushCol(getPrice('TCu', getPrice('Cu', 0)), fmtRp);
          pushCol(isMultiplier, fmtNum); // PET Tape Qty
          const isPetThkCol = pushCol(item.params.manualIsPolyesterThickness || item.result.spec.polyesterTapeThickness || 0.05, fmtNum); // PET Thk
          const isPetOverlap = item.params.manualIsPolyesterOverlap !== undefined ? item.params.manualIsPolyesterOverlap : 25;
          isDiaFormula = `(${isDiaFormula}+${isPetOverlap > 0 ? 4 : 2}*${isPetThkCol}${r})`;
          const isPetWtFormula = `PI()*(${isDiaFormula}-${isPetOverlap > 0 ? 2 : 1}*${isPetThkCol}${r})*${isPetThkCol}${r}*${getDensity('Polyester Tape')}*(1+${isPetOverlap}/100)*2*${isMultiplier}*1.02*(1+${materialScrap['Polyester Tape'] || 0}/100)`;
          isPetWtCol = pushCol(null, fmtNum, isPetWtFormula);
          const isPetPrcCol = pushCol(getPrice('Polyester Tape', 10000), fmtRp);
          isCstCol = pushCol(null, fmtRp, `(${isAlWtCol}${r}*${isAlPrcCol}${r} + ${isDrainWtCol}${r}*${isDrainPrcCol}${r} + ${isPetWtCol}${r}*${isPetPrcCol}${r})/1000`);
        }

        // OS
        let osCstCol, osAlWtCol, osDrainWtCol, osPetWtCol;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) {
          pushCol(1, fmtNum); // Al Foil Qty
          const osAlThkCol = pushCol(item.params.manualOsAluminiumThickness || item.result.spec.aluminiumThickness || 0.05, fmtNum); // Al Foil Thk
          const osAlOverlap = item.params.manualOsAluminiumOverlap !== undefined ? item.params.manualOsAluminiumOverlap : 25;
          currentDiaFormula = `(${currentDiaFormula}+${osAlOverlap > 0 ? 4 : 2}*${osAlThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          osAlWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${osAlOverlap > 0 ? 2 : 1}*${osAlThkCol}${r})*${osAlThkCol}${r}*${getDensity('Al')}*(1+${osAlOverlap}/100)*1.02*(1+${materialScrap['Al'] || 0}/100)`);
          const osAlPrcCol = pushCol(getPrice('Aluminium Foil', getPrice('Al', 0)), fmtRp);
          const osDrainCount = item.params.manualOsDrainWireCount || 17;
          pushCol(osDrainCount, fmtNum); // Drain Wire Qty
          const osDrainDia = item.params.manualOsDrainWireDiameter || 0.2;
          const defaultOsDrainSize = Math.PI * Math.pow(osDrainDia / 2, 2);
          const drainSizeCol = pushCol(item.params.manualOsDrainWireSize || item.result.spec.drainWireSize || defaultOsDrainSize, fmtNum); // Drain Size (mm2)
          osDrainWtCol = pushCol(null, fmtNum, `${drainSizeCol}${r}*${getDensity('TCu')}*1.02*(1+${materialScrap['TCu'] || 0}/100)`);
          const osDrainPrcCol = pushCol(getPrice('TCu', getPrice('Cu', 0)), fmtRp);
          pushCol(1, fmtNum); // PET Tape Qty
          const osPetThkCol = pushCol(item.params.manualOsPolyesterThickness || item.result.spec.polyesterTapeThickness || 0.05, fmtNum); // PET Thk
          const osPetOverlap = item.params.manualOsPolyesterOverlap !== undefined ? item.params.manualOsPolyesterOverlap : 25;
          currentDiaFormula = `(${currentDiaFormula}+${osPetOverlap > 0 ? 4 : 2}*${osPetThkCol}${r})`;
          osPetWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${osPetOverlap > 0 ? 2 : 1}*${osPetThkCol}${r})*${osPetThkCol}${r}*${getDensity('Polyester Tape')}*(1+${osPetOverlap}/100)*2*1.02*(1+${materialScrap['Polyester Tape'] || 0}/100)`);
          const osPetPrcCol = pushCol(getPrice('Polyester Tape', 10000), fmtRp);
          osCstCol = pushCol(null, fmtRp, `(${osAlWtCol}${r}*${osAlPrcCol}${r} + ${osDrainWtCol}${r}*${osDrainPrcCol}${r} + ${osPetWtCol}${r}*${osPetPrcCol}${r})/1000`);
        }

        // Binder Tape
        let btCstCol, btThkCol, btWtCol;
        if (hasBinderTape) {
          const itemHasBinderTape = item.params.conductorType === 'sm' && item.params.cores > 1;
          btThkCol = pushCol(itemHasBinderTape ? (item.result.spec.binderTapeThickness || 0.05) : 0, fmtNum);
          const btOverlap = 25;
          currentDiaFormula = `(${currentDiaFormula}+${btOverlap > 0 ? 4 : 2}*${btThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          const btDensity = getDensity('Polyester Tape');
          btWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${btOverlap > 0 ? 2 : 1}*${btThkCol}${r})*${btThkCol}${r}*${btDensity}*(1+${btOverlap}/100)*(1+${materialScrap['Polyester Tape'] || 0}/100)`);
          const btPrcCol = pushCol(getPrice('Polyester Tape', 10000), fmtRp);
          btCstCol = pushCol(null, fmtRp, `${btWtCol}${r}*${btPrcCol}${r}/1000`);
        }

        // Inner Sheath
        let inShCstCol, inShThkCol, inShWtCol;
        if (hasInnerSheath) {
          inShThkCol = pushCol(item.result.spec.innerCoveringThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${inShThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          
          let fillerFactor = item.params.standard === 'BS EN 50288-7' ? 0 : 0.85;
          if (item.params.conductorType === 'sm' || item.params.conductorType === 'cm') fillerFactor = 0;
          const totalCores = item.params.cores + (item.params.hasEarthing !== false ? (item.params.earthingCores || 0) : 0);
          // For sector conductors (sm), the weight addition factor is not used for inner sheath as per user request
          const innerSheathFactor = (item.params.conductorType === 'sm' || item.params.conductorType === 'cm') ? 0 : getWeightAdditionFactor(totalCores);
          
          // Complex formula to match ringArea + intersticeArea * fillerFactor
          const rLaidUp = item.result.spec.laidUpDiameter / 2;
          const rUnderArmor = item.result.spec.diameterUnderArmor / 2;
          const phaseCoreAreaTotal = item.params.cores * Math.PI * Math.pow((item.result.spec.coreDiameter || 0) / 2, 2);
          const earthingCoreAreaTotal = (item.params.hasEarthing !== false ? (item.params.earthingCores || 0) : 0) * Math.PI * Math.pow((item.result.spec.earthingCore?.coreDiameter || 0) / 2, 2);
          const coreAreaTotal = phaseCoreAreaTotal + earthingCoreAreaTotal;
          const laidUpArea = Math.PI * Math.pow(item.result.spec.laidUpDiameter / 2, 2);
          let intersticeArea = Math.max(0, laidUpArea - coreAreaTotal);
          // Reduction for sector shape (sm) - gaps are much smaller
          if (item.params.conductorType === 'sm' || item.params.conductorType === 'cm') intersticeArea = 0;
          
          const ringArea = Math.PI * (Math.pow(rUnderArmor, 2) - Math.pow(rLaidUp, 2));
          
          // We use the calculated values for interstice and ring area to keep the formula manageable
          const baseArea = ringArea + (intersticeArea * fillerFactor);
          
          const inShAreaFormula = isMV ? ringArea.toFixed(4) : baseArea.toFixed(4);
          inShWtCol = pushCol(null, fmtNum, `${inShAreaFormula}*${getDensity(item.params.innerSheathMaterial || 'PVC')}*(1+${materialScrap[item.params.innerSheathMaterial || 'PVC'] || 0}/100)*(1+${innerSheathFactor})*${inShCabFactor}`);
          const inShPrcCol = pushCol(innerPrice, fmtRp);
          inShCstCol = pushCol(null, fmtRp, `${inShWtCol}${r}*${inShPrcCol}${r}/1000`);
        }

        // Met Screen (LV)
        if (!isMV && !isInstrumentation && hasScreen) {
          if (item.params.screenType === 'CTS') {
            const tapeThkCol = pushCol(0.1, fmtNum); // Cu Tape Thk (mm)
            const petThkCol = pushCol(0.05, fmtNum); // PET Tape Thk (mm)
            
            const totalRadialThk = (2 * 0.1) + (2 * 0.05);
            currentDiaFormula = `(${currentDiaFormula}+2*${totalRadialThk})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            const cuTapeWtCol = pushCol(item.result.bom.copperTapeWeight || 0, fmtNum);
            const petTapeWtCol = pushCol(item.result.bom.polyesterTapeWeight || 0, fmtNum);
            
            mScrWtCol = pushCol(null, fmtNum, `${cuTapeWtCol}${r}+${petTapeWtCol}${r}`);
            
            const ctsPrc = getPrice('CTS', getPrice('Cu', 0));
            const petPrc = getPrice('Polyester Tape', 10000);
            const mScrPrcCol = pushCol(ctsPrc, fmtRp);
            mScrCstCol = pushCol(null, fmtRp, `(${cuTapeWtCol}${r}*${mScrPrcCol}${r} + ${petTapeWtCol}${r}*${petPrc})/1000`);
          } else {
            const cwsSize = item.params.screenSize || (item.params.standard === 'SPLN 43-4 (NYCY)' ? Number(item.params.size) : 16);
            const wireDia = CWS_WIRE_DIAMETERS[cwsSize] || 0.8;
            mScrThkCol = pushCol(wireDia, fmtNum); // Dia Wire Screen (mm)
            
            pushCol(0.1, fmtNum); // Copper Tape Thickness (mm)
            pushCol(0.05, fmtNum); // Polyester Tape Thickness (mm)
            
            const totalRadialThk = wireDia + 0.1 + (2 * 0.05);
            currentDiaFormula = `(${currentDiaFormula}+2*${totalRadialThk})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            const cuWireWtCol = pushCol(item.result.bom.copperWireWeight || 0, fmtNum);
            const cuTapeWtCol = pushCol(item.result.bom.copperTapeWeight || 0, fmtNum);
            const petTapeWtCol = pushCol(item.result.bom.polyesterTapeWeight || 0, fmtNum);
            
            mScrWtCol = pushCol(null, fmtNum, `${cuWireWtCol}${r}+${cuTapeWtCol}${r}+${petTapeWtCol}${r}`);
            
            const mScrPrcCol = pushCol(metScreenPrice, fmtRp); // Using Cu price for the wire
            const ctsPrc = getPrice('CTS', getPrice('Cu', 0));
            const petPrc = getPrice('Polyester Tape', 10000);
            mScrCstCol = pushCol(null, fmtRp, `(${cuWireWtCol}${r}*${mScrPrcCol}${r} + ${cuTapeWtCol}${r}*${ctsPrc} + ${petTapeWtCol}${r}*${petPrc})/1000`);
          }
        }

        // Separator
        let sepCstCol, sepThkCol, sepWtCol;
        if (hasSeparator) {
          sepThkCol = pushCol(item.result.spec.separatorThickness || 0, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${sepThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          sepWtCol = pushCol(null, fmtNum, `PI()*${sepThkCol}${r}*(${currentDiaFormula}-2*${sepThkCol}${r}+${sepThkCol}${r})*${getDensity(item.params.separatorMaterial || 'PVC')}*(1+${materialScrap[item.params.separatorMaterial || 'PVC'] || 0}/100)`);
          const sepPrcCol = pushCol(separatorPrice, fmtRp);
          sepCstCol = pushCol(null, fmtRp, `${sepWtCol}${r}*${sepPrcCol}${r}/1000`);
        }

        // Armor
        let armCstCol, armThkCol, armWtCol;
        if (hasArmor) {
          if (item.params.armorType === 'STA') {
            const diaBeforeArmorFormula = currentDiaFormula;
            armThkCol = pushCol(null, fmtNum, `IF(${diaBeforeArmorFormula}<=30,0.3,IF(${diaBeforeArmorFormula}<=70,0.5,0.8))`);
            const overlapCol = pushCol(item.result.spec.staOverlap || 25, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+4*${armThkCol}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            armWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${armThkCol}${r})*2*${armThkCol}${r}*${getDensity('Steel')}*1.02*(1+${overlapCol}${r}/100)*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap['Steel'] || 0}/100)`);
            const armPrcCol = pushCol(armorTapePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `${armWtCol}${r}*${armPrcCol}${r}/1000`);
          } else if (item.params.armorType === 'SWA' || item.params.armorType === 'AWA') {
            armThkCol = pushCol(item.result.spec.armorWireDiameter || 0, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+2*${armThkCol}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            const densityKey = item.params.armorType === 'AWA' ? 'Al' : 'SteelWire';
            armWtCol = pushCol(null, fmtNum, `INT(PI()*(${currentDiaFormula}-${armThkCol}${r})/(${armThkCol}${r}*1.05))*PI()*POWER(${armThkCol}${r}/2,2)*${getDensity(densityKey)}*1.05*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap[densityKey] || 0}/100)`);
            const armPrcCol = pushCol(armorWirePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `${armWtCol}${r}*${armPrcCol}${r}/1000`);
          } else if (item.params.armorType === 'SFA') {
            const flatThkCol = pushCol(item.result.spec.armorFlatThickness || 0, fmtNum);
            const tapeThkCol = pushCol(item.result.spec.armorTapeThickness || 0, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+2*(${flatThkCol}${r}+${tapeThkCol}${r}))`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            const flatWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-2*${tapeThkCol}${r}-${flatThkCol}${r})*${flatThkCol}${r}*${getDensity('SFA')}*0.9*1.02*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap['SFA'] || 0}/100)`);
            const tapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${tapeThkCol}${r})*${tapeThkCol}${r}*${getDensity('SFA')}*(1/3)*1.02*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap['SFA'] || 0}/100)`);
            const flatPrcCol = pushCol(armorWirePrice, fmtRp);
            const tapePrcCol = pushCol(armorTapePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `(${flatWtCol}${r}*${flatPrcCol}${r}+${tapeWtCol}${r}*${tapePrcCol}${r})/1000`);
          } else if (item.params.armorType === 'RGB') {
            const wireDiaCol = pushCol(item.result.spec.armorWireDiameter || 0, fmtNum);
            const tapeThkCol = pushCol(item.result.spec.armorTapeThickness || 0, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+2*(${wireDiaCol}${r}+${tapeThkCol}${r}))`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            const wireWtCol = pushCol(null, fmtNum, `INT(PI()*(${currentDiaFormula}-2*${tapeThkCol}${r}-${wireDiaCol}${r})/(${wireDiaCol}${r}*1.05))*PI()*POWER(${wireDiaCol}${r}/2,2)*${getDensity('RGB')}*1.05*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap['RGB'] || 0}/100)`);
            const tapeWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${tapeThkCol}${r})*${tapeThkCol}${r}*${getDensity('RGB')}*(1/3)*1.02*${isMV ? mvCabFactor : lvCabFactor}*(1+${materialScrap['RGB'] || 0}/100)`);
            const wirePrcCol = pushCol(armorWirePrice, fmtRp);
            const tapePrcCol = pushCol(armorTapePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `(${wireWtCol}${r}*${wirePrcCol}${r}+${tapeWtCol}${r}*${tapePrcCol}${r})/1000`);
          } else if (item.params.armorType === 'GSWB' || item.params.armorType === 'TCWB') {
            const wireDiaCol = pushCol(item.result.spec.armorWireDiameter || 0, fmtNum);
            const carriersCol = pushCol(item.result.spec.gswbCarriers || 0, fmtNum);
            const wiresPerCarrierCol = pushCol(item.result.spec.gswbWiresPerCarrier || 0, fmtNum);
            
            // Braid Pitch Formula: L = (PI * D) / tan(alpha)
            const diaUnderArmorFormula = currentDiaFormula;
            const meanDiaFormula = `(${diaUnderArmorFormula}+${wireDiaCol}${r})`;
            
            // Calculate actual alphaRad used in the design
            const meanDia = item.result.spec.diameterUnderArmor + (item.result.spec.armorWireDiameter || 0);
            const layPitch = item.result.spec.gswbLayPitch || ((Math.PI * meanDia) / Math.tan(45 * Math.PI / 180));
            const alphaRad = Math.atan((Math.PI * meanDia) / layPitch);
            
            const tanAlpha = Math.tan(alphaRad).toFixed(4);
            const cosAlpha = Math.cos(alphaRad).toFixed(4);
            const layFactor = (1 / Math.cos(alphaRad)).toFixed(4);

            pushCol(null, fmtNum, `PI()*${meanDiaFormula}/${tanAlpha}`); // Lay Pitch
            
            // Coverage Formula: K = (2p - p^2) * 100 where p = (n*m*d)/(2*PI*D*cos(alpha))
            const pFormula = `(${wiresPerCarrierCol}${r}*${carriersCol}${r}*${wireDiaCol}${r})/(2*PI()*${meanDiaFormula}*${cosAlpha})`;
            pushCol(null, fmtNum, `(2*${pFormula}-POWER(${pFormula},2))*100`); // Coverage
            
            currentDiaFormula = `(${currentDiaFormula}+4*${wireDiaCol}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            
            const densityKey = item.params.armorType === 'TCWB' ? 'TCu' : 'SteelWire';
            // Weight Formula: W = (n * m * PI * d^2 / 4) * density * layFactor
            armWtCol = pushCol(null, fmtNum, `(${wiresPerCarrierCol}${r}*${carriersCol}${r}*PI()*POWER(${wireDiaCol}${r}/2,2))*${getDensity(densityKey)}*${layFactor}*(1+${materialScrap[densityKey] || 0}/100)`);
            const armPrcCol = pushCol(armorWirePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `${armWtCol}${r}*${armPrcCol}${r}/1000`);
          } else {
            armThkCol = pushCol(item.result.spec.armorThickness || 0, fmtNum);
            currentDiaFormula = `(${currentDiaFormula}+2*${armThkCol}${r})`;
            pushCol(null, fmtNum, currentDiaFormula); // OD
            armWtCol = pushCol(item.result.bom.armorWeight || 0, fmtNum);
            const armPrcCol = pushCol(armorWirePrice, fmtRp);
            armCstCol = pushCol(null, fmtRp, `${armWtCol}${r}*${armPrcCol}${r}/1000`);
          }
        }

        // Binder Tape Over Armor
        let btArmCstCol, btArmThkCol, btArmWtCol;
        const hasBinderTapeOverArmor = item.params.armorType === 'SWA' || item.params.armorType === 'AWA';
        if (hasBinderTapeOverArmor) {
          btArmThkCol = pushCol(item.result.spec.binderTapeOverArmorThickness || 0.05, fmtNum);
          currentDiaFormula = `(${currentDiaFormula}+2*${btArmThkCol}${r})`;
          pushCol(null, fmtNum, currentDiaFormula); // OD
          const btArmOverlap = 25;
          const btArmDensity = getDensity('Polyester Tape');
          btArmWtCol = pushCol(null, fmtNum, `PI()*(${currentDiaFormula}-${btArmThkCol}${r})*${btArmThkCol}${r}*${btArmDensity}*(1+${btArmOverlap}/100)*(1+${materialScrap['Polyester Tape'] || 0}/100)`);
          const btArmPrcCol = pushCol(getPrice('Polyester Tape', 10000), fmtRp);
          btArmCstCol = pushCol(null, fmtRp, `${btArmWtCol}${r}*${btArmPrcCol}${r}/1000`);
        }

        // Outer Sheath
        let outShCstCol, outShThkCol, overallDiaCol, outShWtCol;
        if (hasOuterSheath) {
          outShThkCol = pushCol(item.result.spec.sheathThickness || 0, fmtNum);
          overallDiaCol = pushCol(null, fmtNum, `${currentDiaFormula}+2*${outShThkCol}${r}`);
          const outShCabFactor = (isMV && item.params.cores > 1) ? 1.0 : (item.params.cores > 1 ? lvCabFactor : 1.0);
          outShWtCol = pushCol(null, fmtNum, `PI()*${outShThkCol}${r}*(${currentDiaFormula}+${outShThkCol}${r})*${getDensity(item.params.sheathMaterial)}*(1+${materialScrap[item.params.sheathMaterial] || 0}/100)*${outShCabFactor}`);
          const outShPrcCol = pushCol(sheathPrice, fmtRp);
          outShCstCol = pushCol(null, fmtRp, `${outShWtCol}${r}*${outShPrcCol}${r}/1000`);
        }

        // Masterbatch
        let mbWtCol, mbCstCol;
        if (!isMV && !isAAC) {
          let mbWtFormula = `(${insWtCol}${r}*0.02)`;
          if (hasEarth) mbWtFormula += `+(${earthInsWtCol}${r}*0.02)`;
          if (hasInnerSheath) mbWtFormula += `+(${inShWtCol}${r}*0.02)`;
          if (hasSeparator) mbWtFormula += `+(${sepWtCol}${r}*0.02)`;
          if (hasOuterSheath) mbWtFormula += `+(${outShWtCol}${r}*0.02)`;
          mbWtCol = pushCol(null, fmtNum, mbWtFormula);
          const mbPrcCol = pushCol(getPrice('Masterbatch', 50000), fmtRp);
          mbCstCol = pushCol(null, fmtRp, `${mbWtCol}${r}*${mbPrcCol}${r}/1000`);
        }

        // Summary
        const packCstCol = pushCol(packingCost, fmtRp);
        
        let baseHppFormula = `${condCstCol}${r}+${isAAC ? "0" : `${insCstCol}${r}`}`;
        if (item.params.fireguard) baseHppFormula += `+${mgtCstCol}${r}`;
        if (isMV) baseHppFormula += `+${cScrCstCol}${r}+${iScrCstCol}${r}`;
        if (hasScreen) baseHppFormula += `+${mScrCstCol}${r}`;
        if (hasEarth) baseHppFormula += `+${earthCstCol}${r}+${earthInsCstCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) baseHppFormula += `+${isCstCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) baseHppFormula += `+${osCstCol}${r}`;
        if (hasBinderTape) baseHppFormula += `+${btCstCol}${r}`;
        if (hasInnerSheath) baseHppFormula += `+${inShCstCol}${r}`;
        if (hasSeparator) baseHppFormula += `+${sepCstCol}${r}`;
        if (hasArmor) baseHppFormula += `+${armCstCol}${r}`;
        if (hasBinderTapeOverArmor) baseHppFormula += `+${btArmCstCol}${r}`;
        if (hasOuterSheath) baseHppFormula += `+${outShCstCol}${r}`;
        if (!isMV) {
          baseHppFormula += `+${isAAC ? "0" : `${mbCstCol}${r}`}`;
        } else {
          const masterbatchCost = (item.result.bom.masterbatchWeight || 0) * (getPrice('Masterbatch', 50000) / 1000);
          baseHppFormula += `+${masterbatchCost.toFixed(2)}`;
        }
        baseHppFormula += `+${packCstCol}${r}`;

        const baseHppCol = pushCol(null, fmtRp, baseHppFormula);
        const ohCol = pushCol(item.params.overhead || 0, fmtNum);
        const hppCol = pushCol(null, fmtRp, `${baseHppCol}${r}*(1+${ohCol}${r}/100)`);
        const mgCol = pushCol(item.params.margin || 0, fmtNum);
        const sellPrcCol = pushCol(null, fmtRp, `ROUNDUP(${hppCol}${r}/(1-${mgCol}${r}/100),-2)`);

        sheetsData[sheetName].push(row);

        // Add to summary sheet
        const sumRow = summaryDataAOA.length + 1;
        
        // Calculate Total Weight Formula for Summary Sheet
        let totalWtFormula = `'${sheetName}'!${condWtCol}${r}`;
        if (isMV) totalWtFormula += `+'${sheetName}'!${cScrWtCol}${r}+'${sheetName}'!${iScrWtCol}${r}`;
        if (!isAAC) totalWtFormula += `+'${sheetName}'!${insWtCol}${r}`;
        if (hasScreen) totalWtFormula += `+'${sheetName}'!${mScrWtCol}${r}`;
        if (hasEarth) totalWtFormula += `+'${sheetName}'!${earthWtCol}${r}+'${sheetName}'!${earthInsWtCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasIndividualScreen) totalWtFormula += `+'${sheetName}'!${isAlWtCol}${r}+'${sheetName}'!${isDrainWtCol}${r}+'${sheetName}'!${isPetWtCol}${r}`;
        if (isInstrumentation && sampleItem.params.hasOverallScreen) totalWtFormula += `+'${sheetName}'!${osAlWtCol}${r}+'${sheetName}'!${osDrainWtCol}${r}+'${sheetName}'!${osPetWtCol}${r}`;
        if (hasBinderTape) totalWtFormula += `+'${sheetName}'!${btWtCol}${r}`;
        if (hasInnerSheath) totalWtFormula += `+'${sheetName}'!${inShWtCol}${r}`;
        if (hasSeparator) totalWtFormula += `+'${sheetName}'!${sepWtCol}${r}`;
        if (hasArmor) totalWtFormula += `+'${sheetName}'!${armWtCol}${r}`;
        if (hasOuterSheath) totalWtFormula += `+'${sheetName}'!${outShWtCol}${r}`;
        if (!isMV && !isAAC) {
          totalWtFormula += `+'${sheetName}'!${mbWtCol}${r}`;
        } else if (!isMV) {
          totalWtFormula += `+0`;
        } else {
          totalWtFormula += `+${item.result.bom.masterbatchWeight || 0}`;
        }

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

    const filename = `${projectNumber ? projectNumber + '_' : ''}${projectName || 'Cable_Project'}.xlsx`;
    try {
      if ('showSaveFilePicker' in window && window.self === window.top) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'Excel File',
            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
          }],
        });
        const writable = await handle.createWritable();
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        await writable.write(buffer);
        await writable.close();
        alert(`File berhasil disimpan di lokasi yang Anda pilih.`);
      } else {
        XLSX.writeFile(wb, filename);
        alert(`File berhasil diunduh ke folder Downloads default Anda.`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Gagal menyimpan file Excel.');
      }
    }
  };

  const handleCreateLocalDB = async () => {
    // Check if we are in an iframe or if showSaveFilePicker is not supported
    const isIframe = window.self !== window.top;
    const supportsPicker = 'showSaveFilePicker' in window;

    if (isIframe || !supportsPicker) {
      alert('Fitur ini memerlukan akses sistem file yang tidak tersedia di dalam iframe. Silakan buka aplikasi di tab baru untuk menggunakan database lokal, atau gunakan database SQL.');
      return;
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'cabledesign.db',
        types: [{
          description: 'Database File',
          accept: { 'application/octet-stream': ['.db'] },
        }],
      });
      
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify([]));
      await writable.close();
      
      setDbFileHandle(handle);
      await setDbHandle(handle);
      alert('Database berhasil dibuat dan dikoneksikan!');
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error creating DB:', err);
        alert('Gagal membuat database.');
      }
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveConfig = () => {
    setShowSaveConfigModal(true);
  };

  const executeSaveConfig = async () => {
    const filename = saveConfigName.trim() || 'cable_config';
    const config = {
      materialPrices,
      materialDensities,
      materialScrap,
      lmeParams,
      materialCategories,
    };
    
    const dataStr = JSON.stringify(config, null, 2);
    const finalFilename = filename.endsWith('.config') ? filename : `${filename}.config`;

    try {
      if ('showSaveFilePicker' in window) {
        // Show the native OS save dialog, allowing user to pick location
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: finalFilename,
          types: [{
            description: 'Configuration File',
            accept: { 'application/json': ['.config', '.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        alert(`File berhasil disimpan di lokasi yang Anda pilih.`);
      } else {
        // Fallback for browsers that don't support showSaveFilePicker
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        alert(`File berhasil diunduh ke folder Downloads default Anda.`);
      }
      setShowSaveConfigModal(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Save failed:', err);
        alert('Gagal menyimpan file.');
      }
    }
  };

  const handleLoadConfigFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.materialPrices) setMaterialPrices(config.materialPrices);
        if (config.materialDensities) setMaterialDensities(config.materialDensities);
        if (config.materialScrap) setMaterialScrap(config.materialScrap);
        if (config.lmeParams) setLmeParams(config.lmeParams);
        if (config.materialCategories) setMaterialCategories(config.materialCategories);
        setShowLoadConfigModal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Error loading configuration file. Invalid format.');
      }
    };
    reader.readAsText(file);
  };
  const createDbInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadLocalDB = () => {
    if (savedProjects.length === 0) {
      alert('Tidak ada data untuk diunduh.');
      return;
    }
    const blob = new Blob([JSON.stringify(savedProjects)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cabledesign.db';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenLocalDBFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const contents = event.target?.result as string;
      try {
        const data = JSON.parse(contents);
        if (Array.isArray(data)) {
          setSavedProjects(data.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
          setShowProjectsModal(true);
          alert('Database loaded (Read-only mode). To save changes, use the Download button.');
        } else {
          alert('Format file database tidak valid.');
        }
      } catch (e) {
        alert('File database rusak atau tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleOpenLocalDB = async () => {
    // Check if we are in an iframe or if showOpenFilePicker is not supported
    const isIframe = window.self !== window.top;
    const supportsPicker = 'showOpenFilePicker' in window;

    if (isIframe || !supportsPicker) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{
          description: 'Database File',
          accept: { 'application/octet-stream': ['.db'] },
        }],
      });
      
      const file = await handle.getFile();
      const contents = await file.text();
      
      try {
        const data = JSON.parse(contents);
        if (Array.isArray(data)) {
          setDbFileHandle(handle);
          await setDbHandle(handle);
          alert('Database berhasil dikoneksikan!');
        } else {
          alert('Format file database tidak valid.');
        }
      } catch (e) {
        alert('File database rusak atau tidak valid.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error opening DB:', err);
        alert('Gagal membuka database.');
      }
    }
  };

  const handleOpenProject = (project: SavedProject) => {
    setProjectName(project.name);
    setProjectNumber(project.projectNumber || '');
    setProjectItems(project.items);
    setProjectId(project.id);
    setLoadedProjectConfig({
      lmeParams: project.lmeParams,
      materialPrices: project.materialPrices,
      exchangeRate: project.exchangeRate
    });
    setShowProjectsModal(false);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    if (dbFileHandle) {
      try {
        const file = await dbFileHandle.getFile();
        const contents = await file.text();
        let allProjects = JSON.parse(contents);
        allProjects = allProjects.filter((p: any) => p.id !== id);
        
        const writable = await dbFileHandle.createWritable();
        await writable.write(JSON.stringify(allProjects));
        await writable.close();
        
        setSavedProjects(allProjects.sort((a: any, b: any) => b.updatedAt - a.updatedAt));
        if (projectId === id) {
          setProjectId(null);
          setProjectName('New Project');
          setProjectNumber('');
          setProjectItems([]);
        }
        return;
      } catch (err) {
        console.error('Error deleting from local DB:', err);
        alert('Gagal menghapus dari database lokal.');
      }
    }

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
        return pairs > 1 ? 'Black-White with numbering mark' : 'Black-White';
    }
    if (formationType === 'Triad') {
        const triads = cores / 3;
        return triads > 1 ? 'Black, White, Red with numbering mark' : 'Black, White, Red';
    }
    if (formationType === 'Core') {
        return cores > 1 ? 'Black with numbering mark' : 'Black';
    }
    
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
    try {
      const saved = safeLocalStorage.getItem('cable_drum_data');
      if (!saved) return INITIAL_DRUM_DATA;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_DRUM_DATA;
    } catch {
      return INITIAL_DRUM_DATA;
    }
  });

  useEffect(() => {
    safeLocalStorage.setItem('cable_drum_data', JSON.stringify(drumData));
  }, [drumData]);

  const handleExportDrums = () => {
    const dataStr = JSON.stringify(drumData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drum_data_${new Date().toISOString().split('T')[0]}.drums`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportDrums = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        if (Array.isArray(importedData)) {
          setDrumData(importedData);
          alert('Drum data imported successfully!');
        } else {
          alert('Invalid drum data format.');
        }
      } catch (err) {
        console.error('Error importing drum data:', err);
        alert('Error importing drum data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    // Reset input value to allow importing the same file again
    event.target.value = '';
  };

  const [lmeParams, setLmeParams] = useState(() => {
    const saved = safeLocalStorage.getItem('cable_lme_params');
    return saved ? JSON.parse(saved) : {
      lmeCu: 0,
      premiumCu: 0,
      lmeAl: 0,
      premiumAl: 0,
      kurs: 16000
    };
  });

  useEffect(() => {
    safeLocalStorage.setItem('cable_lme_params', JSON.stringify(lmeParams));
  }, [lmeParams]);

  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>(() => {
    const saved = safeLocalStorage.getItem('cable_material_prices');
    const prices = saved ? JSON.parse(saved) : { ...DEFAULT_MATERIAL_PRICES };
    // Merge with defaults to ensure new materials are added
    Object.keys(DEFAULT_MATERIAL_PRICES).forEach(key => {
      if (prices[key] === undefined) {
        prices[key] = DEFAULT_MATERIAL_PRICES[key as keyof typeof DEFAULT_MATERIAL_PRICES];
      }
    });
    return prices;
  });

  const [materialDensities, setMaterialDensities] = useState<any>(() => {
    const saved = safeLocalStorage.getItem('cable_material_densities');
    const densities = saved ? JSON.parse(saved) : { ...DEFAULT_MATERIAL_DENSITIES };
    // Merge with defaults to ensure new materials are added
    Object.keys(DEFAULT_MATERIAL_DENSITIES).forEach(key => {
      if (densities[key as any] === undefined) {
        densities[key as any] = DEFAULT_MATERIAL_DENSITIES[key as keyof typeof DEFAULT_MATERIAL_DENSITIES];
      }
    });
    return densities;
  });

  const [materialScrap, setMaterialScrap] = useState<Record<string, number>>(() => {
    const saved = safeLocalStorage.getItem('cable_material_scrap');
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
    const saved = safeLocalStorage.getItem('cable_material_categories');
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
    safeLocalStorage.setItem('cable_material_prices', JSON.stringify(materialPrices));
    safeLocalStorage.setItem('cable_material_densities', JSON.stringify(materialDensities));
    safeLocalStorage.setItem('cable_material_scrap', JSON.stringify(materialScrap));
    safeLocalStorage.setItem('cable_material_categories', JSON.stringify(materialCategories));
    safeLocalStorage.setItem('cable_lme_params', JSON.stringify(lmeParams));
    safeLocalStorage.setItem('cable_default_margin', params.margin?.toString() || '0');
    safeLocalStorage.setItem('cable_default_overhead', params.overhead?.toString() || '0');
    
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
        setMaterialDensities(restDensities as any);
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
        setLmeParams({ lmeCu: 0, premiumCu: 0, lmeAl: 0, premiumAl: 0, kurs: 16000 });
        
        safeLocalStorage.removeItem('cable_material_prices');
        safeLocalStorage.removeItem('cable_material_densities');
        safeLocalStorage.removeItem('cable_material_scrap');
        safeLocalStorage.removeItem('cable_material_categories');
        safeLocalStorage.removeItem('cable_lme_params');
        safeLocalStorage.removeItem('cable_default_margin');
        safeLocalStorage.removeItem('cable_default_overhead');
        
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type: 'danger'
    });
  };

  const isInstrumentationPairTriad = (params.standard === 'BS EN 50288-7' || (params.standard === 'Manufacturing Specification' && params.hasScreen)) && (params.formationType === 'Pair' || params.formationType === 'Triad' || params.formationType === 'Quad');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const res = calculateCable(params, materialDensities, materialScrap);
      
      // Auto switch SFA to RGB if diameterUnderArmor < 15mm
      if (params.armorType === 'SFA' && params.autoSwitchSfaToRgb && res.spec.diameterUnderArmor < 15) {
        setParams(prev => ({ ...prev, armorType: 'RGB' }));
        return;
      }

      setResult(res);
      setCalcError(null);
    } catch (e) {
      console.error("Error calculating cable:", e);
      setCalcError(e instanceof Error ? e.message : String(e));
    }
  }, [params, materialDensities, materialScrap]);

  const handleLmeChange = (field: keyof typeof lmeParams, value: number) => {
    const newLme = { ...lmeParams, [field]: value };
    setLmeParams(newLme);
    
    // Update material prices (LME + Premium is per MT, so divide by 1000 for per kg)
    const cuPrice = Math.round(((newLme.lmeCu + newLme.premiumCu) / 1000) * newLme.kurs);
    const alPrice = Math.round(((newLme.lmeAl + newLme.premiumAl) / 1000) * newLme.kurs);
    
    setMaterialPrices(prev => ({
      ...prev,
      Cu: cuPrice,
      Al: alPrice
    }));
  };

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
      
      // Round manual overrides to 2 decimal places
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
        'manualMvScreenWireDiameter',
        'manualIsAluminiumThickness',
        'manualIsAluminiumOverlap',
        'manualIsDrainWireCount',
        'manualIsDrainWireDiameter',
        'manualIsDrainWireSize',
        'manualIsPolyesterThickness',
        'manualIsPolyesterOverlap',
        'manualOsAluminiumThickness',
        'manualOsAluminiumOverlap',
        'manualOsDrainWireCount',
        'manualOsDrainWireDiameter',
        'manualOsDrainWireSize',
        'manualOsPolyesterThickness',
        'manualOsPolyesterOverlap'
      ].includes(key)) {
        processedValue = Math.round(value * 100) / 100;
      }

      const newParams = { ...prev, [key]: processedValue };
      
      // AAC Standard Defaults
      if (key === 'standard' && value === 'SPLN 41-6 : 1981 AAC') {
        newParams.conductorMaterial = 'Al';
        newParams.conductorType = 'rm';
        newParams.size = '16';
        newParams.cores = 1;
        newParams.insulationMaterial = 'None';
        newParams.sheathMaterial = 'None';
        newParams.armorType = 'Unarmored';
        newParams.hasInnerSheath = false;
        newParams.hasScreen = false;
        newParams.voltage = 'None';
      } else if (key === 'standard' && value === 'SPLN 41-10 : 1991 (AAAC-S)') {
        newParams.conductorMaterial = 'Al';
        newParams.conductorType = 'rm';
        newParams.size = '35';
        newParams.cores = 1;
        newParams.insulationMaterial = 'XLPE';
        newParams.sheathMaterial = 'None';
        newParams.armorType = 'Unarmored';
        newParams.hasInnerSheath = false;
        newParams.hasScreen = false;
        newParams.voltage = '20 kV';
      }

      // Auto-calculate Drain Wire Size
      if (key === 'manualIsDrainWireCount' || key === 'manualIsDrainWireDiameter') {
        const count = key === 'manualIsDrainWireCount' ? (processedValue as number) : (prev.manualIsDrainWireCount || 17);
        const dia = key === 'manualIsDrainWireDiameter' ? (processedValue as number) : (prev.manualIsDrainWireDiameter || 0.2);
        if (count !== undefined && dia !== undefined) {
          newParams.manualIsDrainWireSize = Math.round((count * Math.PI * Math.pow(dia / 2, 2)) * 100) / 100;
        }
      }
      if (key === 'manualOsDrainWireCount' || key === 'manualOsDrainWireDiameter') {
        const count = key === 'manualOsDrainWireCount' ? (processedValue as number) : (prev.manualOsDrainWireCount || 17);
        const dia = key === 'manualOsDrainWireDiameter' ? (processedValue as number) : (prev.manualOsDrainWireDiameter || 0.2);
        if (count !== undefined && dia !== undefined) {
          newParams.manualOsDrainWireSize = Math.round((count * Math.PI * Math.pow(dia / 2, 2)) * 100) / 100;
        }
      }

      // Advance Mode Defaults
      if (key === 'mode' && value === 'advance') {
        newParams.manualConductorDiameter = undefined;
      }
      
      if (key === 'formationCount' || key === 'formationType') {
        const newFormation = key === 'formationType' ? value : prev.formationType;
        const newCount = key === 'formationCount' ? value : (prev.formationCount || 1);
        
        if (newParams.standard === 'BS EN 50288-7' || newParams.standard === 'Manufacturing Specification') {
          if (newFormation === 'Pair') {
            newParams.cores = newCount * 2;
          } else if (newFormation === 'Triad') {
            newParams.cores = newCount * 3;
          } else if (newFormation === 'Quad') {
            newParams.cores = newCount * 4;
          }
        }
      }

      if (key === 'cores' || key === 'formationType' || key === 'formationCount') {
        const newFormation = key === 'formationType' ? value : prev.formationType;
        const newCount = key === 'formationCount' ? value : (prev.formationCount || 1);
        const isIsAllowed = newFormation !== 'Core' && newCount > 1;
        if (!isIsAllowed) {
          newParams.hasIndividualScreen = false;
        }
      }
      
      if (key === 'hasIndividualScreen' && value === true) {
        const isIsAllowed = prev.formationType !== 'Core' && 
                            !(prev.formationType === 'Pair' && (prev.formationCount || 1) <= 1) && 
                            !(prev.formationType === 'Triad' && (prev.formationCount || 1) <= 1);
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
      }

      if (newParams.size < 25 && newParams.conductorType === 'sm') {
        newParams.conductorType = 'rm'; // Sector usually for larger sizes
      }

      // Standard specific overrides
      if (newParams.standard === 'IEC 60502-2') {
        newParams.conductorType = 'cm';
        newParams.insulationMaterial = 'XLPE MV';
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
            if (newParams.cores > 4) newParams.cores = 4;
            if (newParams.size < 1.5) newParams.size = 1.5;
            if (newParams.size > 35) newParams.size = 35;
            newParams.voltage = '300/500 V';
            newParams.sheathMaterial = 'PVC';
            newParams.innerSheathMaterial = 'PVC';
            newParams.hasInnerSheath = true;
            
            // Conductor type based on table - only auto-switch if size or standard changes
            if (key === 'size' || key === 'standard') {
              if (newParams.size <= 10) {
                newParams.conductorType = 're';
              } else {
                newParams.conductorType = 'rm';
              }
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
        } else if (newParams.standard === 'LiYCY') {
          newParams.voltage = '300/500 V';
          newParams.insulationMaterial = 'PVC';
          newParams.sheathMaterial = 'PVC';
          newParams.conductorType = 'f';
          newParams.armorType = 'TCWB';
          newParams.hasInnerSheath = false;
          newParams.hasSeparator = true;
          newParams.separatorMaterial = 'Polyester Tape';
          if (newParams.size > 2.5) newParams.size = 2.5;
          if (newParams.size < 0.75) newParams.size = 0.75;
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

            // Ensure earthingSize is valid for NFA2X-T
            const prefix = `${newParams.cores}x${newParams.size}+`;
            const validEarthingSizes = Object.keys(NFA2XT_DATA)
              .filter(k => k.startsWith(prefix))
              .map(k => Number(k.split('+')[1]))
              .sort((a, b) => a - b);
            
            if (validEarthingSizes.length > 0) {
              if (!validEarthingSizes.includes(newParams.earthingSize)) {
                newParams.earthingSize = validEarthingSizes[0];
              }
            }
          } else {
            newParams.hasEarthing = false;
            if (newParams.cores < 2) newParams.cores = 2;
            if (newParams.cores > 4) newParams.cores = 4;
          }
        } else if (newParams.standard === 'SPLN 43-4 (NYCY)') {
          newParams.insulationMaterial = 'PVC';
          newParams.hasScreen = true;
          newParams.screenType = 'CWS';
          newParams.armorType = 'Unarmored';
          newParams.hasInnerSheath = true;
          newParams.innerSheathMaterial = 'PVC';
          
          // Auto-set screen size based on NYCY_DATA or SPLN 43-4 rules
          let nycyPrefix = `${newParams.cores}x${newParams.size}/`;
          let validKeys = Object.keys(NYCY_DATA).filter(k => k.startsWith(nycyPrefix));
          
          if (validKeys.length === 0) {
            // Find a valid size for the current cores
            const validSizesForCores = Array.from(new Set(Object.keys(NYCY_DATA).filter(k => k.startsWith(`${newParams.cores}x`)).map(k => Number(k.split('x')[1].split('/')[0])))).sort((a, b) => a - b);
            if (validSizesForCores.length > 0) {
              newParams.size = validSizesForCores[0];
              nycyPrefix = `${newParams.cores}x${newParams.size}/`;
              validKeys = Object.keys(NYCY_DATA).filter(k => k.startsWith(nycyPrefix));
            }
          }
          
          if (validKeys.length > 0) {
            const validScreenSizes = validKeys.map(k => NYCY_DATA[k].screenSize);
            if (!validScreenSizes.includes(newParams.screenSize)) {
              newParams.screenSize = validScreenSizes[0];
            }
          } else {
            // Fallback / Control Cable Logic based on SPLN 43-4
            if (newParams.cores > 4) {
              if (newParams.size === 1.5) {
                if (newParams.cores <= 12) newParams.screenSize = 2.5;
                else if (newParams.cores <= 30) newParams.screenSize = 6;
                else newParams.screenSize = 10;
              } else if (newParams.size === 2.5) {
                if (newParams.cores <= 10) newParams.screenSize = 4;
                else if (newParams.cores <= 24) newParams.screenSize = 10;
                else newParams.screenSize = 16;
              } else {
                // For larger sizes in multi-core, follow power cable rule
                if (newParams.size <= 16) newParams.screenSize = newParams.size;
                else if (newParams.size <= 35) newParams.screenSize = 16;
                else if (newParams.size <= 50) newParams.screenSize = 25;
                else if (newParams.size <= 70) newParams.screenSize = 35;
                else if (newParams.size <= 95) newParams.screenSize = 50;
                else if (newParams.size <= 150) newParams.screenSize = 70;
                else if (newParams.size <= 185) newParams.screenSize = 95;
                else if (newParams.size <= 240) newParams.screenSize = 120;
                else if (newParams.size <= 300) newParams.screenSize = 150;
                else if (newParams.size <= 400) newParams.screenSize = 185;
                else if (newParams.size <= 500) newParams.screenSize = 240;
              }
            } else {
              // Standard Power Cable Logic
              if (newParams.size <= 16) newParams.screenSize = newParams.size;
              else if (newParams.size <= 35) newParams.screenSize = 16;
              else if (newParams.size <= 50) newParams.screenSize = 25;
              else if (newParams.size <= 70) newParams.screenSize = 35;
              else if (newParams.size <= 95) newParams.screenSize = 50;
              else if (newParams.size <= 150) newParams.screenSize = 70;
              else if (newParams.size <= 185) newParams.screenSize = 95;
              else if (newParams.size <= 240) newParams.screenSize = 120;
              else if (newParams.size <= 300) newParams.screenSize = 150;
              else if (newParams.size <= 400) newParams.screenSize = 185;
              else if (newParams.size <= 500) newParams.screenSize = 240;
            }
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
          newParams.cores = (newParams.formationCount || 1) * (newParams.formationType === 'Triad' ? 3 : 2);
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
    if (params.hasIndividualScreen && params.hasOverallScreen) {
      if (params.formationType === 'Pair' || params.formationType === 'Triad') {
        const formationCount = params.formationCount || 1;
        if (formationCount <= 1) {
          alert('Untuk konfigurasi IS-OS, jumlah pair atau triad harus lebih besar dari 1.');
          return;
        }
      }
    }

    if (isBulkCalculationEnabled) {
      if (bulkItems.length === 0) {
        alert('Please add at least one configuration to the bulk list.');
        return;
      }
      
      const newItems: {params: CableDesignParams, result: CalculationResult}[] = [];
      
      for (const item of bulkItems) {
        const newParams = { ...params, cores: item.cores, size: item.size, id: crypto.randomUUID() };
        const newResult = calculateCable(newParams, materialDensities, materialScrap);
        if (newResult) {
          newItems.push({ params: newParams, result: newResult });
        }
      }
      
      setProjectItems(prev => [...prev, ...newItems]);
      alert(`Successfully added ${newItems.length} items to the project.`);
      setBulkItems([]); // Clear after adding
    } else {
      if (!result) return;
      setProjectItems(prev => [...prev, { params: { ...params, id: crypto.randomUUID() }, result }]);
    }
    
    setParams(prev => ({ ...DEFAULT_PARAMS, projectName: prev.projectName }));
    setIsBulkCalculationEnabled(false);
  };

  const removeFromProject = (id: string) => {
    setProjectItems(prev => prev.filter(item => item.params.id !== id));
  };


  const currentHPP = result ? calculateHPP(result, params, materialPrices, drumData) : 0;
  const currentSellingPrice = calculateSellingPrice(currentHPP, params.margin);

  if (showReview) {
    const totalProjectPrice = projectItems.reduce((acc, item) => {
      const hpp = calculateHPP(item.result, item.params, materialPrices, drumData);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print-scale">
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
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">LME & Exchange Rate</div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">Kurs USD:</span>
                      <span className="text-xs font-bold text-slate-700">Rp {lmeParams.kurs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">LME Cu:</span>
                      <span className="text-xs font-bold text-orange-600">${lmeParams.lmeCu}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500">LME Al:</span>
                      <span className="text-xs font-bold text-slate-600">${lmeParams.lmeAl}</span>
                    </div>
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
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Old HPP</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Current HPP</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Deviasi</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">Target Price</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-center">MG vs Target</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Selling Price</th>
                    <th className="px-6 py-4 border-b border-slate-100 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectItems.map((item, idx) => {
                    const hpp = calculateHPP(item.result, item.params, materialPrices, drumData);
                    const oldHpp = loadedProjectConfig?.materialPrices ? calculateHPP(item.result, item.params, loadedProjectConfig.materialPrices, drumData) : hpp;
                    const deviation = hpp - oldHpp;
                    const targetPrice = item.params.targetPrice || 0;
                    const marginVsTarget = targetPrice > 0 ? ((targetPrice - hpp) / targetPrice) * 100 : 0;
                    
                    const sellingPrice = calculateSellingPrice(hpp, item.params.margin);
                    const breakdown = calculateCostBreakdown(item.result.bom, item.params, materialPrices);
                    const conductorPrice = breakdown.conductor + (breakdown.earthingConductor || 0) + (breakdown.earthingAl || 0) + (breakdown.earthingSteel || 0);
                    const itemId = item.params.id || idx.toString();
                    const isExpanded = expandedItemId === itemId;
                    
                    const isNY = item.params.standard.includes('(NYA)') || item.params.standard.includes('(NYAF)');
                    const isNFA = item.params.standard.includes('NFA2X');
                    const hasOuterSheath = !isNY && !isNFA && item.params.standard !== 'SPLN 41-6 : 1981 AAC' && item.params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && item.params.hasOuterSheath !== false;
                    const hasAssembly = (item.params.cores > 1 && !isNFA) || item.params.hasInnerSheath || item.params.hasSeparator;
                    const hasArmor = item.params.armorType !== 'Unarmored';
                    const hasInstrumentation = item.params.formationType && item.params.formationType !== 'Core';
                    
                    return (
                      <React.Fragment key={itemId}>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100"
                            onClick={() => setExpandedItemId(isExpanded ? null : itemId)}
                          >
                            <div className="font-mono text-xs font-bold text-slate-900 flex items-center gap-2">
                              {isExpanded ? <Minimize2 className="w-3 h-3 text-slate-400" /> : <Maximize2 className="w-3 h-3 text-slate-400" />}
                              {getCableDesignation(item.params, item.result)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 ml-5">{item.params.standard}</div>
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
                              const packing = calculatePacking(item.result.spec.overallDiameter, item.result.bom.totalWeight, drumData);
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
                            <div className="text-[10px] font-bold text-slate-400 font-mono">Rp {oldHpp.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-[10px] font-bold text-slate-900 font-mono">Rp {hpp.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className={`text-[10px] font-bold font-mono ${deviation > 0 ? 'text-red-600' : (deviation < 0 ? 'text-emerald-600' : 'text-slate-400')}`}>
                              {deviation > 0 ? '+' : ''}{deviation.toLocaleString('id-ID')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number" 
                              className="w-24 px-2 py-1 text-xs border border-slate-200 rounded text-center font-mono print:border-none print:bg-transparent print:p-0"
                              value={item.params.targetPrice || ''}
                              placeholder="Target Price"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  setProjectItems(prev => prev.map((pItem, pIdx) => 
                                    (pItem.params.id ? pItem.params.id === item.params.id : pIdx === idx) ? { ...pItem, params: { ...pItem.params, targetPrice: val } } : pItem
                                  ));
                                }
                              }}
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className={`text-xs font-bold font-mono ${marginVsTarget >= (item.params.margin || 0) ? 'text-emerald-600' : 'text-red-600'}`}>
                              {marginVsTarget.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-indigo-600 font-mono">Rp {sellingPrice.toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-sm font-bold text-emerald-600 font-mono">Rp {(sellingPrice * (item.params.orderLength || 1000)).toLocaleString('id-ID')}</div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/80 border-b border-slate-200 print:hidden">
                            <td colSpan={15} className="p-6">
                              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-indigo-500" />
                                  Adjustments
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {/* 1. Conductor & Core */}
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Conductor & Core</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Cond. Dia (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualConductorDiameter || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Wire Count</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualWireCount || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Wire Dia (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualWireDiameter || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      {item.params.hasMicaTape && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">MGT Thick (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualMgtThickness || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualMgtThickness', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 2. Insulation & Screen */}
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Insulation & Screen</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Insul. Thick (mm)</label>
                                        <input 
                                          type="number" step="0.01"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.manualInsulationThickness || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                      {item.params.voltage >= 3.6 && (
                                        <>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Cond Screen (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualConductorScreenThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualConductorScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Insul Screen (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualInsulationScreenThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualInsulationScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">MV Scr Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualMvScreenThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualMvScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">MV Scr Wire Cnt</label>
                                            <input 
                                              type="number"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualMvScreenWireCount || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualMvScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">MV Scr Wire Dia</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualMvScreenWireDiameter || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualMvScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        </>
                                      )}
                                      {item.params.hasScreen && (
                                        <>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Screen Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualScreenThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualScreenThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Scr Wire Count</label>
                                            <input 
                                              type="number"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualScreenWireCount || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualScreenWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Scr Wire Dia (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualScreenWireDiameter || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualScreenWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* 3. Assembly & Inner Sheath */}
                                  {hasAssembly && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Assembly & Inner</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Laid-up Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualLaidUpDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualLaidUpDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                        {item.params.hasInnerSheath && (
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Inner Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualInnerSheathThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualInnerSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        )}
                                        {item.params.hasSeparator && (
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Sep. Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualSeparatorThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualSeparatorThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* 4. Armor & Outer Sheath */}
                                  {(hasArmor || hasOuterSheath) && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Armor & Outer</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {hasArmor && (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Dia Under Arm (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualDiameterUnderArmor || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualDiameterUnderArmor', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Armor Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualArmorThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualArmorThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            {['SWA', 'AWA', 'GSWB', 'TCWB'].includes(item.params.armorType) && (
                                              <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Arm Wire Dia (mm)</label>
                                                <input 
                                                  type="number" step="0.01"
                                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                  value={item.params.manualArmorWireDiameter || ''}
                                                  placeholder="Auto"
                                                  onChange={e => updateProjectItemParam(idx, 'manualArmorWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                              </div>
                                            )}
                                            {item.params.armorType === 'STA' && (
                                              <>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">Arm Tape Thick (mm)</label>
                                                  <input 
                                                    type="number" step="0.01"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.manualArmorTapeThickness || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'manualArmorTapeThickness', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">STA Overlap (%)</label>
                                                  <input 
                                                    type="number"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.staOverlap || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'staOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                              </>
                                            )}
                                            {item.params.armorType === 'RGB' && (
                                              <div>
                                                <label className="block text-[10px] text-slate-500 mb-1">Arm Flat Thick (mm)</label>
                                                <input 
                                                  type="number" step="0.01"
                                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                  value={item.params.manualArmorFlatThickness || ''}
                                                  placeholder="Auto"
                                                  onChange={e => updateProjectItemParam(idx, 'manualArmorFlatThickness', e.target.value ? Number(e.target.value) : undefined)}
                                                />
                                              </div>
                                            )}
                                            {['GSWB', 'TCWB'].includes(item.params.armorType) && (
                                              <>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">Braid Coverage (%)</label>
                                                  <input 
                                                    type="number"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.braidCoverage || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'braidCoverage', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">Braid Wire Dia (mm)</label>
                                                  <input 
                                                    type="number" step="0.01"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.manualBraidWireDiameter || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'manualBraidWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">GSWB Carriers</label>
                                                  <input 
                                                    type="number"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.manualGswbCarriers || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'manualGswbCarriers', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">GSWB Wires/Carr</label>
                                                  <input 
                                                    type="number"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.manualGswbWiresPerCarrier || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'manualGswbWiresPerCarrier', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[10px] text-slate-500 mb-1">GSWB Lay Pitch (mm)</label>
                                                  <input 
                                                    type="number" step="0.01"
                                                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                    value={item.params.manualGswbLayPitch || ''}
                                                    placeholder="Auto"
                                                    onChange={e => updateProjectItemParam(idx, 'manualGswbLayPitch', e.target.value ? Number(e.target.value) : undefined)}
                                                  />
                                                </div>
                                              </>
                                            )}
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Dia Over Arm (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualDiameterOverArmor || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualDiameterOverArmor', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                        {hasOuterSheath && (
                                          <div>
                                            <label className="block text-[10px] text-slate-500 mb-1">Sheath Thick (mm)</label>
                                            <input 
                                              type="number" step="0.01"
                                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                              value={item.params.manualSheathThickness || ''}
                                              placeholder="Auto"
                                              onChange={e => updateProjectItemParam(idx, 'manualSheathThickness', e.target.value ? Number(e.target.value) : undefined)}
                                            />
                                          </div>
                                        )}
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Overall Dia (mm)</label>
                                          <input 
                                            type="number" step="0.01"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.manualOverallDiameter || ''}
                                            placeholder="Auto"
                                            onChange={e => updateProjectItemParam(idx, 'manualOverallDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* 5. Instrumentation (IS/OS) */}
                                  {item.params.formationType && item.params.formationType !== 'Core' && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Instrumentation</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {item.params.hasIndividualScreen && (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Al Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsAluminiumThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Al Overlap (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsAluminiumOverlap || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Drain Count</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsDrainWireCount || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Drain Size (mm²)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsDrainWireSize || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireSize', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Drain Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsDrainWireDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Poly Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsPolyesterThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">IS Poly Overlap (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualIsPolyesterOverlap || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualIsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                        {item.params.hasOverallScreen && (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Al Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsAluminiumThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Al Overlap (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsAluminiumOverlap || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Drain Count</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsDrainWireCount || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Drain Size (mm²)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsDrainWireSize || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireSize', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Drain Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsDrainWireDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Poly Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsPolyesterThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">OS Poly Overlap (%)</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualOsPolyesterOverlap || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualOsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* 6. Earthing / Messenger */}
                                  {item.params.hasEarthing && (
                                    <div className="space-y-3">
                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Earthing / Messenger</h5>
                                      <div className="grid grid-cols-2 gap-2">
                                        {item.params.standard.includes('NFA2X-T') ? (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Msgr Al Wires</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingWireCount || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Msgr Al Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingWireDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Msgr Steel Wires</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingSteelWireCount ?? ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingSteelWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Msgr Steel Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingSteelWireDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingSteelWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Msgr Insul Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingInsulationThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Earth Cond Dia (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingConductorDiameter || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingConductorDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-[10px] text-slate-500 mb-1">Earth Insul Thick (mm)</label>
                                              <input 
                                                type="number" step="0.01"
                                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                                value={item.params.manualEarthingInsulationThickness || ''}
                                                placeholder="Auto"
                                                onChange={e => updateProjectItemParam(idx, 'manualEarthingInsulationThickness', e.target.value ? Number(e.target.value) : undefined)}
                                              />
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* 7. Material Selection */}
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Material Selection</h5>
                                    <div className="grid grid-cols-1 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Insulation</label>
                                        <select 
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                          value={item.params.insulationMaterial}
                                          onChange={e => updateProjectItemParam(idx, 'insulationMaterial', e.target.value)}
                                        >
                                          <option value="PVC">PVC</option>
                                          <option value="XLPE">XLPE</option>
                                          <option value="PE">PE</option>
                                          <option value="LSZH">LSZH</option>
                                          <option value="EPR">EPR</option>
                                          <option value="HEPR">HEPR</option>
                                        </select>
                                      </div>
                                      {hasAssembly && item.params.hasInnerSheath && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Inner Sheath</label>
                                          <select 
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.innerSheathMaterial || 'PVC'}
                                            onChange={e => updateProjectItemParam(idx, 'innerSheathMaterial', e.target.value)}
                                          >
                                            <option value="PVC">PVC</option>
                                            <option value="PE">PE</option>
                                            <option value="LSZH">LSZH</option>
                                          </select>
                                        </div>
                                      )}
                                      {hasOuterSheath && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Outer Sheath</label>
                                          <select 
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.sheathMaterial}
                                            onChange={e => updateProjectItemParam(idx, 'sheathMaterial', e.target.value)}
                                          >
                                            <option value="PVC">PVC</option>
                                            <option value="PE">PE</option>
                                            <option value="LSZH">LSZH</option>
                                            <option value="PVC-FR">PVC-FR</option>
                                            <option value="PVC-FR Cat.A">PVC-FR Cat.A</option>
                                            <option value="PVC-FR Cat.B">PVC-FR Cat.B</option>
                                            <option value="PVC-FR Cat.C">PVC-FR Cat.C</option>
                                            <option value="SHF1">SHF1</option>
                                            <option value="SHF2">SHF2</option>
                                          </select>
                                        </div>
                                      )}
                                      {hasAssembly && item.params.hasSeparator && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Separator</label>
                                          <select 
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                            value={item.params.separatorMaterial || 'PVC'}
                                            onChange={e => updateProjectItemParam(idx, 'separatorMaterial', e.target.value)}
                                          >
                                            <option value="PVC">PVC</option>
                                            <option value="PE">PE</option>
                                            <option value="LSZH">LSZH</option>
                                            <option value="Polyester Tape">Polyester Tape</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 8. Material Prices */}
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Material Prices (Rp/kg)</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Conductor ({item.params.conductorMaterial})</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                          value={item.params.customMaterialPrices?.[item.params.conductorMaterial] || materialPrices[item.params.conductorMaterial] || ''}
                                          onChange={e => updateProjectItemCustomPrice(idx, item.params.conductorMaterial, Number(e.target.value))}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Insulation ({item.params.insulationMaterial})</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                          value={item.params.customMaterialPrices?.[item.params.insulationMaterial] || materialPrices[item.params.insulationMaterial] || ''}
                                          onChange={e => updateProjectItemCustomPrice(idx, item.params.insulationMaterial, Number(e.target.value))}
                                        />
                                      </div>
                                      {hasAssembly && item.params.hasInnerSheath && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Inner Sheath ({item.params.innerSheathMaterial || 'PVC'})</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.[item.params.innerSheathMaterial || 'PVC'] || materialPrices[item.params.innerSheathMaterial || 'PVC'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, item.params.innerSheathMaterial || 'PVC', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {hasOuterSheath && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Outer Sheath ({item.params.sheathMaterial})</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.[item.params.sheathMaterial] || materialPrices[item.params.sheathMaterial] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, item.params.sheathMaterial, Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {hasArmor && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Armor ({item.params.armorType})</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.[item.params.armorType] || materialPrices[item.params.armorType] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, item.params.armorType, Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {item.params.hasScreen && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Screen ({item.params.screenType === 'CWS' ? 'Tape: CTS' : 'CTS'})</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.['CTS'] || materialPrices['CTS'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, 'CTS', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {item.params.voltage >= 3.6 && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">MV Screen ({item.params.mvScreenType === 'CWS' ? 'Tape: CTS' : 'CTS'})</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.['CTS'] || materialPrices['CTS'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, 'CTS', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {item.params.hasMgt && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Mica Tape (MGT)</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.['MGT'] || materialPrices['MGT'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, 'MGT', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {hasAssembly && item.params.hasSeparator && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Separator</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.[item.params.separatorMaterial || 'PVC'] || materialPrices[item.params.separatorMaterial || 'PVC'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, item.params.separatorMaterial || 'PVC', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      {item.params.hasEarthing && (
                                        <div>
                                          <label className="block text-[10px] text-slate-500 mb-1">Messenger/Earth</label>
                                          <input 
                                            type="number"
                                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono"
                                            value={item.params.customMaterialPrices?.['Messenger'] || materialPrices['Messenger'] || ''}
                                            onChange={e => updateProjectItemCustomPrice(idx, 'Messenger', Number(e.target.value))}
                                          />
                                        </div>
                                      )}
                                      <div>
                                        <label className="block text-[10px] text-slate-500 mb-1">Total Weight (kg/km)</label>
                                        <input 
                                          type="number"
                                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-right font-mono bg-indigo-50"
                                          value={item.params.manualTotalWeight || ''}
                                          placeholder="Auto"
                                          onChange={e => updateProjectItemParam(idx, 'manualTotalWeight', e.target.value ? Number(e.target.value) : undefined)}
                                        />
                                      </div>
                                    </div>

                                    {/* 9. Other Costs */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Other Costs</h5>
                                        <button 
                                          onClick={() => {
                                            const newItem: OtherItem = {
                                              id: Math.random().toString(36).substr(2, 9),
                                              description: '',
                                              unitPrice: 0,
                                              quantity: 1
                                            };
                                            const currentOther = item.params.otherItems || [];
                                            updateProjectItemParam(idx, 'otherItems', [...currentOther, newItem]);
                                          }}
                                          className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                        >
                                          <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {(item.params.otherItems || []).map((other, oIdx) => (
                                          <div key={other.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50 p-2 rounded border border-slate-100">
                                            <div className="col-span-5">
                                              <label className="block text-[9px] text-slate-400 mb-1">Description</label>
                                              <input 
                                                type="text"
                                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded"
                                                value={other.description}
                                                onChange={e => {
                                                  const newOther = [...(item.params.otherItems || [])];
                                                  newOther[oIdx] = { ...newOther[oIdx], description: e.target.value };
                                                  updateProjectItemParam(idx, 'otherItems', newOther);
                                                }}
                                                placeholder="e.g. Special Test"
                                              />
                                            </div>
                                            <div className="col-span-3">
                                              <label className="block text-[9px] text-slate-400 mb-1">Unit Price</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded text-right font-mono"
                                                value={other.unitPrice || ''}
                                                onChange={e => {
                                                  const newOther = [...(item.params.otherItems || [])];
                                                  newOther[oIdx] = { ...newOther[oIdx], unitPrice: Number(e.target.value) };
                                                  updateProjectItemParam(idx, 'otherItems', newOther);
                                                }}
                                              />
                                            </div>
                                            <div className="col-span-2">
                                              <label className="block text-[9px] text-slate-400 mb-1">Qty</label>
                                              <input 
                                                type="number"
                                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded text-center"
                                                value={other.quantity || ''}
                                                onChange={e => {
                                                  const newOther = [...(item.params.otherItems || [])];
                                                  newOther[oIdx] = { ...newOther[oIdx], quantity: Number(e.target.value) };
                                                  updateProjectItemParam(idx, 'otherItems', newOther);
                                                }}
                                              />
                                            </div>
                                            <div className="col-span-2 flex justify-end">
                                              <button 
                                                onClick={() => {
                                                  const newOther = (item.params.otherItems || []).filter((_, i) => i !== oIdx);
                                                  updateProjectItemParam(idx, 'otherItems', newOther);
                                                }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                        {(item.params.otherItems || []).length === 0 && (
                                          <div className="text-[10px] text-slate-400 italic text-center py-2">No other items added</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
                  if (item.result.bom.screenWeight > 0) {
                    if (item.params.standard === 'SPLN 43-4 (NYCY)') {
                      acc['Overall Screen (Copper Wire)'] = (acc['Overall Screen (Copper Wire)'] || 0) + (item.result.bom.copperWireWeight || 0);
                      acc['Overall Screen (Copper Tape)'] = (acc['Overall Screen (Copper Tape)'] || 0) + (item.result.bom.copperTapeWeight || 0);
                      acc['Overall Screen (Polyester Tape)'] = (acc['Overall Screen (Polyester Tape)'] || 0) + (item.result.bom.polyesterTapeWeight || 0);
                    } else {
                      const screenMat = `Overall Screen (${item.params.screenType})`;
                      acc[screenMat] = (acc[screenMat] || 0) + item.result.bom.screenWeight;
                    }
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
                  // Binder Tape
                  if (item.result.bom.binderTapeWeight && item.result.bom.binderTapeWeight > 0) {
                    const btMat = `Polyester Tape (Binder Tape)`;
                    acc[btMat] = (acc[btMat] || 0) + item.result.bom.binderTapeWeight;
                  }
                  // Binder Tape Over Armor
                  if (item.result.bom.binderTapeOverArmorWeight && item.result.bom.binderTapeOverArmorWeight > 0) {
                    const btArmMat = `Polyester Tape (Over Armor)`;
                    acc[btArmMat] = (acc[btArmMat] || 0) + item.result.bom.binderTapeOverArmorWeight;
                  }
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

              {/* Other Items */}
              {projectItems.some(item => item.params.otherItems && item.params.otherItems.length > 0) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Other Items</h3>
                  {Object.entries(projectItems.reduce((acc, item) => {
                    (item.params.otherItems || []).forEach(other => {
                      const key = other.description || 'Other Item';
                      acc[key] = (acc[key] || 0) + (other.unitPrice * other.quantity);
                    });
                    return acc;
                  }, {} as Record<string, number>)).map(([desc, cost]) => (
                    <div key={desc} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">{desc}</span>
                      <span className="text-sm font-bold font-mono">Rp {Math.round(cost as number).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
              {(() => {
                const totalWeight = projectItems.reduce((acc, item) => acc + item.result.bom.totalWeight, 0);
                const totalHPP = projectItems.reduce((acc, item) => acc + calculateHPP(item.result, item.params, materialPrices, drumData), 0);
                const totalSellingPrice = projectItems.reduce((acc, item) => {
                  const hpp = calculateHPP(item.result, item.params, materialPrices, drumData);
                  return acc + calculateSellingPrice(hpp, item.params.margin);
                }, 0);
                const totalMargin = totalSellingPrice - totalHPP;
                const marginPercentage = totalSellingPrice > 0 ? (totalMargin / totalSellingPrice) * 100 : 0;

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

          <ReviewSpecifications
            groupedItemsList={groupedItemsList}
            specEdits={specEdits}
            setSpecEdits={setSpecEdits}
            printedSheets={printedSheets}
            printingGroupId={printingGroupId}
            handlePrintSheet={handlePrintSheet}
            reviewTab={reviewTab}
            drumData={drumData}
          />

          {/* Footer */}
          <footer className="text-center py-8 border-t border-slate-200 print:hidden">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PT. Multi Kencana Niagatama</div>
            <div className="text-[9px] text-slate-300 mt-1">Generated on {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </footer>
        </div>
      </div>
    );
  }

  if (calcError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Calculation Error</h2>
          <p className="text-red-600 bg-red-50 p-4 rounded-xl text-sm break-words">{calcError}</p>
          <button 
            onClick={() => handleResetToDefault()}
            className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-slate-900">Calculating Cable Design...</h2>
          <p className="text-slate-500 mt-2">Please wait or check console for errors.</p>
        </div>
      </div>
    );
  }

  const isIEC60502_1 = params.standard === 'IEC 60502-1';
  const isNYCY = params.standard === 'SPLN 43-4 (NYCY)';
  const isLV = isIEC60502_1 || isNYCY || params.standard === 'Manufacturing Specification' || params.standard === 'LiYCY';

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hidden file input for Local DB Fallback */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".db" 
        onChange={handleOpenLocalDBFallback} 
      />
      {/* Save Config Modal */}
      {showSaveConfigModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                  <Save className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Save Config</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Export to JSON</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSaveConfigModal(false)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Filename</label>
                <div className="relative group">
                  <input
                    type="text"
                    value={saveConfigName}
                    onChange={(e) => setSaveConfigName(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-[1.5rem] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-mono text-sm bg-slate-50/30 group-hover:bg-white"
                    placeholder="cable_config"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">.json</div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={executeSaveConfig}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <Download className="w-5 h-5" />
                  Save Configuration
                </button>
                <button
                  onClick={() => setShowSaveConfigModal(false)}
                  className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold transition-all text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Load Config Modal */}
      {showLoadConfigModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Load Config</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Import from JSON</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLoadConfigModal(false)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <div className="p-4 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform">
                  <FileJson className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-900">Click to select file</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JSON or CONFIG files</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoadConfigModal(false)}
                className="w-full py-4 text-slate-400 hover:text-slate-600 font-bold transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Connection Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                  <Database className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Database</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SQL Connection</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Server Address</label>
                  <input type="text" value={sqlForm.host} onChange={e => setSqlForm({...sqlForm, host: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="localhost" />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Port</label>
                  <input type="text" value={sqlForm.port} onChange={e => setSqlForm({...sqlForm, port: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="3306" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Database Name</label>
                <input type="text" value={sqlForm.database} onChange={e => setSqlForm({...sqlForm, database: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="cable_db" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <input type="text" value={sqlForm.username} onChange={e => setSqlForm({...sqlForm, username: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="root" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input type="password" value={sqlForm.password} onChange={e => setSqlForm({...sqlForm, password: e.target.value})} className="w-full px-5 py-3 border-2 border-slate-100 rounded-2xl text-sm font-mono focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                </div>
              </div>
              <div className="pt-6">
                <button 
                  onClick={handleConnectSql} 
                  disabled={isConnecting} 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <RotateCcw className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Database className="w-5 h-5" />
                      Connect & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Load Projects Modal */}
      {showProjectsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200/60 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl shadow-sm">
                  <FolderOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Open Project</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Database Explorer</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProjectsModal(false)}
                className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-10 py-6 border-b border-slate-50 bg-slate-50/30">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Cari nama atau nomor project..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-sm font-bold focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 transition-all outline-none shadow-sm"
                />
              </div>
            </div>
            <div className="p-10 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/10">
              {(() => {
                const filteredProjects = savedProjects.filter(p => 
                  (p.name || '').toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                  (p.projectNumber || '').toLowerCase().includes(projectSearchQuery.toLowerCase())
                );

                if (savedProjects.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6">
                        <Database className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">No projects found</h3>
                      <p className="text-sm text-slate-400 mt-2">Save your current configuration to SQL database.</p>
                    </div>
                  );
                }

                if (filteredProjects.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6">
                        <Search className="w-10 h-10 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900">No matches found</h3>
                      <p className="text-sm text-slate-400 mt-2">Try searching for a different name or number.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredProjects.map((project) => (
                      <div 
                        key={project.id} 
                        className="group bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between"
                        onClick={() => handleOpenProject(project)}
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex-grow pr-6">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name || 'Untitled Project'}</h4>
                            {project.projectNumber && (
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {project.projectNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" />
                              {project.items.length} Items
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(project.updatedAt).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-white flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total: {savedProjects.length} Projects
              </p>
              <button
                onClick={() => setShowProjectsModal(false)}
                className="px-8 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl font-black transition-all text-sm"
              >
                Close
              </button>
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
        
        <header className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
          
          <div className="flex flex-col items-center md:items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  CABLE<span className="text-indigo-600">DESIGNER</span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PT. Multi Kencana Niagatama</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="hidden md:flex flex-col items-end pr-4 border-r border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</span>
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex flex-col items-center md:items-end">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Created by</div>
              <div className="text-sm font-black text-slate-700 hover:text-indigo-600 transition-colors cursor-default">Dede Noviyadi</div>
            </div>
          </div>
        </header>

        {/* LME Data Banner */}
        {lmeData && (
          <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">LME Market Data</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Source: westmetall.com • {lmeData.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Copper (Settlement)</span>
                <span className="text-sm font-black text-orange-600 flex items-center gap-1">
                  ${lmeData.copper?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || 'N/A'}
                  <span className="text-[10px] text-slate-400 font-medium">/ ton</span>
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aluminium (Settlement)</span>
                <span className="text-sm font-black text-slate-700 flex items-center gap-1">
                  ${lmeData.aluminium?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || 'N/A'}
                  <span className="text-[10px] text-slate-400 font-medium">/ ton</span>
                </span>
              </div>
              {lmeData.exchangeRate && (
                <>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD to IDR</span>
                    <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                      Rp {lmeData.exchangeRate.toLocaleString('id-ID', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Configuration & Prices Panel */}
          <div className={`${isConfigExpanded ? 'lg:col-span-8' : 'lg:col-span-3'} space-y-6 transition-all duration-500 relative`}>
            {/* Floating Expand Button */}
            <button
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="absolute -right-4 top-10 z-50 p-2.5 bg-white shadow-xl rounded-full border border-slate-200 text-slate-400 hover:text-indigo-600 hidden lg:flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
              title={isConfigExpanded ? "Collapse View" : "Expand View"}
            >
              {isConfigExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <div className="absolute right-full mr-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {isConfigExpanded ? "Compact View" : "Full View"}
              </div>
            </button>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden flex flex-col h-full">
              {/* Elegant Project Control Bar */}
              <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Project Details</h2>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => {
                          setProjectId(null);
                          setProjectName('New Project');
                          setProjectNumber('');
                          setProjectItems([]);
                        }} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" 
                        title="New Project"
                      >
                        <FilePlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => setProjectItems([])} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Clear List"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={handleLoadProjects} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Open Project"><FolderOpen className="w-4 h-4" /></button>
                      <button onClick={handleSaveProject} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Save Project"><Save className="w-4 h-4" /></button>
                      <button onClick={handleExportExcel} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Download Excel"><Download className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Package className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project Name"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <List className="w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={projectNumber}
                        onChange={(e) => setProjectNumber(e.target.value)}
                        placeholder="Project Number"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-500 placeholder:text-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modern Tab Navigation */}
              <div className="flex p-2 bg-slate-50/50 gap-1 border-b border-slate-100">
                {[
                  { id: 'config', icon: Settings, label: 'Design' },
                  { id: 'prices', icon: DollarSign, label: 'Prices' },
                  { id: 'drums', icon: Package, label: 'Drums' },
                  { id: 'settings', icon: Database, label: 'System' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all duration-300 ${
                      activeTab === tab.id 
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50 translate-y-[-1px]' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                    <span className={isConfigExpanded ? 'inline' : 'hidden md:inline lg:hidden xl:inline'}>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'config' && (
                  <div className="flex flex-col space-y-6">
                    {/* Horizontal Steps Header */}
                    <div className="hidden items-center gap-2 overflow-x-auto pb-4 custom-scrollbar snap-x border-b border-slate-200">
                      {[
                        { id: 0, label: 'General', icon: Settings },
                        { id: 1, label: 'Properties', icon: Zap },
                        { id: 2, label: 'Core', icon: Layers },
                        { id: 3, label: 'Earthing', icon: Zap },
                        { id: 4, label: 'Insulation', icon: Package },
                        { id: 5, label: 'Inner Layers', icon: Layers },
                        { id: 6, label: 'Outer Layers', icon: Package }
                      ].map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => document.getElementById(`design-step-${step.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' })}
                          className="flex items-center gap-2 flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 shadow-sm snap-center"
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">{idx + 1}</div>
                          <step.icon className="w-3 h-3 text-slate-400" />
                          <span>{step.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Cards Grid Container */}
                    <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-8 items-start">
                    <div id="design-step-0" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Settings className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">General Settings</h3>
                      </div>
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
                    <div className="relative" ref={standardPopupRef}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Standard Reference</label>
                      <button
                        onClick={() => setShowStandardPopup(!showStandardPopup)}
                        className="w-full flex items-center justify-between rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-3 border bg-slate-50 font-medium text-left"
                      >
                        <span className="truncate">
                          {CABLE_STANDARDS.find(s => s.value === params.standard)?.label || params.standard}
                        </span>
                        <Search className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
                      </button>

                      {showStandardPopup && (
                        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                autoFocus
                                type="text"
                                placeholder="Search standard..."
                                value={standardSearchQuery}
                                onChange={(e) => setStandardSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                            {filteredStandards.length > 0 ? (
                              filteredStandards.map((std) => (
                                <button
                                  key={std.value}
                                  onClick={() => {
                                    handleParamChange('standard', std.value);
                                    setShowStandardPopup(false);
                                    setStandardSearchQuery('');
                                  }}
                                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 last:mb-0 flex items-center justify-between group ${
                                    params.standard === std.value
                                      ? 'bg-indigo-50 text-indigo-700'
                                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  <span>{std.label}</span>
                                  {params.standard === std.value && (
                                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="p-8 text-center">
                                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No standards found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ambient Temperature for NYMHY - Hidden as per request */}
                    {false && params.standard.includes('(NYMHY)') && (
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                        <label className="block text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Ambient Temperature</label>
                        <div className="flex bg-white p-1 rounded-xl border border-amber-100 shadow-sm">
                          <button
                            onClick={() => handleParamChange('ambientTemperature', 30)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                              (params.ambientTemperature || 30) === 30
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            30°C (Standard)
                          </button>
                          <button
                            onClick={() => handleParamChange('ambientTemperature', 40)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                              params.ambientTemperature === 40
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            40°C
                          </button>
                        </div>
                        <p className="text-[10px] text-amber-600 mt-2 italic">
                          * KHA will be adjusted based on selected ambient temperature.
                        </p>
                      </div>
                    )}

                    {(params.standard === 'BS EN 50288-7' || params.standard === 'Manufacturing Specification') && (
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">
                            {params.standard === 'Manufacturing Specification' ? 'Screen & Formation Options' : 'Instrumentation Options'}
                          </label>
                          {params.standard === 'Manufacturing Specification' && (
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <span className="text-xs font-bold text-slate-500 uppercase">Use Screen (OS/IS-OS)</span>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={params.hasScreen || false}
                                  onChange={(e) => handleParamChange('hasScreen', e.target.checked)}
                                />
                                <div className={`block w-8 h-5 rounded-full transition-colors ${params.hasScreen ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${params.hasScreen ? 'translate-x-3' : ''}`}></div>
                              </div>
                            </label>
                          )}
                        </div>
                        
                        {(params.standard === 'BS EN 50288-7' || (params.standard === 'Manufacturing Specification' && params.hasScreen)) && (
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
                              <option value="Quad">Quad</option>
                            </select>
                          </div>

                          {params.formationType !== 'Core' && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Number of {params.formationType}s
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  value={params.formationCount || 1}
                                  onChange={(e) => handleParamChange('formationCount', Number(e.target.value))}
                                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                  Cross Section (mm²)
                                </label>
                                <select
                                  value={params.instrumentationSize || 0.5}
                                  onChange={(e) => handleParamChange('instrumentationSize', Number(e.target.value))}
                                  className="w-full rounded-xl border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2 border bg-white"
                                >
                                  {[0.5, 0.75, 1, 1.5, 2.5].map(s => (
                                    <option key={s} value={s}>{s} mm²</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-6">
                            {(() => {
                              const isIsAllowed = params.formationType !== 'Core';
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

                          {params.mode === 'advance' && (params.hasIndividualScreen || params.hasOverallScreen) && (
                            <div className="space-y-4 pt-4 border-t border-slate-200">
                              {params.hasIndividualScreen && (
                                <div className="space-y-3">
                                  <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Advanced IS Parameters</label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Al Thickness (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualIsAluminiumThickness || ''}
                                        placeholder="0.05"
                                        onChange={(e) => handleParamChange('manualIsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Al Overlap (%)</label>
                                      <input
                                        type="number"
                                        value={params.manualIsAluminiumOverlap || ''}
                                        placeholder="25"
                                        onChange={(e) => handleParamChange('manualIsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">PET Thickness (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualIsPolyesterThickness || ''}
                                        placeholder="0.05"
                                        onChange={(e) => handleParamChange('manualIsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">PET Overlap (%)</label>
                                      <input
                                        type="number"
                                        value={params.manualIsPolyesterOverlap || ''}
                                        placeholder="25"
                                        onChange={(e) => handleParamChange('manualIsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Numb of wire</label>
                                      <input
                                        type="number"
                                        value={params.manualIsDrainWireCount || ''}
                                        placeholder="17"
                                        onChange={(e) => handleParamChange('manualIsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Drain Wire Size (mm²)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualIsDrainWireSize || ''}
                                        placeholder="0.53"
                                        readOnly
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-slate-50 text-slate-500 cursor-not-allowed"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Dia of wire (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualIsDrainWireDiameter || ''}
                                        placeholder="0.2"
                                        onChange={(e) => handleParamChange('manualIsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {params.hasOverallScreen && (
                                <div className="space-y-3">
                                  <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Advanced OS Parameters</label>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Al Thickness (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualOsAluminiumThickness || ''}
                                        placeholder="0.05"
                                        onChange={(e) => handleParamChange('manualOsAluminiumThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Al Overlap (%)</label>
                                      <input
                                        type="number"
                                        value={params.manualOsAluminiumOverlap || ''}
                                        placeholder="25"
                                        onChange={(e) => handleParamChange('manualOsAluminiumOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">PET Thickness (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualOsPolyesterThickness || ''}
                                        placeholder="0.05"
                                        onChange={(e) => handleParamChange('manualOsPolyesterThickness', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">PET Overlap (%)</label>
                                      <input
                                        type="number"
                                        value={params.manualOsPolyesterOverlap || ''}
                                        placeholder="25"
                                        onChange={(e) => handleParamChange('manualOsPolyesterOverlap', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Numb of wire</label>
                                      <input
                                        type="number"
                                        value={params.manualOsDrainWireCount || ''}
                                        placeholder="17"
                                        onChange={(e) => handleParamChange('manualOsDrainWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Drain Wire Size (mm²)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualOsDrainWireSize || ''}
                                        placeholder="0.53"
                                        readOnly
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-slate-50 text-slate-500 cursor-not-allowed"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <label className="block text-[10px] text-slate-400 uppercase mb-1">Dia of wire (mm)</label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={params.manualOsDrainWireDiameter || ''}
                                        placeholder="0.2"
                                        onChange={(e) => handleParamChange('manualOsDrainWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full rounded-lg border-slate-200 text-xs p-2 border bg-white"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                    {/* Features Section */}
                    <div id="design-step-1" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Properties</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-3">

                        {/* Fireguard Toggle (Includes MGT) */}
                        <div className="space-y-2">
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
                          {params.standard === 'Manufacturing Specification' && params.fireguard && (
                            <div className="pl-4 border-l-2 border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fire Proof Material</label>
                              <select
                                value={params.fireProofMaterial || 'MGT'}
                                onChange={(e) => handleParamChange('fireProofMaterial', e.target.value)}
                                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 text-xs p-2 border bg-white"
                              >
                                <option value="MGT">MGT</option>
                                {Object.keys(materialPrices).filter(m => materialCategories[m] === 'Tape' && m !== 'MGT').map(mat => (
                                  <option key={mat} value={mat}>{mat}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

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

                        {/* Auto Switch SFA to RGB Toggle */}
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Auto Switch to RGB</span>
                            <span className="text-[10px] text-slate-400 italic">If dia. before armor {"<"} 15mm</span>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={params.autoSwitchSfaToRgb || false}
                              onChange={(e) => handleParamChange('autoSwitchSfaToRgb', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${params.autoSwitchSfaToRgb ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.autoSwitchSfaToRgb ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                      </div>
                    </div>


                    {/* Voltage Selection (Dynamic) */}
                    {params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
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
                          ) : params.standard === 'Manufacturing Specification' ? (
                            <>
                              <option value="300 V">300 V</option>
                              <option value="300/500 V">300/500 V</option>
                              <option value="450/750 V">450/750 V</option>
                              <option value="600 V">600 V</option>
                              <option value="0.6/1 (1.2) kV">0.6/1 (1.2) kV</option>
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
                    )}

                    </div>

                    {/* End Properties wrapper */}
                    </div>


                    <div id="design-step-bulk" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
                      {/* Bulk Calculation Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">Bulk Calculation</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wide">Multi-core/size entry</span>
                        </div>
                        <button
                          onClick={() => setIsBulkCalculationEnabled(!isBulkCalculationEnabled)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isBulkCalculationEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isBulkCalculationEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {isBulkCalculationEnabled && (
                        <div className="space-y-4 p-4 border border-slate-200 rounded-2xl bg-slate-50 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200 mt-4">
                          <h4 className="text-[10px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest border-b border-slate-200 pb-2 mb-2">
                             <List className="w-3 h-3" />
                             Manual Bulk Input
                          </h4>

                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cores</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={manualBulkCore}
                                  onChange={(e) => setManualBulkCore(parseInt(e.target.value) || 1)}
                                  className="w-full rounded-lg border-slate-200 text-sm p-1.5 focus:ring-indigo-500 focus:border-indigo-500 font-bold bg-white"
                                  placeholder="E.g. 3"
                                />
                              </div>
                              
                              <div className="col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Select Sizes (mm²)</label>
                                  <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      const availableSizes = CABLE_SIZES.filter(s => {
                                        if (params.standard === 'BS EN 50288-7') return s >= 0.5 && s <= 2.5;
                                        if (params.standard === 'IEC 60502-2') return s >= 25;
                                        if (params.standard === 'SPLN 43-4 (NYCY)') return Array.from(new Set(Object.keys(NYCY_DATA).filter(k => k.startsWith(`${manualBulkCore}x`)).map(k => Number(k.split('x')[1].split('/')[0])))).includes(s);
                                        if (params.standard.includes('(NYMHY)')) return [0.75, 1, 1.5, 2.5].includes(s);
                                        if (params.standard.includes('(NYM)')) return [1.5, 2.5, 4, 6, 10, 16, 25, 35].includes(s);
                                        if (params.standard === 'SPLN D3. 010-1 : 2015 (NFA2X-T)') return [35, 50, 70, 95, 120].includes(s);
                                        if (params.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)') return [10, 16, 25, 35].includes(s);
                                        if (params.conductorMaterial === 'Al') return s >= 10;
                                        return true;
                                      });
                                      setSelectedBulkSizes(availableSizes);
                                    }}
                                    className="text-[9px] text-indigo-600 hover:text-indigo-800 font-black uppercase"
                                  >
                                    All
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button 
                                    onClick={() => setSelectedBulkSizes([])}
                                    className="text-[9px] text-slate-400 hover:text-slate-700 font-bold uppercase"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                                {CABLE_SIZES.filter(s => {
                                  if (params.standard === 'BS EN 50288-7') return s >= 0.5 && s <= 2.5;
                                  if (params.standard === 'IEC 60502-2') return s >= 25;
                                  if (params.standard === 'SPLN 43-4 (NYCY)') return Array.from(new Set(Object.keys(NYCY_DATA).filter(k => k.startsWith(`${manualBulkCore}x`)).map(k => Number(k.split('x')[1].split('/')[0])))).includes(s);
                                  if (params.standard.includes('(NYMHY)')) return [0.75, 1, 1.5, 2.5].includes(s);
                                  if (params.standard.includes('(NYM)')) return [1.5, 2.5, 4, 6, 10, 16, 25, 35].includes(s);
                                  if (params.standard === 'SPLN D3. 010-1 : 2015 (NFA2X-T)') return [35, 50, 70, 95, 120].includes(s);
                                  if (params.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)') return [10, 16, 25, 35].includes(s);
                                  if (params.conductorMaterial === 'Al') return s >= 10;
                                  return true;
                                }).map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => {
                                      if (selectedBulkSizes.includes(s)) {
                                        setSelectedBulkSizes(selectedBulkSizes.filter(size => size !== s));
                                      } else {
                                        setSelectedBulkSizes([...selectedBulkSizes, s].sort((a, b) => a - b));
                                      }
                                    }}
                                    className={`px-2 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                                      selectedBulkSizes.includes(s)
                                        ? 'bg-indigo-600 text-white shadow-sm scale-105' 
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                                </div>
                              </div>
                            </div>
                              
                            <button
                              onClick={() => {
                                if (selectedBulkSizes.length === 0) {
                                  alert('Select at least one size first.');
                                  return;
                                }
                                const newItems = selectedBulkSizes.map(size => ({ cores: manualBulkCore, size }));
                                setBulkItems([...bulkItems, ...newItems]);
                                setSelectedBulkSizes([]);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm active:scale-[0.98]"
                            >
                              <Plus className="w-4 h-4" />
                              Add {selectedBulkSizes.length > 0 ? `${selectedBulkSizes.length} Configs` : 'Config'}
                            </button>
                            
                            {/* Added Items List */}
                            <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Configuration List</label>
                                {bulkItems.length > 0 && (
                                  <button 
                                    onClick={() => setBulkItems([])}
                                    className="text-[9px] text-rose-500 hover:text-rose-700 font-bold uppercase bg-rose-50 px-2 py-0.5 rounded"
                                  >
                                    Clear List
                                  </button>
                                )}
                              </div>
                              
                              {bulkItems.length === 0 ? (
                                <div className="py-4 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                  <p className="text-[10px] text-slate-400 font-medium">No configs added yet</p>
                                </div>
                              ) : (
                                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                                  {bulkItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-100 rounded-lg shadow-sm group">
                                      <div className="flex items-center gap-2">
                                        <span className="w-4 h-4 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold">
                                          {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                                          <span className="px-1.5 py-0.5 bg-slate-50 rounded text-indigo-700 border border-slate-100">{item.cores}C</span>
                                          <span className="text-slate-300">×</span>
                                          <span className="px-1.5 py-0.5 bg-slate-50 rounded text-indigo-700 border border-slate-100">{item.size} mm²</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => setBulkItems(bulkItems.filter((_, i) => i !== idx))}
                                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>

                    <div id="design-step-2" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Layers className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Phase Conductor</h3>
                      </div>
                      {/* Cores and Size in one row */}
                    <div className={`grid grid-cols-2 gap-4 ${isInstrumentationPairTriad ? 'opacity-40 pointer-events-none' : ''}`}>
                      {/* Number of Cores */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Number of Cores</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={params.standard === 'IEC 60502-2' ? 1 : params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? 1 : params.standard.includes('(NYMHY)') ? 2 : params.standard.includes('(NYM)') ? 2 : params.standard.includes('NFA2X-T') ? 2 : params.standard.includes('NFA2X') ? 2 : params.standard === 'SPLN 43-4 (NYCY)' ? 1 : 1}
                            max={params.standard === 'IEC 60502-2' ? 3 : params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? 1 : params.standard.includes('(NYMHY)') ? 5 : params.standard.includes('(NYM)') ? 4 : (params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) ? 1 : params.standard.includes('NFA2X-T') ? 3 : params.standard.includes('NFA2X') ? 4 : params.standard === 'SPLN 43-4 (NYCY)' ? 61 : 80}
                            value={params.cores}
                            onChange={(e) => handleParamChange('cores', Number(e.target.value))}
                            disabled={isInstrumentationPairTriad || isBulkCalculationEnabled || params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)'}
                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:bg-slate-100 disabled:opacity-50"
                          />
                        </div>
                        {params.standard === 'BS EN 50288-7' && (
                          <p className="text-[10px] text-indigo-600 mt-1 font-medium italic">
                            {params.formationType === 'Pair' ? `(Equals ${params.cores / 2} Pairs)` : params.formationType === 'Triad' ? `(Equals ${Math.floor(params.cores / 3)} Triads)` : ''}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(() => {
                            let cores = [1, 2, 3, 4, 5];
                            if (params.standard === 'IEC 60502-2') cores = [1, 3];
                            else if (params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') cores = [1];
                            else if (params.standard === 'SPLN 43-4 (NYCY)') cores = Array.from(new Set(Object.keys(NYCY_DATA).map(k => Number(k.split('x')[0])))).sort((a, b) => a - b);
                            else if (params.standard.includes('(NYM)')) cores = [2, 3, 4];
                            else if (params.standard.includes('(NYMHY)')) cores = [2, 3, 4, 5];
                            else if (params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) cores = [1];
                            else if (params.standard.includes('NFA2X-T')) cores = [2, 3];
                            else if (params.standard.includes('NFA2X')) cores = [2, 4];
                            else if (params.standard === 'BS EN 50288-7') cores = [1, 2, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 32, 40, 50];
                            
                            return cores.map((c) => (
                              <button
                                key={c}
                                onClick={() => handleParamChange('cores', c)}
                                disabled={isInstrumentationPairTriad || isBulkCalculationEnabled}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                                  params.cores === c 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                } disabled:opacity-50`}
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
                          onChange={(e) => handleParamChange('size', params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? e.target.value : Number(e.target.value))}
                          disabled={isInstrumentationPairTriad || isBulkCalculationEnabled}
                          className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:bg-slate-100 disabled:opacity-50"
                        >
                          {params.standard === 'SPLN 41-6 : 1981 AAC' ? (
                            AAC_SIZES.map((s) => (
                              <option key={s} value={s}>{s} mm²</option>
                            ))
                          ) : params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? (
                            AAACS_SIZES.map((s) => (
                              <option key={s} value={s}>{s} mm²</option>
                            ))
                          ) : (
                            CABLE_SIZES.filter(s => {
                              if (params.standard === 'BS EN 50288-7') {
                                return s >= 0.5 && s <= 2.5;
                              }
                              if (params.standard === 'IEC 60502-2') {
                                return s >= 25;
                              }
                              if (params.standard === 'SPLN 43-4 (NYCY)') {
                                return Array.from(new Set(Object.keys(NYCY_DATA).filter(k => k.startsWith(`${params.cores}x`)).map(k => Number(k.split('x')[1].split('/')[0])))).includes(s);
                              }
                              if (params.standard.includes('(NYMHY)')) {
                                return [0.75, 1, 1.5, 2.5].includes(s);
                              }
                              if (params.standard.includes('(NYM)')) {
                                return [1.5, 2.5, 4, 6, 10, 16, 25, 35].includes(s);
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
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    </div>
                    <div id="design-step-3" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Earth & Neutral</h3>
                      </div>
                      {/* Earthing Core Section */}
                    {!(params.standard.includes('(NYA)') || params.standard.includes('(NYM)') || params.standard.includes('(NYMHY)') || params.standard.includes('(NYAF)') || params.standard === 'SPLN D3. 010-1 : 2014 (NFA2X)' || params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') && (
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
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
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
                                  onChange={(e) => handleParamChange('earthingSize', Number(e.target.value))}
                                  className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50 disabled:opacity-50"
                                >
                                  <option value={0}>None</option>
                                  {CABLE_SIZES.filter(s => {
                                    if (params.standard.includes('NFA2X-T')) {
                                      const key = `${params.cores}x${params.size}+${s}`;
                                      return !!NFA2XT_DATA[key];
                                    }
                                    return s <= params.size;
                                  }).map((s) => (
                                    <option key={s} value={s}>{s} mm²</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Cabling Model</label>
                              <select
                                value={params.cablingModel || 'Auto'}
                                onChange={(e) => handleParamChange('cablingModel', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                              >
                                <option value="Auto">Auto (Minimum Diameter)</option>
                                <option value="Single Circle">Single Circle (Lingkaran Tunggal)</option>
                                <option value="Groove">Groove (Celah/Lekukan)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Advanced Messenger/Earthing Parameters */}
                        {params.mode === 'advance' && params.hasEarthing && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                              {params.standard.includes('NFA2X-T') ? 'Advanced Messenger Parameters' : 'Advanced Earthing Parameters'}
                            </label>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  {params.standard.includes('NFA2X-T') ? 'Al Wire Count' : 'Wire Count'}
                                </label>
                                <input
                                  type="number"
                                  value={params.manualEarthingWireCount || ''}
                                  placeholder="7"
                                  onChange={(e) => handleParamChange('manualEarthingWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                                  {params.standard.includes('NFA2X-T') ? 'Al Wire Dia (mm)' : 'Wire Dia (mm)'}
                                </label>
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

                            {params.standard.includes('NFA2X-T') && (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Steel Wire Count</label>
                                  <input
                                    type="number"
                                    value={params.manualEarthingSteelWireCount || ''}
                                    placeholder="1"
                                    onChange={(e) => handleParamChange('manualEarthingSteelWireCount', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Steel Wire Dia (mm)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={params.manualEarthingSteelWireDiameter || ''}
                                    placeholder="Auto"
                                    onChange={(e) => handleParamChange('manualEarthingSteelWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                  />
                                </div>
                              </div>
                            )}

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
                            <p className="text-[9px] text-indigo-400 mt-1 italic text-center">Formulas: Standard Calculations</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conductor Section */}
                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Conductor</label>
                      
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
                                               ((params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') && mat !== 'Al') ||
                                               (params.standard === 'BS EN 50288-7' && mat !== 'Cu' && mat !== 'TCu') ||
                                               (params.standard === 'LiYCY' && mat !== 'Cu' && mat !== 'TCu');
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
                            if (params.standard === 'Manufacturing Specification') {
                              if (type === 'sm') {
                                isDisabled = !((params.cores === 3 || params.cores === 4) && params.size >= 50);
                              }
                            }
                            if (params.standard.includes('SNI 04-6629')) {
                              if (params.standard.includes('(NYM)')) isDisabled = isDisabled || !['re', 'rm'].includes(type);
                              if (params.standard.includes('(NYAF)') || params.standard.includes('(NYMHY)')) isDisabled = isDisabled || type !== 'f';
                              if (params.standard.includes('(NYA)')) isDisabled = isDisabled || (type !== 're' && type !== 'rm');
                            }
                            if (params.standard === 'LiYCY') isDisabled = isDisabled || type !== 'f';
                            if (params.standard === 'IEC 60502-2') isDisabled = isDisabled || type !== 'cm';
                            if (params.standard.includes('NFA2X')) isDisabled = isDisabled || !['cm', 'rm'].includes(type);
                            if (params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') isDisabled = isDisabled || type !== 'rm';
                            
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
                                title={type === 're' ? 'Solid Circular' : type === 'rm' ? 'Stranded Circular' : type === 'cm' ? 'Compacted Stranded (cm)' : type === 'sm' ? 'Sector Stranded' : 'Flexible Class 5'}
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
                                placeholder={params.standard === 'SPLN 41-6 : 1981 AAC' ? (AAC_DATA[String(params.size)]?.wireCount.toString() || '7') : params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? (AAACS_DATA[String(params.size)]?.wireCount.toString() || '7') : (params.conductorType === 're' ? '1' : '7')}
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
                                placeholder={params.standard === 'SPLN 41-6 : 1981 AAC' ? (AAC_DATA[String(params.size)]?.wireDiameter.toFixed(2) || result.spec.phaseCore.wireDiameter.toFixed(2)) : params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? (AAACS_DATA[String(params.size)]?.wireDiameter.toFixed(2) || result.spec.phaseCore.wireDiameter.toFixed(2)) : result.spec.phaseCore.wireDiameter.toFixed(2)}
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
                              placeholder={params.standard === 'SPLN 41-6 : 1981 AAC' ? (AAC_DATA[String(params.size)]?.overallDiameter.toFixed(2) || result.spec.conductorDiameter.toFixed(2)) : params.standard === 'SPLN 41-10 : 1991 (AAAC-S)' ? (result.spec.conductorDiameter.toFixed(2)) : result.spec.conductorDiameter.toFixed(2)}
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

                    </div>
                    <div id="design-step-4" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Package className="w-4 h-4 text-purple-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Insulation & Screen</h3>
                      </div>
                      {/* Insulation Section */}
                    {params.standard !== 'SPLN 41-6 : 1981 AAC' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Insulation</label>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
                          <select
                            value={params.insulationMaterial}
                            onChange={(e) => handleParamChange('insulationMaterial', e.target.value)}
                            className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50"
                          >
                            {(() => {
                              const compoundMaterials = ['XLPE', 'XLPE MV', 'PVC', 'EPR'];
                              const customCompounds = Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Insulation');
                              const availableCompounds = Array.from(new Set([...compoundMaterials, ...customCompounds])).filter(mat => materialPrices[mat] !== undefined);
                              
                              return availableCompounds.map((mat) => {
                                let isDisabled = false;
                                if (params.standard.includes('SNI 04-6629')) isDisabled = mat !== 'PVC';
                                if (params.standard === 'IEC 60502-2') isDisabled = mat !== 'XLPE MV' && mat !== 'XLPE';
                                if (params.standard === 'LiYCY') isDisabled = mat !== 'PVC';
                                if (isNYCY) isDisabled = mat !== 'PVC';
                                
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
                    )}

                    {/* MV Screen Selection (Moved after Insulation) */}
                    {params.standard === 'IEC 60502-2' && params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Metallic Screen (MV)</label>
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
                    {params.mode === 'advance' && params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">Cabling Diameter</label>
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

                    {/* Cabling Filler Section */}
                    {params.standard === 'Manufacturing Specification' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Cabling Filler</label>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Filler Type</label>
                            <select
                              value={params.cablingFillerType || 'Extruded'}
                              onChange={(e) => handleParamChange('cablingFillerType', e.target.value)}
                              className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                            >
                              <option value="Extruded">Extruded</option>
                              <option value="PP Yarn">PP Yarn</option>
                              <option value="Polyester Tape">Polyester Tape</option>
                            </select>
                          </div>
                          
                          {(!params.cablingFillerType || params.cablingFillerType === 'Extruded') && (
                            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                              <label className="block text-sm font-medium text-slate-700 mb-1">Extruded Material</label>
                              <select
                                value={params.cablingFillerMaterial || 'PVC'}
                                onChange={(e) => handleParamChange('cablingFillerMaterial', e.target.value)}
                                className="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
                              >
                                {(() => {
                                  const sheathMaterials = ['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR'];
                                  const customSheaths = Object.keys(materialPrices).filter(m => 
                                    materialCategories[m] === 'Compound Filler' || 
                                    materialCategories[m] === 'Compound Sheath' || 
                                    materialCategories[m] === 'Compound (Filler/Sheath)'
                                  );
                                  const availableSheaths = Array.from(new Set([...sheathMaterials, ...customSheaths])).filter(mat => materialPrices[mat] !== undefined);
                                  return availableSheaths.map(mat => (
                                    <option key={mat} value={mat}>{mat}</option>
                                  ));
                                })()}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inner Sheath Section */}
                    {params.standard !== 'LiYCY' && params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Inner Sheath</label>
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                            <label className={`flex items-center justify-between cursor-pointer group ${params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Inner Sheath</span>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  disabled={params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored'}
                                  checked={params.hasInnerSheath !== false || (params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored')}
                                  onChange={(e) => handleParamChange('hasInnerSheath', e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${(params.hasInnerSheath !== false || (params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored')) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(params.hasInnerSheath !== false || (params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored')) ? 'translate-x-4' : ''}`}></div>
                              </div>
                            </label>
                            {(params.hasInnerSheath !== false || (params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored')) && (
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
                          
                          {params.mode === 'advance' && (params.hasInnerSheath !== false || (params.standard !== 'Manufacturing Specification' && params.armorType !== 'Unarmored')) && (
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
                    )}

                    {/* Screen Section */}
                    {params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className={`space-y-4 border-t border-slate-100 pt-4 ${!isLV ? 'opacity-50' : ''}`}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Screen {!isLV && '(IEC 60502-1 or NYCY Only)'}</label>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <label className={`flex items-center justify-between ${!isLV || isNYCY ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Screen</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              disabled={!isLV || isNYCY}
                              checked={isNYCY || (isLV && (params.hasScreen || false))}
                              onChange={(e) => handleParamChange('hasScreen', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isNYCY || (isLV && params.hasScreen) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isNYCY || (isLV && params.hasScreen) ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                        {isLV && (isNYCY || params.hasScreen) && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</label>
                              <select
                                value={isNYCY ? 'CWS' : (params.screenType || 'CTS')}
                                disabled={isNYCY}
                                onChange={(e) => handleParamChange('screenType', e.target.value as any)}
                                className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50 disabled:bg-slate-100"
                              >
                                <option value="CTS">CTS (Copper Tape Screen)</option>
                                <option value="CWS">CWS (Copper Wire + Tape + Polyester)</option>
                              </select>
                            </div>
                            {(isNYCY || params.screenType === 'CWS') && (
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Screen Size (mm²)</label>
                                <select
                                  value={params.screenSize || (isNYCY ? (NYCY_DATA[`${params.cores}x${params.size}/${params.screenSize || params.size}`]?.screenSize || Number(params.size)) : 16)}
                                  onChange={(e) => handleParamChange('screenSize', Number(e.target.value))}
                                  className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50 disabled:bg-slate-100"
                                >
                                  {isNYCY ? (
                                    Array.from(new Set(Object.keys(NYCY_DATA).filter(k => k.startsWith(`${params.cores}x${params.size}/`)).map(k => Number(k.split('/')[1])))).map(s => (
                                      <option key={s} value={s}>{s} mm² (Wire Dia: {CWS_WIRE_DIAMETERS[s] || 0.8}mm)</option>
                                    ))
                                  ) : (
                                    [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240].map(s => (
                                      <option key={s} value={s}>{s} mm² (Wire Dia: {CWS_WIRE_DIAMETERS[s] || 0.8}mm)</option>
                                    ))
                                  )}
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
                  )}

                    <div id="design-step-5" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Layers className="w-4 h-4 text-blue-500" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inner Layers</h3>
                      </div>
                      {/* Separator Section */}
                    <div className={`space-y-4 border-t border-slate-100 pt-4 ${(!isIEC60502_1 && params.standard !== 'Manufacturing Specification' && params.standard !== 'LiYCY') ? 'opacity-50' : ''}`}>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {params.standard === 'LiYCY' ? 'Inner Tape (Polyester Tape)' : `Separator Sheath ${(!isIEC60502_1 && params.standard !== 'Manufacturing Specification') ? '(IEC 60502-1 or Mfg Spec Only)' : ''}`}
                      </label>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <label className={`flex items-center justify-between ${((!isIEC60502_1 && params.standard !== 'Manufacturing Specification' && params.standard !== 'LiYCY') || (params.hasScreen && params.armorType !== 'Unarmored') || params.standard === 'LiYCY') ? 'cursor-not-allowed' : 'cursor-pointer group'}`}>
                          <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">
                            {params.standard === 'LiYCY' ? 'Apply Inner Tape' : 'Apply Separator'}
                          </span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              disabled={(!isIEC60502_1 && params.standard !== 'Manufacturing Specification' && params.standard !== 'LiYCY') || (params.hasScreen && params.armorType !== 'Unarmored') || params.standard === 'LiYCY'}
                              checked={((isIEC60502_1 || params.standard === 'Manufacturing Specification') && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) || params.standard === 'LiYCY'}
                              onChange={(e) => handleParamChange('hasSeparator', e.target.checked)}
                            />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${(((isIEC60502_1 || params.standard === 'Manufacturing Specification') && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) || params.standard === 'LiYCY') ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${(((isIEC60502_1 || params.standard === 'Manufacturing Specification') && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) || params.standard === 'LiYCY') ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </label>
                        {(((isIEC60502_1 || params.standard === 'Manufacturing Specification') && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) || params.standard === 'LiYCY') && (
                          <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Material</label>
                            <select
                              value={params.standard === 'LiYCY' ? 'Polyester Tape' : (params.separatorMaterial || 'PVC')}
                              disabled={params.standard === 'LiYCY'}
                              onChange={(e) => handleParamChange('separatorMaterial', e.target.value as SheathMaterial)}
                              className="w-full rounded-xl border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {params.standard === 'LiYCY' ? (
                                <option value="Polyester Tape">Polyester Tape</option>
                              ) : (
                                <>
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
                                </>
                              )}
                            </select>
                          </div>
                        )}
                        {params.mode === 'advance' && ((isIEC60502_1 && (params.hasSeparator || (params.hasScreen && params.armorType !== 'Unarmored'))) || params.standard === 'LiYCY') && (
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                              {params.standard === 'LiYCY' ? 'Tape Thickness (mm)' : 'Separator Thickness (mm)'}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={params.manualSeparatorThickness || ''}
                              placeholder={(result.spec.separatorThickness || 0).toFixed(2)}
                              onChange={(e) => handleParamChange('manualSeparatorThickness', e.target.value ? Number(e.target.value) : undefined)}
                              className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    </div>
                    <div id="design-step-6" className="w-full bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <Package className="w-4 h-4 text-slate-800" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Armor & Outer Sheath</h3>
                      </div>
                      {/* Armor Section */}
                    {params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{params.standard === 'LiYCY' ? '5. Braid Screen' : '5. Armour'}</label>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                        <select
                          value={params.armorType}
                          disabled={params.standard.includes('SNI 04-6629') || isNYCY}
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
                              <option value="ATA">ATA (Aluminum Tape)</option>
                            </>
                          ) : params.standard === 'IEC 60092-353' ? (
                            <>
                              <option value="GSWB">GSWB (Steel Wire Braided)</option>
                              <option value="TCWB">TCWB (Tinned Copper Wire Braided)</option>
                            </>
                          ) : params.standard === 'LiYCY' ? (
                            <>
                              <option value="TCWB">TCWB (Tinned Copper Wire Braided)</option>
                              <option value="CWB">CWB (Copper Wire Braided)</option>
                            </>
                          ) : params.cores === 1 ? (
                            <>
                              <option value="AWA">AWA (Aluminum Wire)</option>
                              <option value="ATA">ATA (Aluminum Tape)</option>
                            </>
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
                              value={result.spec.gswbCoverage ? Math.round(result.spec.gswbCoverage) : (params.braidCoverage || 90)}
                              onChange={(e) => {
                                handleParamChange('braidCoverage', Number(e.target.value));
                                // Clear manual wires per carrier if user explicitly changes coverage
                                if (params.manualGswbWiresPerCarrier) {
                                  handleParamChange('manualGswbWiresPerCarrier', undefined);
                                }
                              }}
                              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-mono font-bold text-indigo-600 w-12 text-right">
                              {result.spec.gswbCoverage ? result.spec.gswbCoverage.toFixed(1) : (params.braidCoverage || 90)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* STA Overlap Input */}
                      {params.mode === 'advance' && (params.armorType === 'STA' || params.armorType === 'ATA') && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tape Overlap (%)</label>
                          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={params.staOverlap ?? 25}
                              onChange={(e) => handleParamChange('staOverlap', Number(e.target.value))}
                              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-mono font-bold text-indigo-600 w-10 text-right">{params.staOverlap ?? 25}%</span>
                          </div>
                        </div>
                      )}

                      {params.mode === 'advance' && params.armorType !== 'Unarmored' && (
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          {(params.armorType === 'SWA' || params.armorType === 'AWA' || params.armorType === 'RGB') && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Armor Wire Diameter (mm)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={params.manualArmorWireDiameter || ''}
                                placeholder={result.spec.armorWireDiameter?.toFixed(2) || ''}
                                onChange={(e) => handleParamChange('manualArmorWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          )}

                          {(params.armorType === 'STA' || params.armorType === 'ATA' || params.armorType === 'SFA' || params.armorType === 'RGB') && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Armor Tape Thickness (mm)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={params.manualArmorTapeThickness || ''}
                                placeholder={result.spec.armorTapeThickness?.toFixed(2) || ''}
                                onChange={(e) => handleParamChange('manualArmorTapeThickness', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          )}

                          {params.armorType === 'SFA' && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Steel Flat Thickness (mm)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={params.manualArmorFlatThickness || ''}
                                placeholder={result.spec.armorFlatThickness?.toFixed(2) || ''}
                                onChange={(e) => handleParamChange('manualArmorFlatThickness', e.target.value ? Number(e.target.value) : undefined)}
                                className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                              />
                            </div>
                          )}

                          {(params.armorType === 'GSWB' || params.armorType === 'TCWB') && (
                            <>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Braid Wire Diameter (mm)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={params.manualBraidWireDiameter || ''}
                                  placeholder={result.spec.braidWireDiameter?.toFixed(2) || result.spec.armorWireDiameter?.toFixed(2) || ''}
                                  onChange={(e) => handleParamChange('manualBraidWireDiameter', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Carriers</label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={params.manualGswbCarriers || ''}
                                    placeholder={result.spec.gswbCarriers?.toString() || ''}
                                    onChange={(e) => handleParamChange('manualGswbCarriers', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Wires/Carrier</label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={params.manualGswbWiresPerCarrier || ''}
                                    placeholder={result.spec.gswbWiresPerCarrier?.toString() || ''}
                                    onChange={(e) => handleParamChange('manualGswbWiresPerCarrier', e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Lay Pitch (mm)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={params.manualGswbLayPitch || ''}
                                  placeholder={result.spec.gswbLayPitch?.toFixed(1) || ''}
                                  onChange={(e) => handleParamChange('manualGswbLayPitch', e.target.value ? Number(e.target.value) : undefined)}
                                  className="w-full rounded-xl border-indigo-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs p-2 border bg-white"
                                />
                              </div>
                            </>
                          )}

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
                  )}

                    {/* Outer Sheath Section */}
                    {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)') || params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Outer Sheath</label>
                        
                        {params.standard === 'Manufacturing Specification' && (
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mb-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                              <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">Apply Outer Sheath</span>
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={params.hasOuterSheath !== false}
                                  onChange={(e) => handleParamChange('hasOuterSheath', e.target.checked)}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${params.hasOuterSheath !== false ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${params.hasOuterSheath !== false ? 'translate-x-4' : ''}`}></div>
                              </div>
                            </label>
                          </div>
                        )}

                        {(params.hasOuterSheath !== false) && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
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
                      </div>
                    )}


                    </div>
                    <div className="col-span-1 xl:col-span-2 2xl:col-span-3 space-y-6">
                      {/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}
                    {params.mode === 'advance' && params.standard !== 'SPLN 41-6 : 1981 AAC' && params.standard !== 'SPLN 41-10 : 1991 (AAAC-S)' && (
                      <div className="space-y-4 border-t border-slate-100 pt-4">
                        <label className="block text-xs font-bold text-indigo-400 uppercase tracking-widest">Advanced Intermediate Diameters</label>
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
                    {params.mode === 'standard' && params.standard !== 'SPLN 41-6 : 1981 AAC' && (
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-4 shadow-sm mt-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Manual Specifications</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Conductor (mm)</label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder={result.spec.conductorDiameter.toFixed(2)}
                              value={params.manualConductorDiameter !== undefined ? params.manualConductorDiameter.toFixed(2) : ''}
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
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">{params.standard === 'LiYCY' ? 'Braid Screen (mm)' : 'Armor (mm)'}</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder={result.spec.armorThickness.toFixed(1)}
                                value={params.manualArmorThickness !== undefined ? params.manualArmorThickness : ''}
                                onChange={(e) => handleParamChange('manualArmorThickness', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full rounded-lg border-slate-200 text-xs p-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          )}

                          {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)')) && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">{params.standard === 'LiYCY' ? 'Min. Outer Sheath (mm)' : 'Outer Sheath (mm)'}</label>
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

                    </div>

                    {/* Close horizontal cards container */}
                    </div>

                    {/* Add to Project Button moved to bottom of config */}
                    <div className="pt-4 pb-8 w-full">
                      <button
                        onClick={addToProject}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] uppercase tracking-wider text-sm"
                      >
                        <Plus className="w-5 h-5" />
                        {isBulkCalculationEnabled 
                          ? `Bulk Add to Project (${bulkItems.length} Items)` 
                          : 'Add to Project'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'prices' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        Update material prices (IDR/kg) and densities (g/cm³) to calculate the estimated HPP per meter.
                      </p>
                      <div className="flex gap-2 shrink-0">
                        <button 
                          onClick={handleResetToDefault}
                          title="Reset to Default"
                          className="text-rose-600 hover:text-rose-700 flex items-center justify-center bg-white p-2 rounded-lg border border-rose-200 shadow-sm transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleSaveConfig}
                          title="Save Configuration"
                          className="text-indigo-600 hover:text-indigo-700 flex items-center justify-center bg-white p-2 rounded-lg border border-indigo-200 shadow-sm transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setShowLoadConfigModal(true)}
                          title="Load Configuration"
                          className="text-indigo-600 hover:text-indigo-700 flex items-center justify-center bg-white p-2 rounded-lg border border-indigo-200 shadow-sm transition-all"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleLoadConfigFromFile} 
                          className="hidden" 
                          accept=".config,.json"
                        />
                        <button 
                          onClick={saveMaterialSettings}
                          title="Save All Settings"
                          className="text-indigo-600 hover:text-indigo-700 flex items-center justify-center bg-white p-2 rounded-lg border border-indigo-200 shadow-sm transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <label className="block text-sm font-semibold text-slate-700">LME & Exchange Rate</label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">USD Exchange Rate (Kurs)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                            <input
                              type="number"
                              value={lmeParams.kurs || 0}
                              onChange={(e) => handleLmeChange('kurs', parseFloat(e.target.value) || 0)}
                              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider">Copper (Cu)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">LME ($/MT)</label>
                              <input
                                type="number"
                                value={lmeParams.lmeCu || 0}
                                onChange={(e) => handleLmeChange('lmeCu', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Premium ($/MT)</label>
                              <input
                                type="number"
                                value={lmeParams.premiumCu || 0}
                                onChange={(e) => handleLmeChange('premiumCu', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-orange-800 uppercase">Calculated Price</span>
                            <span className="text-sm font-black text-orange-600">Rp {materialPrices.Cu?.toLocaleString()}/kg</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Aluminium (Al)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">LME ($/MT)</label>
                              <input
                                type="number"
                                value={lmeParams.lmeAl || 0}
                                onChange={(e) => handleLmeChange('lmeAl', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Premium ($/MT)</label>
                              <input
                                type="number"
                                value={lmeParams.premiumAl || 0}
                                onChange={(e) => handleLmeChange('premiumAl', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Calculated Price</span>
                            <span className="text-sm font-black text-slate-700">Rp {materialPrices.Al?.toLocaleString()}/kg</span>
                          </div>
                        </div>
                      </div>
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
                        * Margin is used to calculate Selling Price (Price = ROUNDUP(HPP / (1 - Margin%), -2))
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 shadow-sm">
                      <p className="text-[10px] text-slate-400 italic">
                        * Target Price is managed in the Project Review section.
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
                      </div>

                      <div className="space-y-6 pr-2">
                        {[
                          { title: 'Conductor', items: Array.from(new Set(['Cu', 'Al', 'TCu', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Conductor')])) },
                          { title: 'Compound Insulation', items: Array.from(new Set(['XLPE', 'XLPE MV', 'PVC', 'EPR', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Insulation')])) },
                          { title: 'Compound (Filler/Sheath)', items: Array.from(new Set(['PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Compound Filler' || materialCategories[m] === 'Compound Sheath' || materialCategories[m] === 'Compound (Filler/Sheath)')])) },
                          { title: 'Armour', items: Array.from(new Set(['Steel', 'SteelWire', 'STA', 'SWA', 'AWA', 'SFA', 'RGB', 'GSWB', 'TCWB', 'ATA', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Armour')])) },
                          { title: 'Screen', items: Array.from(new Set(['Inner Semi Conductive', 'Outer Semi Conductive', 'MGT', 'CTS', 'CWS', ...Object.keys(materialPrices).filter(m => materialCategories[m] === 'Screen')])) },
                          { title: 'Other', items: Object.keys(materialPrices).filter(m => !['Cu', 'Al', 'TCu', 'XLPE', 'XLPE MV', 'PVC', 'PE', 'LSZH', 'PVC-FR', 'PVC-FR Cat.A', 'PVC-FR Cat.B', 'PVC-FR Cat.C', 'SHF1', 'SHF2', 'EPR', 'HEPR', 'Steel', 'SteelWire', 'STA', 'SWA', 'AWA', 'SFA', 'RGB', 'GSWB', 'TCWB', 'ATA', 'Inner Semi Conductive', 'Outer Semi Conductive', 'MGT', 'CTS', 'CWS'].includes(m) && (!materialCategories[m] || materialCategories[m] === 'Other' || materialCategories[m] === 'Compound')) }
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
                      <div className="flex gap-2">
                        <button 
                          onClick={handleExportDrums}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 transition-all"
                          title="Export Drum Data (.drums)"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </button>
                        <label className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 transition-all cursor-pointer">
                          <Upload className="w-3 h-3" />
                          Import
                          <input 
                            type="file" 
                            accept=".drums" 
                            onChange={handleImportDrums} 
                            className="hidden" 
                          />
                        </label>
                        <button 
                          onClick={() => {
                            const newDrum = {
                              type: `NEW-${drumData.length + 1}`,
                              diameterWithCover: 0,
                              barrelDiameter: 0,
                              innerWidth: 0,
                              outerWidth: 0,
                              weight: 0,
                              price: 0
                            };
                            setDrumData([...drumData, newDrum]);
                          }}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          Add New Drum
                        </button>
                        <button 
                          onClick={() => setDrumData(INITIAL_DRUM_DATA)}
                          className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          Reset to Default
                        </button>
                      </div>
                    </div>

                    <div className="pr-2 border border-slate-100 rounded-xl">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                              <th className="p-2 font-bold text-slate-500 uppercase">Tipe</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">Dia. Flange (D)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">Dia. Barrel (d)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">Inner Width</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">Outer Width</th>
                              <th className="p-2 font-bold text-slate-500 uppercase">Weight (kg)</th>
                              <th className="p-2 font-bold text-slate-500 uppercase text-right">Price (Rp)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {drumData.map((drum, idx) => (
                              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td className="p-2">
                                  <input 
                                    type="text" 
                                    value={drum.type} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, type: e.target.value };
                                      setDrumData(newData);
                                    }}
                                    className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono font-bold text-indigo-600 bg-white focus:ring-1 focus:ring-indigo-500"
                                    title="Tipe Drum"
                                  />
                                </td>
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
                                    title="Diameter With Cover (D)"
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
                                    title="Barrel Diameter (d)"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    value={drum.innerWidth ?? 0} 
                                    onChange={(e) => {
                                      const newData = [...drumData];
                                      newData[idx] = { ...drum, innerWidth: Number(e.target.value) };
                                      setDrumData(newData);
                                    }}
                                    className="w-16 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500"
                                    title="Inner Width"
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
                                    title="Outer Width"
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
                                    title="Weight"
                                  />
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <input 
                                      type="number" 
                                      value={drum.price ?? 0} 
                                      onChange={(e) => {
                                        const newData = [...drumData];
                                        newData[idx] = { ...drum, price: Number(e.target.value) };
                                        setDrumData(newData);
                                      }}
                                      className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-slate-700 bg-white focus:ring-1 focus:ring-indigo-500 text-right"
                                      title="Price"
                                    />
                                    <button 
                                      onClick={() => {
                                        const newData = drumData.filter((_, i) => i !== idx);
                                        setDrumData(newData);
                                      }}
                                      className="text-slate-300 hover:text-red-500 transition-colors"
                                      title="Delete Drum"
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

                      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-bold text-slate-900">Database Lokal (.db)</h3>
                          {dbFileHandle && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Terkoneksi
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                          {dbFileHandle 
                            ? `Terkoneksi dengan: ${dbFileHandle.name}. Setiap kali Anda menyimpan proyek, data akan otomatis disimpan ke file ini.`
                            : (window.self !== window.top)
                              ? 'Di dalam preview, gunakan "Buka Database" untuk memuat file .db dan "Download Database" untuk menyimpan perubahan Anda.'
                              : 'Buat atau buka file cabledesign.db untuk menyimpan proyek secara lokal di komputer Anda.'}
                        </p>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={handleCreateLocalDB}
                            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <Database className="w-4 h-4 text-indigo-600" />
                            Buat Database (.db)
                          </button>
                          <button
                            onClick={handleOpenLocalDB}
                            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <FolderOpen className="w-4 h-4 text-emerald-600" />
                            Buka Database (.db)
                          </button>
                          <button
                            onClick={handleDownloadLocalDB}
                            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <Download className="w-4 h-4 text-indigo-600" />
                            Download Database (.db)
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
          <div className={`${isConfigExpanded ? 'lg:col-span-4' : 'lg:col-span-5'} space-y-6 transition-all duration-300`}>
            
            {isBulkCalculationEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Bulk Calculation Active</h3>
                  <p className="text-xs text-amber-700 mt-1">
                    The results below show a preview for <strong>{params.cores}C x {params.size} mm²</strong>. 
                    Clicking "Bulk Add to Project" will generate and add <strong>{bulkItems.length}</strong> different cable configurations based on your manual list.
                  </p>
                </div>
              </div>
            )}

            {/* Cable Designation Hero */}
            <div className="bg-slate-900 rounded-[2.5rem] p-12 shadow-2xl text-white flex flex-col justify-center items-center text-center relative overflow-hidden border border-slate-800 group">
              {/* Animated Background Elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
              </div>

              <div className="relative z-10 w-full max-w-4xl">
                <div className="flex flex-col items-center gap-4 mb-8">
                  <div className="px-5 py-2 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-xl border border-white/10 shadow-2xl flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                    Cable Designation
                  </div>
                </div>
                
                <h2 className="text-[22px] font-black tracking-tighter mb-10 drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400 leading-[1.1] px-4">
                  {getCableDesignation(params, result)}
                </h2>
                
                <div className="flex flex-wrap justify-center items-center gap-8">
                  <div className="flex flex-col items-center bg-white/5 px-10 py-6 rounded-[2rem] backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 group/item">
                    <span className="text-indigo-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2 group-hover/item:text-indigo-300 transition-colors">Overall Diameter</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tighter">{result.spec.overallDiameter}</span>
                      <span className="text-sm font-bold opacity-40 uppercase tracking-widest">mm</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 px-10 py-6 rounded-[2rem] backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 group/item">
                    <span className="text-purple-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2 group-hover/item:text-purple-300 transition-colors">Total Weight</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tighter">{Math.round(result.bom.totalWeight).toLocaleString()}</span>
                      <span className="text-sm font-bold opacity-40 uppercase tracking-widest">kg/km</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-white/5 px-10 py-6 rounded-[2rem] backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 group/item">
                    <span className="text-emerald-400 uppercase text-[10px] font-black tracking-[0.3em] mb-2 group-hover/item:text-emerald-300 transition-colors">Selling Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold opacity-40 uppercase tracking-widest mr-1">Rp</span>
                      <span className="text-4xl font-black tracking-tighter">{currentSellingPrice.toLocaleString('id-ID')}</span>
                      <span className="text-sm font-bold opacity-40 uppercase tracking-widest">/m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Data & Features */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-2xl">
                      <Settings className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">General Data</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Standard</span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{params.standard}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Voltage Rating</span>
                    <span className="text-xs font-black text-indigo-600">{params.voltage}</span>
                  </div>
                  {params.earthingCores > 0 && params.earthingSize > 0 ? (
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase</span>
                        <span className="text-xs font-bold text-slate-700">
                          {params.cores} x {params.size} mm² {params.conductorMaterial}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earthing</span>
                        <span className="text-xs font-bold text-slate-700">
                          {params.earthingCores} x {params.earthingSize} mm² {params.conductorMaterial}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conductor</span>
                      <span className="text-xs font-bold text-slate-700">
                        {params.cores} x {params.size} mm² {params.conductorMaterial}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Max Op Temp</span>
                      <span className="text-sm font-black text-slate-700">{result.general.maxOperatingTemp}°C</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Short Circuit</span>
                      <span className="text-sm font-black text-slate-700">{result.general.shortCircuitTemp}°C</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Applied Features</span>
                    <div className="flex flex-wrap gap-2">
                      {params.fireguard && (
                        <span className="bg-red-50 text-red-700 text-[9px] font-black px-3 py-1.5 rounded-xl border border-red-100 flex items-center gap-2 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                          FIREGUARD®
                        </span>
                      )}
                      {params.stopfire && (
                        <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-2 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          STOPFIRE®
                        </span>
                      )}
                      {!params.fireguard && (params.flameRetardantCategory === 'None' || !params.flameRetardantCategory) && !params.stopfire && (
                        <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">Standard Spec</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Specification */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-2xl">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Technical Spec</h2>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Phase Core Group */}
                  <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Phase Core ({params.cores}x{params.size})
                      </h3>
                    </div>
                    <SpecRow label="Construction" value={`${result.spec.phaseCore.wireCount} x ${result.spec.phaseCore.wireDiameter.toFixed(2)}`} unit="mm" />
                    <SpecRow label="Conductor Dia" value={result.spec.phaseCore.conductorDiameter} unit="mm" />
                    {params.standard !== 'SPLN 41-6 : 1981 AAC' && (
                      <>
                        <SpecRow label="Insul. Thickness" value={result.spec.phaseCore.insulationThickness} unit="mm" />
                        <SpecRow label="Core Diameter" value={result.spec.phaseCore.coreDiameter} unit="mm" />
                      </>
                    )}
                  </div>

                  {/* Earthing Core Group */}
                  {result.spec.earthingCore && (
                    <div className="bg-emerald-50/30 rounded-2xl p-5 border border-emerald-100 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">
                          {params.standard.includes('NFA2X-T') ? 'Messenger' : 'Earthing'} ({params.earthingCores}x{params.earthingSize})
                        </h3>
                      </div>
                      {result.spec.earthingCore.alWireCount && result.spec.earthingCore.steelWireCount ? (
                        <>
                          <SpecRow label="Aluminium Wire" value={`${result.spec.earthingCore.alWireCount} x ${result.spec.earthingCore.alWireDiameter?.toFixed(2)}`} unit="mm" />
                          <SpecRow label="Steel Wire" value={`${result.spec.earthingCore.steelWireCount} x ${result.spec.earthingCore.steelWireDiameter?.toFixed(2)}`} unit="mm" />
                        </>
                      ) : (
                        <SpecRow label="Construction" value={`${result.spec.earthingCore.wireCount} x ${result.spec.earthingCore.wireDiameter.toFixed(2)}`} unit="mm" />
                      )}
                      <SpecRow label="Conductor Dia" value={result.spec.earthingCore.conductorDiameter} unit="mm" />
                      <SpecRow label="Insul. Thickness" value={result.spec.earthingCore.insulationThickness} unit="mm" />
                      <SpecRow label="Core Diameter" value={result.spec.earthingCore.coreDiameter} unit="mm" />
                    </div>
                  )}

                  <div className="space-y-3 px-1">
                    {result.spec.mgtThickness && (
                      <SpecRow label="Mica Glass Tape" value={result.spec.mgtThickness} unit="mm" />
                    )}
                    {result.spec.conductorScreenThickness && (
                      <SpecRow label="Cond. Screen" value={result.spec.conductorScreenThickness} unit="mm" />
                    )}
                    {result.spec.insulationScreenThickness && (
                      <SpecRow label="Insul. Screen" value={result.spec.insulationScreenThickness} unit="mm" />
                    )}
                    
                    {result.spec.mvScreenDiameter && (
                      <SpecRow label={`Metallic Screen (${params.mvScreenType})`} value={result.spec.mvScreenDiameter} unit="mm" />
                    )}

                    {params.cores > 1 && (
                      <SpecRow label="Laid Up Diameter" value={result.spec.laidUpDiameter} unit="mm" />
                    )}
                    
                    {result.spec.innerCoveringThickness > 0 && (
                      <SpecRow label="Inner Covering" value={result.spec.innerCoveringThickness} unit="mm" />
                    )}
                    
                    {result.spec.screenThickness && (
                      (!isMV && !isInstrumentation) ? (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Overall Screen Details</span>
                          <SpecRow label="Dia Wire Screen" value={CWS_WIRE_DIAMETERS[params.screenSize || (params.standard === 'SPLN 43-4 (NYCY)' ? params.size : 16)] || 0.8} unit="mm" />
                          <SpecRow label="Copper Tape" value={0.1} unit="mm" />
                          <SpecRow label="Overall Thickness" value={result.spec.screenThickness} unit="mm" />
                        </div>
                      ) : (
                        <SpecRow label={`Overall Screen (${params.screenType})`} value={result.spec.screenThickness} unit="mm" />
                      )
                    )}
                    
                    {params.armorType !== 'Unarmored' && (
                      <div className="bg-amber-50/30 p-4 rounded-2xl border border-amber-100 space-y-2">
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-1">Armor Protection</span>
                        <SpecRow label="Dia Under Armor" value={result.spec.diameterUnderArmor} unit="mm" />
                        <SpecRow label="Armor Thickness" value={result.spec.armorThickness} unit="mm" />
                        <SpecRow label="Dia Over Armor" value={result.spec.diameterOverArmor} unit="mm" />
                      </div>
                    )}
                    
                    {!(params.standard.includes('(NYAF)') || params.standard.includes('(NYA)') || params.standard === 'SPLN 41-6 : 1981 AAC' || params.standard === 'SPLN 41-10 : 1991 (AAAC-S)') && params.hasOuterSheath !== false && (
                      <SpecRow label="Outer Sheath" value={result.spec.sheathThickness} unit="mm" />
                    )}
                    
                    <div className="pt-4 mt-4 border-t-2 border-slate-100 border-dashed">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Final Diameter</span>
                        <span className="text-lg font-black text-indigo-600">{result.spec.overallDiameter.toFixed(1)} mm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Packing Data */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 rounded-2xl">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Packing Data</h2>
                  </div>
                </div>
                {(() => {
                  const packing = calculatePacking(result.spec.overallDiameter, result.bom.totalWeight, drumData);
                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard Length</span>
                          <span className="text-2xl font-black text-slate-900">{packing.standardLength} <span className="text-sm font-bold opacity-40">m</span></span>
                        </div>
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
                          <Ruler className="w-6 h-6 text-indigo-500" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drum Type</span>
                          <span className="text-xs font-black text-slate-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{packing.selectedDrum.type}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-50">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimensions</span>
                          <span className="text-xs font-black text-slate-700">
                            {packing.selectedDrum.diameterWithCover / 10} x {packing.selectedDrum.outerWidth / 10} cm
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Weight</span>
                          <span className="text-xs font-black text-slate-700">{packing.netWeight.toLocaleString()} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bill of Material */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 rounded-2xl">
                      <Layers className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Bill of Material</h2>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <SpecRow label={`Conductor (${params.conductorMaterial})`} value={result.bom.conductorWeight - result.bom.earthingConductorWeight} unit="kg/km" />
                    {result.bom.earthingConductorWeight > 0 && (
                      <SpecRow 
                        label={params.standard.includes('NFA2X-T') ? "Messenger (Al+Steel)" : `Earthing Conductor`} 
                        value={result.bom.earthingConductorWeight} 
                        unit="kg/km" 
                      />
                    )}
                  </div>

                  <div className="px-1 space-y-2">
                    {result.bom.mgtWeight > 0 && (
                      <SpecRow label="Mica Glass Tape" value={result.bom.mgtWeight} unit="kg/km" />
                    )}
                    {result.bom.semiCondWeight > 0 && (
                      <SpecRow label="Semi-conductive" value={result.bom.semiCondWeight} unit="kg/km" />
                    )}
                    <SpecRow label={`Insulation (${params.insulationMaterial})`} value={result.bom.insulationWeight - result.bom.earthingInsulationWeight} unit="kg/km" />
                    
                    {result.bom.mvScreenWeight > 0 && (
                      <SpecRow label={`Metallic Screen`} value={result.bom.mvScreenWeight} unit="kg/km" />
                    )}

                    {result.bom.innerCoveringWeight > 0 && (
                      <SpecRow label={`Inner Covering`} value={result.bom.innerCoveringWeight} unit="kg/km" />
                    )}
                    
                    {result.bom.screenWeight > 0 && (
                      <SpecRow label={`Overall Screen`} value={result.bom.screenWeight} unit="kg/km" />
                    )}
                    
                    {params.armorType !== 'Unarmored' && (
                      <SpecRow label={`Armor (${params.armorType})`} value={result.bom.armorWeight} unit="kg/km" />
                    )}

                    {params.hasOuterSheath !== false && (
                      <SpecRow label={`Outer Sheath`} value={result.bom.sheathWeight} unit="kg/km" />
                    )}
                  </div>
                  
                  <div className="pt-4 mt-4 border-t-2 border-slate-100 border-dashed">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Total Weight</span>
                      <span className="text-lg font-black text-slate-900">{result.bom.totalWeight.toLocaleString()} kg/km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Material Weight Calculation (Advance Mode Only) */}
              {params.mode === 'advance' && result.weights && (
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-2xl">
                        <Scale className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">Weight Breakdown</h2>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Formula View</span>
                  </div>
                  
                  <div className="space-y-1">
                    <WeightFormulaRow label="Conductor" detail={result.weights.conductor} formulaKey="conductor" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Mica Glass Tape" detail={result.weights.mgt} formulaKey="mgt" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Insulation" detail={result.weights.insulation} formulaKey="insulation" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Inner Sheath" detail={result.weights.innerSheath} formulaKey="innerSheath" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Armor" detail={result.weights.armor} formulaKey="armor" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                    <WeightFormulaRow label="Outer Sheath" detail={result.weights.outerSheath} formulaKey="outerSheath" customFormulas={params.customFormulas} onFormulaChange={(k, v) => handleParamChange('customFormulas', { ...params.customFormulas, [k]: v })} />
                  </div>
                </div>
              )}

              {/* Electrical Properties */}
              <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-yellow-50 rounded-2xl">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Electrical Properties</h2>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Max DC Res @ 20°C</span>
                      <span className="text-sm font-black text-slate-900">{result.electrical.maxDcResistance.toFixed(4)} <span className="text-[10px] opacity-40">Ω/km</span></span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Short Circuit (1s)</span>
                      <span className="text-sm font-black text-slate-900">{result.electrical.shortCircuitCapacity.toFixed(2)} <span className="text-[10px] opacity-40">kA</span></span>
                    </div>
                  </div>

                  <div className="space-y-2 px-1">
                    <SpecRow label="Current (Air)" value={result.electrical.currentCapacityAir} unit="A" precision={0} />
                    <SpecRow label="Current (Ground)" value={result.electrical.currentCapacityGround} unit="A" precision={0} />
                    <SpecRow label="Test Voltage" value={result.electrical.testVoltage} unit="" />
                  </div>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700"></div>
                
                <div className="relative flex flex-col lg:flex-row gap-12">
                  <div className="lg:w-1/3 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cost Analysis</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Breakdown</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Factory Cost (HPP)</span>
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                          Rp {currentHPP.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-8 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-200 relative overflow-hidden group/price">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover/price:scale-150 transition-transform duration-700"></div>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1 relative z-10">Selling Price</span>
                        <span className="text-4xl font-black text-white font-mono tracking-tighter relative z-10">
                          Rp {currentSellingPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-2/3">
                    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Breakdown</span>
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Per Meter</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                        {(() => {
                          const breakdown = calculateCostBreakdown(result.bom, params, materialPrices);
                          const packing = calculatePacking(result.spec.overallDiameter, result.bom.totalWeight, drumData);
                          const items = [
                            { label: `Conductor`, cost: breakdown.conductor },
                            { label: `Insulation`, cost: breakdown.insulation },
                            { label: `Metallic Screen`, cost: breakdown.mvScreen },
                            { label: `Inner Sheath`, cost: breakdown.innerCovering },
                            { label: `Armor`, cost: breakdown.armorWire + breakdown.armorTape },
                            { label: `Outer Sheath`, cost: breakdown.sheath },
                            { label: `Packing`, cost: packing.packingCostPerMeter },
                          ].filter(item => item.cost > 0);

                          return items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-100/50">
                              <span className="text-xs font-bold text-slate-500">{item.label}</span>
                              <span className="text-xs font-black text-slate-900 font-mono">Rp {item.cost.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                            </div>
                          ));
                        })()}
                      </div>

                      <div className="mt-8 pt-6 border-t-2 border-slate-200 border-dashed flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Margin</span>
                          <span className="text-xl font-black text-emerald-600">Rp {(currentSellingPrice - currentHPP).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-2xl text-xs font-black">
                          {params.margin}% Profit
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project List Section (Right Side) */}
          <div className={`${isConfigExpanded ? 'hidden' : 'lg:col-span-4'} transition-all duration-500`}>
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-2xl">
                    <List className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Project List</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saved Configurations</p>
                  </div>
                </div>
                {projectItems.length > 0 && (
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-indigo-200 animate-bounce">
                    {projectItems.length}
                  </span>
                )}
              </div>

              {projectItems.length > 0 ? (
                <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                  {projectItems.map((item) => (
                    <div key={item.params.id} className="p-5 rounded-3xl border-2 border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <button
                        onClick={() => removeFromProject(item.params.id!)}
                        className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <div className="font-black text-xs text-slate-900 mb-3 pr-8 leading-relaxed">
                        {getCableDesignation(item.params, item.result)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-[9px] bg-white text-indigo-600 px-2.5 py-1 rounded-lg font-black border border-indigo-100 shadow-sm uppercase tracking-wider">
                          {item.params.standard}
                        </span>
                        <span className="text-[9px] bg-white text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 font-bold shadow-sm">
                          OD: {item.result.spec.overallDiameter} mm
                        </span>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100/50 grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold uppercase tracking-widest">Total Weight</span>
                          <span className="font-black text-slate-700">{item.result.bom.totalWeight.toLocaleString()} kg/km</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-indigo-400 font-bold uppercase tracking-widest">HPP / Meter</span>
                          <span className="font-black text-indigo-600">Rp {calculateHPP(item.result, item.params, materialPrices, drumData).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-6 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowReview(true)}
                      className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 active:scale-95 group"
                    >
                      <FileText className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      REVIEW PROJECT
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                    <List className="w-10 h-10 text-slate-200" />
                  </div>
                  <h3 className="text-slate-900 font-black text-sm mb-2">Empty Project</h3>
                  <p className="text-slate-400 text-xs leading-relaxed px-10">
                    Configure your cable design and click <span className="text-indigo-500 font-bold">"Add to Project"</span> to start your list.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

