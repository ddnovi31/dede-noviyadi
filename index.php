<?php
/**
 * Cable Designer - Cable Design Tool (PHP Portable Version)
 * Copy this file to your XAMPP htdocs folder.
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cable Designer - Cable Design Tool</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: #4f46e5;
            cursor: pointer;
            border-radius: 50%;
        }
    </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-900">

    <!-- Login Screen -->
    <div id="login-screen" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
        <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div class="flex flex-col items-center mb-8">
                <div class="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
                    <i data-lucide="layers" class="w-10 h-10 text-white"></i>
                </div>
                <h2 class="text-2xl font-black text-slate-900">Welcome Back</h2>
                <p class="text-slate-500 text-sm">Please sign in to access the designer</p>
            </div>
            
            <form id="login-form" class="space-y-5">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Username</label>
                    <div class="relative">
                        <i data-lucide="user" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <input type="text" id="username" required class="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm" placeholder="Enter username">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Password</label>
                    <div class="relative">
                        <i data-lucide="lock" class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                        <input type="password" id="password" required class="w-full pl-10 pr-4 py-3 rounded-xl border-slate-200 border focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-sm" placeholder="Enter password">
                    </div>
                </div>
                <div id="login-error" class="hidden text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                    Invalid username or password. Please try again.
                </div>
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                    Sign In
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
            </form>
        </div>
    </div>

    <div id="app" class="hidden max-w-[1600px] mx-auto p-4 md:p-8">
        <!-- Header -->
        <header class="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                    <i data-lucide="layers" class="w-8 h-8 text-white"></i>
                </div>
                <div>
                    <h1 class="text-2xl font-black tracking-tight text-slate-900">Cable Designer</h1>
                    <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest">Cable Design Studio</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="window.location.reload()" class="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200">
                    <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Left: Configuration & Prices -->
            <div class="lg:col-span-3 space-y-6">
                <!-- Tab Switcher -->
                <div class="flex p-1 bg-slate-200 rounded-2xl">
                    <button onclick="switchTab('config')" id="tab-config" class="flex-1 py-2 text-sm font-bold rounded-xl transition-all bg-white text-indigo-600 shadow-sm">Configuration</button>
                    <button onclick="switchTab('prices')" id="tab-prices" class="flex-1 py-2 text-sm font-bold rounded-xl transition-all text-slate-500 hover:text-slate-700">Material Prices</button>
                </div>

                <!-- Configuration Tab Content -->
                <div id="content-config" class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="settings" class="w-5 h-5 text-slate-400"></i>
                        Configuration
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Standard Reference</label>
                            <select id="standard" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                <option value="IEC 60502-1">IEC 60502-1 (Low Voltage)</option>
                                <option value="IEC 60502-2">IEC 60502-2 (Medium Voltage)</option>
                                <option value="SNI 04-6629.4 (NYM)">SNI 04-6629.4 (NYM)</option>
                                <option value="SNI 04-6629.3 (NYAF)">SNI 04-6629.3 (NYAF)</option>
                                <option value="SNI 04-6629.5 (NYMHY)">SNI 04-6629.5 (NYMHY)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Voltage Rating (Uo/U)</label>
                            <select id="voltage" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                <!-- Dynamic options -->
                            </select>
                        </div>

                        <button onclick="addToProject()" class="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-[0.98]">
                            <i data-lucide="plus" class="w-5 h-5"></i>
                            Add to Project List
                        </button>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Cores</label>
                                <input type="number" id="cores" min="1" max="80" value="3" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Size (mm²)</label>
                                <select id="size" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                    <!-- Sizes will be populated by JS -->
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Conductor Material</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button onclick="setParam('conductorMaterial', 'Cu')" id="btn-cu" class="py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-indigo-600 text-white shadow-md">Copper (Cu)</button>
                                <button onclick="setParam('conductorMaterial', 'Al')" id="btn-al" class="py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">Aluminum (Al)</button>
                                <button onclick="setParam('conductorMaterial', 'TCu')" id="btn-tcu" class="py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">Tinned Cu (TCu)</button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Insulation</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button onclick="setParam('insulationMaterial', 'XLPE')" id="btn-xlpe" class="py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-indigo-600 text-white shadow-md">XLPE</button>
                                <button onclick="setParam('insulationMaterial', 'PVC')" id="btn-pvc" class="py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200">PVC</button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Armor Type</label>
                            <select id="armorType" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                <option value="Unarmored">Unarmored</option>
                                <option value="SWA">SWA (Steel Wire)</option>
                                <option value="STA">STA (Steel Tape)</option>
                                <option value="AWA">AWA (Aluminum Wire)</option>
                                <option value="GSWB">GSWB (Steel Braid)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Flame Retardant Category</label>
                            <select id="flameRetardantCategory" onchange="updateFRCategory()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                <option value="None">Non Category</option>
                                <option value="Cat.A">Cat.A</option>
                                <option value="Cat.B">Cat.B</option>
                                <option value="Cat.C">Cat.C</option>
                            </select>
                        </div>

                        <div id="mgt-container" class="pt-2">
                            <label class="flex items-center gap-3 cursor-pointer group">
                                <div class="relative">
                                    <input type="checkbox" id="hasMgt" onchange="updateUI()" class="sr-only">
                                    <div id="mgt-toggle-bg" class="block w-10 h-6 rounded-full transition-colors bg-slate-200"></div>
                                    <div id="mgt-toggle-dot" class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-semibold text-slate-700 group-hover:text-orange-600 transition-colors">Fire Resistant (MGT)</span>
                                    <span class="text-[10px] text-slate-400">Add Mica Glass Tape over conductor</span>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Outer Sheath</label>
                            <select id="sheathMaterial" onchange="updateUI()" class="w-full rounded-xl border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-slate-50">
                                <option value="PVC">PVC</option>
                                <option value="PE">PE</option>
                                <option value="LSZH">LSZH</option>
                                <option value="PVC-FR Cat.A">PVC-FR Cat.A</option>
                                <option value="PVC-FR Cat.B">PVC-FR Cat.B</option>
                                <option value="PVC-FR Cat.C">PVC-FR Cat.C</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Material Prices Tab Content -->
                <div id="content-prices" class="hidden bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                    <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
                        <i data-lucide="banknote" class="w-5 h-5 text-slate-400"></i>
                        Material Prices (IDR/kg)
                    </h2>
                    <div class="space-y-4">
                        <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-2">
                            <label class="block text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                                <i data-lucide="percent" class="w-4 h-4"></i>
                                Overhead Cost (%)
                            </label>
                            <div class="flex items-center gap-4">
                                <input type="range" id="overhead-range" min="0" max="50" step="0.5" value="5" oninput="document.getElementById('price-overhead').value = this.value; updatePrices();" class="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600">
                                <div class="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                    <input type="number" id="price-overhead" value="5" oninput="document.getElementById('overhead-range').value = this.value; updatePrices();" class="w-12 bg-transparent border-none p-0 text-sm font-mono font-bold text-indigo-600 focus:ring-0 text-right">
                                    <span class="text-sm font-bold text-slate-400">%</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Copper (Cu)</label>
                            <input type="number" id="price-cu" oninput="updatePrices()" value="150000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Aluminum (Al)</label>
                            <input type="number" id="price-al" oninput="updatePrices()" value="45000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tinned Copper (TCu)</label>
                            <input type="number" id="price-tcu" oninput="updatePrices()" value="165000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">XLPE</label>
                            <input type="number" id="price-xlpe" oninput="updatePrices()" value="35000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">PVC</label>
                            <input type="number" id="price-pvc" oninput="updatePrices()" value="25000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">PVC-FR Cat.A</label>
                            <input type="number" id="price-pvc-fra" oninput="updatePrices()" value="35000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">PVC-FR Cat.B</label>
                            <input type="number" id="price-pvc-frb" oninput="updatePrices()" value="32000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">PVC-FR Cat.C</label>
                            <input type="number" id="price-pvc-frc" oninput="updatePrices()" value="30000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Steel (Armor)</label>
                            <input type="number" id="price-steel" oninput="updatePrices()" value="15000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase mb-1">PE / LSZH</label>
                            <input type="number" id="price-other" oninput="updatePrices()" value="40000" class="w-full rounded-xl border-slate-300 p-2.5 border bg-slate-50 font-mono">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Middle: Results -->
            <div class="lg:col-span-5 space-y-6">
                <div class="bg-indigo-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                    <div class="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white opacity-10 blur-3xl"></div>
                    <div class="relative z-10">
                        <h3 class="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em] mb-3">Cable Designation</h3>
                        <div id="main-designation" class="text-2xl md:text-3xl font-black tracking-tight font-mono leading-tight">
                            Cu/XLPE/PVC 3 x 50 mm² (rm) 0.6/1 kV
                        </div>
                        <div class="mt-6 flex flex-wrap items-center gap-4">
                            <div class="bg-white/20 px-5 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                                <span class="text-indigo-100 text-[10px] uppercase font-bold block mb-0.5">Overall Diameter</span>
                                <div class="flex flex-col gap-1 mt-1">
                                    <span id="main-diameter" class="text-xl font-black">28.50 mm</span>
                                    <div class="flex gap-1">
                                        <div id="fireguard-badge" class="hidden">
                                            <span class="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-400">FireGuard®</span>
                                        </div>
                                        <div id="stopfire-badge" class="hidden">
                                            <span class="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-orange-400">StopFire®</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="bg-white/20 px-5 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                                <span class="text-indigo-100 text-[10px] uppercase font-bold block mb-0.5">Total Weight</span>
                                <span id="main-weight" class="text-xl font-black">1,850 kg/km</span>
                            </div>
                            <div class="bg-emerald-500/30 px-5 py-2 rounded-2xl backdrop-blur-md border border-emerald-400/20">
                                <span class="text-emerald-100 text-[10px] uppercase font-bold block mb-0.5">HPP / Meter</span>
                                <span id="main-hpp" class="text-xl font-black">Rp 275.000</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Tech Spec -->
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                            Technical Spec
                        </h2>
                        <div id="spec-list" class="space-y-3">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- BOM -->
                    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                            <i data-lucide="package" class="w-4 h-4"></i>
                            Bill of Material
                        </h2>
                        <div id="bom-list" class="space-y-3">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Project List -->
            <div class="lg:col-span-4">
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full min-h-[500px]">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold flex items-center gap-2">
                            <i data-lucide="list" class="w-6 h-6 text-indigo-600"></i>
                            Project List
                        </h2>
                        <span id="project-count" class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">0</span>
                    </div>

                    <div id="project-list" class="space-y-4">
                        <!-- Empty state -->
                        <div id="empty-state" class="flex flex-col items-center justify-center py-20 text-center">
                            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <i data-lucide="list" class="w-8 h-8 text-slate-300"></i>
                            </div>
                            <p class="text-slate-400 text-sm">No items added yet.<br>Configure a cable and click "Add".</p>
                        </div>
                    </div>

                    <div id="project-actions" class="hidden pt-6 mt-6 border-t border-slate-100 space-y-3">
                        <button onclick="showProjectReview()" class="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-semibold transition-all shadow-sm">
                            <i data-lucide="file-text" class="w-5 h-5"></i>
                            Review Project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Project Review Modal -->
    <div id="review-modal" class="fixed inset-0 z-50 hidden overflow-y-auto bg-slate-900/50 backdrop-blur-sm p-4 md:p-8">
        <div class="max-w-5xl mx-auto space-y-8 bg-slate-50 p-6 md:p-10 rounded-3xl shadow-2xl">
            <!-- Review Header -->
            <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div class="flex items-center gap-4">
                    <button onclick="hideProjectReview()" class="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                        <i data-lucide="arrow-left" class="w-6 h-6"></i>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-900">Project Review</h1>
                        <p class="text-sm text-slate-500">Summary of all designed cables and total estimated costs</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="window.print()" class="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                        <i data-lucide="printer" class="w-4 h-4"></i>
                        Print Summary
                    </button>
                    <button onclick="hideProjectReview()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-md">
                        Back to Designer
                    </button>
                </div>
            </div>

            <!-- Project Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Items</div>
                    <div id="review-total-items" class="text-3xl font-bold text-slate-900">0 Cables</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Estimated Project HPP (per meter sum)</div>
                    <div id="review-total-price" class="text-3xl font-bold text-indigo-600 font-mono">Rp 0</div>
                </div>
            </div>

            <!-- Detailed Items Table -->
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-6 border-b border-slate-100">
                    <h2 class="text-lg font-bold flex items-center gap-2">
                        <i data-lucide="list" class="w-5 h-5 text-indigo-600"></i>
                        Cable Specifications & Costs
                    </h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                                <th class="px-6 py-4 border-b border-slate-100">Designation</th>
                                <th className="px-6 py-4 border-b border-slate-100">Dimensions</th>
                                <th className="px-6 py-4 border-b border-slate-100">Weight</th>
                                <th className="px-6 py-4 border-b border-slate-100 text-right">HPP / Meter</th>
                            </tr>
                        </thead>
                        <tbody id="review-table-body" class="divide-y divide-slate-100">
                            <!-- Populated by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Footer -->
            <footer class="text-center py-8 border-t border-slate-200">
                <div class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PT. Multi Kencana Niagatama</div>
                <div id="review-date" class="text-[9px] text-slate-300 mt-1">Generated on ...</div>
            </footer>
        </div>
    </div>

    <script>
        // --- Authentication ---
        const AUTH_USER = 'dede';
        const AUTH_PASS = 'Tangerang123';

        function checkAuth() {
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
            const loginScreen = document.getElementById('login-screen');
            const app = document.getElementById('app');
            
            if (isLoggedIn) {
                loginScreen.classList.add('hidden');
                app.classList.remove('hidden');
            } else {
                loginScreen.classList.remove('hidden');
                app.classList.add('hidden');
            }
        }

        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            const error = document.getElementById('login-error');

            if (user === AUTH_USER && pass === AUTH_PASS) {
                sessionStorage.setItem('isLoggedIn', 'true');
                error.classList.add('hidden');
                checkAuth();
                lucide.createIcons();
            } else {
                error.classList.remove('hidden');
            }
        });

        // Initialize auth
        checkAuth();

        // --- Data & Constants ---
        const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000];
        
        const LAYING_UP_FACTORS = {
            1: 1.0, 2: 2.0, 3: 2.15, 4: 2.41, 5: 2.7, 7: 3.0, 10: 3.7, 12: 4.15, 14: 4.41, 19: 5.0, 24: 5.7, 30: 6.41, 37: 7.0, 48: 8.0, 61: 9.0, 80: 10.5
        };

        function getLayingUpFactor(cores) {
            if (cores <= 1) return 1;
            if (LAYING_UP_FACTORS[cores]) return LAYING_UP_FACTORS[cores];
            const sortedCores = Object.keys(LAYING_UP_FACTORS).map(Number).sort((a, b) => a - b);
            for (let i = 0; i < sortedCores.length - 1; i++) {
                if (cores > sortedCores[i] && cores < sortedCores[i+1]) {
                    const c1 = sortedCores[i];
                    const c2 = sortedCores[i+1];
                    const f1 = LAYING_UP_FACTORS[c1];
                    const f2 = LAYING_UP_FACTORS[c2];
                    return f1 + (f2 - f1) * (cores - c1) / (c2 - c1);
                }
            }
            return 1.15 * Math.sqrt(cores);
        }

        let params = {
            standard: 'IEC 60502-1',
            voltage: '0.6/1 kV',
            cores: 3,
            size: 50,
            conductorMaterial: 'Cu',
            conductorType: 'rm',
            insulationMaterial: 'XLPE',
            armorType: 'Unarmored',
            sheathMaterial: 'PVC',
            braidCoverage: 90,
            flameRetardantCategory: 'None',
            hasMgt: false,
            overhead: 5
        };

        let materialPrices = {
            Cu: 150000,
            Al: 45000,
            TCu: 165000,
            XLPE: 35000,
            PVC: 25000,
            'PVC-FR Cat.A': 35000,
            'PVC-FR Cat.B': 32000,
            'PVC-FR Cat.C': 30000,
            Steel: 15000,
            Other: 40000,
            MGT: 50000
        };

        let projectItems = [];

        // --- Logic Functions ---
        function switchTab(tab) {
            const configTab = document.getElementById('tab-config');
            const pricesTab = document.getElementById('tab-prices');
            const configContent = document.getElementById('content-config');
            const pricesContent = document.getElementById('content-prices');

            if (tab === 'config') {
                configTab.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
                configTab.classList.remove('text-slate-500');
                pricesTab.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
                pricesTab.classList.add('text-slate-500');
                configContent.classList.remove('hidden');
                pricesContent.classList.add('hidden');
            } else {
                pricesTab.classList.add('bg-white', 'text-indigo-600', 'shadow-sm');
                pricesTab.classList.remove('text-slate-500');
                configTab.classList.remove('bg-white', 'text-indigo-600', 'shadow-sm');
                configTab.classList.add('text-slate-500');
                pricesContent.classList.remove('hidden');
                configContent.classList.add('hidden');
            }
            lucide.createIcons();
        }

        function updatePrices() {
            const cuEl = document.getElementById('price-cu');
            const alEl = document.getElementById('price-al');
            const tcuEl = document.getElementById('price-tcu');
            const xlpeEl = document.getElementById('price-xlpe');
            const pvcEl = document.getElementById('price-pvc');
            const pvcFraEl = document.getElementById('price-pvc-fra');
            const pvcFrbEl = document.getElementById('price-pvc-frb');
            const pvcFrcEl = document.getElementById('price-pvc-frc');
            const steelEl = document.getElementById('price-steel');
            const otherEl = document.getElementById('price-other');

            if (cuEl) materialPrices.Cu = parseFloat(cuEl.value) || 0;
            if (alEl) materialPrices.Al = parseFloat(alEl.value) || 0;
            if (tcuEl) materialPrices.TCu = parseFloat(tcuEl.value) || 0;
            if (xlpeEl) materialPrices.XLPE = parseFloat(xlpeEl.value) || 0;
            if (pvcEl) materialPrices.PVC = parseFloat(pvcEl.value) || 0;
            if (pvcFraEl) materialPrices['PVC-FR Cat.A'] = parseFloat(pvcFraEl.value) || 0;
            if (pvcFrbEl) materialPrices['PVC-FR Cat.B'] = parseFloat(pvcFrbEl.value) || 0;
            if (pvcFrcEl) materialPrices['PVC-FR Cat.C'] = parseFloat(pvcFrcEl.value) || 0;
            if (steelEl) materialPrices.Steel = parseFloat(steelEl.value) || 0;
            if (otherEl) materialPrices.Other = parseFloat(otherEl.value) || 0;
            
            const overheadEl = document.getElementById('price-overhead');
            if (overheadEl) params.overhead = parseFloat(overheadEl.value) || 0;

            updateUI();
        }

        function calculateCable() {
            const { cores, size, conductorMaterial, insulationMaterial, armorType, sheathMaterial, hasMgt, overhead } = params;
            
            // Simplified calculation logic for portable version
            const condDiam = Math.sqrt(size / 0.785) * 1.1;
            const mgtThick = hasMgt ? 0.2 : 0;
            const insThick = insulationMaterial === 'XLPE' ? (size <= 35 ? 0.7 : size <= 95 ? 0.9 : 1.1) : (size <= 6 ? 0.8 : size <= 16 ? 1.0 : 1.2);
            const coreDiam = condDiam + (2 * mgtThick) + (2 * insThick);
            
            let laidUpFactor = getLayingUpFactor(cores);
            let laidUpDiam = cores === 1 ? coreDiam : coreDiam * laidUpFactor;
            let diamUnderArmor = laidUpDiam;
            let armorThick = 0;
            
            if (armorType !== 'Unarmored') {
                const innerCov = cores > 1 ? 1.2 : 0;
                diamUnderArmor += (2 * innerCov);
                armorThick = armorType === 'STA' ? 0.5 : 1.6;
            }
            
            const diamOverArmor = diamUnderArmor + (2 * armorThick);
            const sheathThick = 1.8;
            const overallDiam = diamOverArmor + (2 * sheathThick);
            
            // Weights (kg/km)
            const condDensity = conductorMaterial === 'Cu' ? 8.89 : (conductorMaterial === 'Al' ? 2.7 : 8.89);
            const condWeight = size * cores * condDensity * 1.02;
            const insWeight = (Math.PI * (coreDiam**2 - condDiam**2) / 4) * cores * (insulationMaterial === 'XLPE' ? 0.95 : 1.4);
            const armorWeight = armorType === 'Unarmored' ? 0 : (Math.PI * (diamOverArmor**2 - diamUnderArmor**2) / 4) * 7.85;
            const sheathWeight = (Math.PI * (overallDiam**2 - diamOverArmor**2) / 4) * (sheathMaterial === 'PVC' ? 1.45 : 0.95);
            const totalWeight = condWeight + insWeight + armorWeight + sheathWeight + (cores > 1 ? condWeight * 0.1 : 0);

            // HPP Calculation
            let condPrice = materialPrices.Cu;
            if (conductorMaterial === 'Al') condPrice = materialPrices.Al;
            if (conductorMaterial === 'TCu') condPrice = materialPrices.TCu;
            const insPrice = insulationMaterial === 'XLPE' ? materialPrices.XLPE : materialPrices.PVC;
            const armorPrice = materialPrices.Steel;
            const sheathPrice = materialPrices[sheathMaterial] || materialPrices.PVC;

            const hppKm = (condWeight * condPrice) + (insWeight * insPrice) + (armorWeight * armorPrice) + (sheathWeight * sheathPrice);
            const baseHppMeter = hppKm / 1000;
            const overheadFactor = 1 + (params.overhead || 0) / 100;
            const hppMeter = baseHppMeter * overheadFactor;

            return {
                spec: {
                    conductorDiameter: condDiam,
                    insulationThickness: insThick,
                    coreDiameter: coreDiam,
                    overallDiameter: overallDiam,
                    armorThickness: armorThick
                },
                bom: {
                    conductorWeight: condWeight,
                    insulationWeight: insWeight,
                    armorWeight: armorWeight,
                    sheathWeight: sheathWeight,
                    totalWeight: totalWeight
                },
                cost: {
                    hppKm: hppKm,
                    hppMeter: hppMeter
                },
                electrical: {
                    voltageRating: params.voltage
                }
            };
        }

        // --- UI Functions ---
        function updateUI() {
            // Sync params from inputs
            const standardEl = document.getElementById('standard');
            const coresEl = document.getElementById('cores');
            const sizeEl = document.getElementById('size');
            const armorTypeEl = document.getElementById('armorType');
            const sheathMaterialEl = document.getElementById('sheathMaterial');
            const frCategoryEl = document.getElementById('flameRetardantCategory');
            const voltSelect = document.getElementById('voltage');
            const mgtEl = document.getElementById('hasMgt');

            if (!standardEl || !coresEl || !sizeEl || !armorTypeEl || !sheathMaterialEl || !voltSelect || !frCategoryEl || !mgtEl) return;

            params.standard = standardEl.value;
            params.cores = parseInt(coresEl.value) || 1;

            // Core count constraint: if cores > 5, max size is 10mm2
            if (params.cores > 5 && params.size > 10) {
                params.size = 10;
            }

            // Populate sizes based on core count
            const currentSize = params.size;
            sizeEl.innerHTML = '';
            CABLE_SIZES.filter(s => params.cores <= 5 || s <= 10).forEach(s => {
                const opt = new Option(s + ' mm²', s);
                if (s === currentSize) opt.selected = true;
                sizeEl.add(opt);
            });
            params.size = parseFloat(sizeEl.value) || 1.5;

            params.armorType = armorTypeEl.value;
            params.sheathMaterial = sheathMaterialEl.value;
            params.flameRetardantCategory = frCategoryEl.value;
            params.hasMgt = mgtEl.checked;

            // Standard specific constraints
            if (params.standard.includes('SNI 04-6629')) {
                if (params.standard.includes('NYM')) {
                    if (params.cores < 2) { params.cores = 2; coresEl.value = 2; }
                    if (params.cores > 5) { params.cores = 5; coresEl.value = 5; }
                    if (params.size > 35) { params.size = 35; sizeEl.value = 35; }
                    params.insulationMaterial = 'PVC';
                    params.armorType = 'Unarmored';
                    armorTypeEl.value = 'Unarmored';
                    armorTypeEl.disabled = true;
                } else if (params.standard.includes('NYAF')) {
                    params.cores = 1;
                    coresEl.value = 1;
                    coresEl.disabled = true;
                    params.conductorType = 'f';
                    params.armorType = 'Unarmored';
                    armorTypeEl.value = 'Unarmored';
                    armorTypeEl.disabled = true;
                } else if (params.standard.includes('NYMHY')) {
                    params.conductorType = 'f';
                    params.armorType = 'Unarmored';
                    armorTypeEl.value = 'Unarmored';
                    armorTypeEl.disabled = true;
                }
            } else {
                armorTypeEl.disabled = false;
                coresEl.disabled = false;
            }

            // Update MGT Toggle UI
            const mgtBg = document.getElementById('mgt-toggle-bg');
            const mgtDot = document.getElementById('mgt-toggle-dot');
            if (mgtBg && mgtDot) {
                if (params.hasMgt) {
                    mgtBg.classList.replace('bg-slate-200', 'bg-orange-500');
                    mgtDot.classList.add('translate-x-4');
                } else {
                    mgtBg.classList.replace('bg-orange-500', 'bg-slate-200');
                    mgtDot.classList.remove('translate-x-4');
                }
            }

            // Show/Hide MGT based on Standard
            const mgtContainer = document.getElementById('mgt-container');
            if (mgtContainer) {
                if (params.standard === 'IEC 60502-1') {
                    mgtContainer.classList.remove('hidden');
                } else {
                    mgtContainer.classList.add('hidden');
                    mgtEl.checked = false;
                    params.hasMgt = false;
                }
            }
            
            // Update Voltage Options based on Standard
            voltSelect.innerHTML = '';
            if (params.standard === 'IEC 60502-2') {
                ['3.6/6 kV', '6/10 kV', '8.7/15 kV', '12/20 kV', '18/30 kV'].forEach(v => {
                    const opt = new Option(v, v);
                    voltSelect.add(opt);
                });
            } else {
                const v = params.standard.includes('NYM') ? '300/500 V' : '0.6/1 kV';
                voltSelect.add(new Option(v, v));
            }
            params.voltage = voltSelect.value;

            const result = calculateCable();
            
            // Update Main Display
            const mainDesignation = document.getElementById('main-designation');
            const mainDiameter = document.getElementById('main-diameter');
            const mainWeight = document.getElementById('main-weight');
            const mainHpp = document.getElementById('main-hpp');

            if (mainDesignation && mainDiameter && mainWeight && mainHpp) {
                const mgt = params.hasMgt ? '/MGT' : '';
                const designation = `${params.conductorMaterial}${mgt}/${params.insulationMaterial}/${params.armorType === 'Unarmored' ? '' : params.armorType + '/'}${params.sheathMaterial} ${params.cores} x ${params.size} mm² (${params.conductorType}) ${params.voltage}`;
                mainDesignation.innerText = designation;
                mainDiameter.innerText = result.spec.overallDiameter.toFixed(2) + ' mm';
                mainWeight.innerText = Math.round(result.bom.totalWeight).toLocaleString() + ' kg/km';
                mainHpp.innerText = 'Rp ' + Math.round(result.cost.hppMeter).toLocaleString();

                // Update Badges
                const stopFireBadge = document.getElementById('stopfire-badge');
                if (stopFireBadge) {
                    if (params.flameRetardantCategory && params.flameRetardantCategory !== 'None') {
                        stopFireBadge.classList.remove('hidden');
                    } else {
                        stopFireBadge.classList.add('hidden');
                    }
                }

                const fireGuardBadge = document.getElementById('fireguard-badge');
                if (fireGuardBadge) {
                    if (params.hasMgt) {
                        fireGuardBadge.classList.remove('hidden');
                    } else {
                        fireGuardBadge.classList.add('hidden');
                    }
                }
            }

            // Update Tech Spec List
            const specList = document.getElementById('spec-list');
            if (specList) {
                specList.innerHTML = `
                    ${renderSpecRow('Conductor Diameter', result.spec.conductorDiameter, 'mm')}
                    ${renderSpecRow('Insulation Thickness', result.spec.insulationThickness, 'mm')}
                    ${renderSpecRow('Core Diameter', result.spec.coreDiameter, 'mm')}
                    ${params.armorType !== 'Unarmored' ? renderSpecRow('Armor Thickness', result.spec.armorThickness, 'mm') : ''}
                    ${renderSpecRow('Overall Diameter', result.spec.overallDiameter, 'mm', true)}
                    <div class="pt-2 mt-2 border-t border-slate-100">${renderSpecRow('HPP / Meter', result.cost.hppMeter, 'IDR', true)}</div>
                `;
            }

            // Update BOM List
            const bomList = document.getElementById('bom-list');
            if (bomList) {
                bomList.innerHTML = `
                    ${renderSpecRow(`Conductor (${params.conductorMaterial})`, result.bom.conductorWeight, 'kg/km')}
                    ${renderSpecRow(`Insulation (${params.insulationMaterial})`, result.bom.insulationWeight, 'kg/km')}
                    ${params.armorType !== 'Unarmored' ? renderSpecRow(`Armor (${params.armorType})`, result.bom.armorWeight, 'kg/km') : ''}
                    ${renderSpecRow(`Sheath (${params.sheathMaterial})`, result.bom.sheathWeight, 'kg/km')}
                    <div class="pt-2 mt-2 border-t border-slate-100">${renderSpecRow('Total Weight', result.bom.totalWeight, 'kg/km', true)}</div>
                `;
            }

            lucide.createIcons();
        }

        function renderSpecRow(label, value, unit, isBold = false) {
            return `
                <div class="flex justify-between items-center py-1 ${isBold ? 'font-bold text-slate-900' : 'text-sm text-slate-600'}">
                    <span>${label}</span>
                    <span class="font-mono text-slate-900">${value.toFixed(2)} <span class="text-slate-400 text-[10px] ml-1">${unit}</span></span>
                </div>
            `;
        }

        function setParam(key, value) {
            params[key] = value;
            // Update button styles
            if (key === 'conductorMaterial') {
                document.getElementById('btn-cu').className = value === 'Cu' ? 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-indigo-600 text-white shadow-md' : 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
                document.getElementById('btn-al').className = value === 'Al' ? 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-indigo-600 text-white shadow-md' : 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
                document.getElementById('btn-tcu').className = value === 'TCu' ? 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-indigo-600 text-white shadow-md' : 'py-2 px-2 rounded-xl text-[11px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
            }
            if (key === 'insulationMaterial') {
                document.getElementById('btn-xlpe').className = value === 'XLPE' ? 'py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-indigo-600 text-white shadow-md' : 'py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
                document.getElementById('btn-pvc').className = value === 'PVC' ? 'py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-indigo-600 text-white shadow-md' : 'py-2 px-4 rounded-xl text-sm font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200';
            }
            updateUI();
        }

        function updateFRCategory() {
            const frCategoryEl = document.getElementById('flameRetardantCategory');
            const sheathMaterialEl = document.getElementById('sheathMaterial');
            if (!frCategoryEl || !sheathMaterialEl) return;

            const cat = frCategoryEl.value;
            if (cat === 'None') {
                sheathMaterialEl.value = 'PVC';
            } else {
                sheathMaterialEl.value = `PVC-FR ${cat}`;
            }
            updateUI();
        }

        function addToProject() {
            const result = calculateCable();
            const id = Date.now();
            const designation = `${params.conductorMaterial}/${params.insulationMaterial}/${params.armorType === 'Unarmored' ? '' : params.armorType + '/'}${params.sheathMaterial} ${params.cores} x ${params.size} mm² (${params.conductorType}) ${params.voltage}`;
            
            projectItems.push({ id, params: {...params}, result, designation });
            renderProjectList();
        }

        function removeFromProject(id) {
            projectItems = projectItems.filter(item => item.id !== id);
            renderProjectList();
        }

        function renderProjectList() {
            const list = document.getElementById('project-list');
            const count = document.getElementById('project-count');
            const actions = document.getElementById('project-actions');

            if (!list || !count || !actions) return;

            count.innerText = projectItems.length;
            
            if (projectItems.length === 0) {
                list.innerHTML = `
                    <div id="empty-state" class="flex flex-col items-center justify-center py-20 text-center">
                        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <i data-lucide="list" class="w-8 h-8 text-slate-300"></i>
                        </div>
                        <p class="text-slate-400 text-sm">No items added yet.<br>Configure a cable and click "Add".</p>
                    </div>
                `;
                actions.classList.add('hidden');
            } else {
                actions.classList.remove('hidden');
                list.innerHTML = projectItems.map(item => `
                    <div class="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group relative">
                        <button onclick="removeFromProject(${item.id})" class="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        <div class="font-mono text-[10px] font-bold text-slate-900 mb-1 pr-6 leading-tight">
                            ${item.designation}
                        </div>
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold border border-indigo-100">${item.params.standard}</span>
                            <span class="text-[9px] bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 font-mono">OD: ${item.result.spec.overallDiameter.toFixed(2)} mm</span>
                            <span class="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">HPP: Rp ${Math.round(item.result.cost.hppMeter).toLocaleString()}</span>
                        </div>
                        <div class="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-x-4 gap-y-1">
                            <div class="flex justify-between text-[9px] text-slate-500">
                                <span>Cond (${item.params.conductorMaterial}):</span>
                                <span class="font-mono">${item.result.bom.conductorWeight.toFixed(1)}</span>
                            </div>
                            <div class="flex justify-between text-[9px] text-slate-500">
                                <span>Ins (${item.params.insulationMaterial}):</span>
                                <span class="font-mono">${item.result.bom.insulationWeight.toFixed(1)}</span>
                            </div>
                            <div class="flex justify-between text-[9px] font-bold text-slate-700 col-span-2 mt-1 pt-1 border-t border-slate-50">
                                <span>Total Weight:</span>
                                <span class="font-mono">${Math.round(item.result.bom.totalWeight)} kg/km</span>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            lucide.createIcons();
        }

        function showProjectReview() {
            const modal = document.getElementById('review-modal');
            const tableBody = document.getElementById('review-table-body');
            const totalItemsEl = document.getElementById('review-total-items');
            const totalPriceEl = document.getElementById('review-total-price');
            const dateEl = document.getElementById('review-date');

            if (!modal || !tableBody || !totalItemsEl || !totalPriceEl || !dateEl) return;

            let totalPrice = 0;
            tableBody.innerHTML = projectItems.map(item => {
                const hpp = item.result.cost.hppMeter;
                totalPrice += hpp;
                return `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-6 py-4">
                            <div class="font-mono text-xs font-bold text-slate-900">${item.designation}</div>
                            <div class="text-[10px] text-slate-400 mt-1">${item.params.standard}</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-xs text-slate-600">OD: <span class="font-mono text-slate-900">${item.result.spec.overallDiameter.toFixed(2)} mm</span></div>
                            <div class="text-[10px] text-slate-400">Core: ${item.result.spec.coreDiameter.toFixed(2)} mm</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-xs text-slate-900 font-mono">${Math.round(item.result.bom.totalWeight).toLocaleString()} kg/km</div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="text-sm font-bold text-indigo-600 font-mono">Rp ${Math.round(hpp).toLocaleString()}</div>
                        </td>
                    </tr>
                `;
            }).join('');

            totalItemsEl.innerText = projectItems.length + ' Cables';
            totalPriceEl.innerText = 'Rp ' + Math.round(totalPrice).toLocaleString();
            dateEl.innerText = 'Generated on ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

            modal.classList.remove('hidden');
            lucide.createIcons();
        }

        function hideProjectReview() {
            const modal = document.getElementById('review-modal');
            if (modal) modal.classList.add('hidden');
        }

        function downloadReport() {
            const data = JSON.stringify(projectItems, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Cable_Project_Report.json';
            a.click();
        }

        function viewReport() {
            const reportWindow = window.open('', '_blank');
            if (!reportWindow) {
                alert('Please allow popups to view the report.');
                return;
            }
            const date = new Date().toLocaleString();
            
            let html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Cable Designer - Project Report</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Inter', sans-serif; padding: 40px; background: white; }
                        @media print {
                            body { padding: 0; }
                            .no-print { display: none; }
                        }
                        .font-mono { font-family: 'JetBrains Mono', monospace; }
                    </style>
                </head>
                <body class="text-slate-900">
                    <div class="max-w-4xl mx-auto">
                        <div class="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                            <div>
                                <h1 class="text-3xl font-black tracking-tighter">Cable Designer</h1>
                                <p class="text-sm font-bold text-indigo-600 uppercase tracking-widest">Technical Project Report</p>
                            </div>
                            <div class="text-right">
                                <p class="text-xs text-slate-500 uppercase font-bold">Generated On</p>
                                <p class="text-sm font-mono">${date}</p>
                            </div>
                        </div>

                        <div class="no-print mb-8 flex gap-4">
                            <button onclick="window.print()" class="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-all">Print Report</button>
                            <button onclick="window.close()" class="border border-slate-200 px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all">Close</button>
                        </div>

                        <div class="space-y-12">
                            ${projectItems.map((item, index) => `
                                <div class="border-b border-slate-100 pb-12 last:border-0">
                                    <div class="flex items-center gap-4 mb-6">
                                        <span class="bg-slate-900 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm">${index + 1}</span>
                                        <h2 class="text-xl font-bold font-mono">${item.designation}</h2>
                                    </div>

                                    <div class="grid grid-cols-2 gap-8">
                                        <!-- Technical Specifications -->
                                        <div>
                                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Technical Specifications</h3>
                                            <table class="w-full text-sm">
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Standard</td>
                                                    <td class="py-2 font-bold text-right">${item.params.standard}</td>
                                                </tr>
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Conductor Diameter</td>
                                                    <td class="py-2 font-mono text-right">${item.result.spec.conductorDiameter.toFixed(2)} mm</td>
                                                </tr>
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Insulation Thickness</td>
                                                    <td class="py-2 font-mono text-right">${item.result.spec.insulationThickness.toFixed(2)} mm</td>
                                                </tr>
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Core Diameter</td>
                                                    <td class="py-2 font-mono text-right">${item.result.spec.coreDiameter.toFixed(2)} mm</td>
                                                </tr>
                                                ${item.result.spec.armorThickness > 0 ? `
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Armor Thickness</td>
                                                    <td class="py-2 font-mono text-right">${item.result.spec.armorThickness.toFixed(2)} mm</td>
                                                </tr>
                                                ` : ''}
                                                <tr class="border-b-2 border-slate-900 font-bold">
                                                    <td class="py-2">Overall Diameter</td>
                                                    <td class="py-2 font-mono text-right">${item.result.spec.overallDiameter.toFixed(2)} mm</td>
                                                </tr>
                                                <tr class="border-b-2 border-emerald-600 font-bold text-emerald-600">
                                                    <td class="py-2">HPP / Meter</td>
                                                    <td class="py-2 font-mono text-right">Rp ${Math.round(item.result.cost.hppMeter).toLocaleString()}</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <!-- Bill of Material -->
                                        <div>
                                            <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Bill of Material (per km)</h3>
                                            <table class="w-full text-sm">
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Conductor (${item.params.conductorMaterial})</td>
                                                    <td class="py-2 font-mono text-right">${item.result.bom.conductorWeight.toFixed(2)} kg</td>
                                                </tr>
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Insulation (${item.params.insulationMaterial})</td>
                                                    <td class="py-2 font-mono text-right">${item.result.bom.insulationWeight.toFixed(2)} kg</td>
                                                </tr>
                                                ${item.result.bom.armorWeight > 0 ? `
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Armor (${item.params.armorType})</td>
                                                    <td class="py-2 font-mono text-right">${item.result.bom.armorWeight.toFixed(2)} kg</td>
                                                </tr>
                                                ` : ''}
                                                <tr class="border-b border-slate-50">
                                                    <td class="py-2 text-slate-500">Outer Sheath (${item.params.sheathMaterial})</td>
                                                    <td class="py-2 font-mono text-right">${item.result.bom.sheathWeight.toFixed(2)} kg</td>
                                                </tr>
                                                <tr class="border-b-2 border-slate-900 font-bold">
                                                    <td class="py-2">Total Weight</td>
                                                    <td class="py-2 font-mono text-right">${Math.round(item.result.bom.totalWeight).toLocaleString()} kg</td>
                                                </tr>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <footer class="mt-20 pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                            &copy; ${new Date().getFullYear()} Cable Designer - Cable Design Studio. All technical data are calculated values.
                        </footer>
                    </div>
                </body>
                </html>
            `;
            
            reportWindow.document.write(html);
            reportWindow.document.close();
        }

        // Initialize
        window.onload = () => {
            const sizeSelect = document.getElementById('size');
            if (sizeSelect) {
                CABLE_SIZES.forEach(s => sizeSelect.add(new Option(s + ' mm²', s)));
                sizeSelect.value = 50;
            }
            updateUI();
            lucide.createIcons();
        };
    </script>
</body>
</html>
