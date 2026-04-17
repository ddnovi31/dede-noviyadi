const fs = require('fs');

function refactorConfig() {
  const file = 'src/components/CableDesigner.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Find the config pane
  const searchStart = "{activeTab === 'config' && (\n                  <div className=\"space-y-4\">";
  const replaceStart = "{activeTab === 'config' && (\n                  <div className=\"grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 items-start\">";
  
  if (!content.includes(searchStart)) {
    console.log("Could not find start");
    return;
  }
  
  // We will manually inject wrapping <div> elements.
  // 1. Wrap General Settings
  content = content.replace(
    "{/* Design Mode Toggle */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Settings className=\"w-4 h-4 text-indigo-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">General Settings</h3>\n                      </div>\n                      {/* Design Mode Toggle */}"
  );

  content = content.replace(
    "{/* Bulk Calculation Toggle */}",
    "</div>\n                    {/* Bulk Calculation Toggle */}"
  );

  // Group 2: Wrap Cable Features & Options
  // Replace only around Features Section
  content = content.replace(
    "{/* Features Section */}\n                    <div className=\"bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4\">\n                      <label className=\"block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2\">1. Cable Features</label>",
    "{/* Features Section */}\n                    <div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Zap className=\"w-4 h-4 text-amber-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Properties</h3>\n                      </div>"
  );

  // For the grid wrapper:
  content = content.replace(searchStart, replaceStart);

  // Wrap Phase Conductor section
  content = content.replace(
    "{/* Cores and Size in one row */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Layers className=\"w-4 h-4 text-emerald-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Phase Conductor</h3>\n                      </div>\n                      {/* Cores and Size in one row */}"
  );
  
  // Close Phase Conductor section right before Earthing Core Section
  content = content.replace(
    "{/* Earthing Core Section */}",
    "</div>\n                    {/* Earthing Core Section */}"
  );
  
  // Wrap Earthing & Neutral Section
  content = content.replace(
    "{/* Earthing Core Section */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Zap className=\"w-4 h-4 text-emerald-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Earth & Neutral</h3>\n                      </div>\n                      {/* Earthing Core Section */}"
  );
  
  // Close Earth & Neutral before Insulation Section
  content = content.replace(
    "{/* Insulation Section */}",
    "</div>\n                    {/* Insulation Section */}"
  );

  // Wrap Insulation Section
  content = content.replace(
    "{/* Insulation Section */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Package className=\"w-4 h-4 text-purple-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Insulation & Screen</h3>\n                      </div>\n                      {/* Insulation Section */}"
  );
  
  // Close Insulation Section before Separator Section
  content = content.replace(
    "{/* Separator Section */}",
    "</div>\n                    {/* Separator Section */}"
  );
  
  // Wrap Inner layers
  content = content.replace(
    "{/* Separator Section */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Layers className=\"w-4 h-4 text-blue-500\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Inner Layers</h3>\n                      </div>\n                      {/* Separator Section */}"
  );
  
  // Close Inner layers before Armor Section
  content = content.replace(
    "{/* Armor Section */}",
    "</div>\n                    {/* Armor Section */}"
  );
  
  // Wrap Armor & Outer Sheath
  content = content.replace(
    "{/* Armor Section */}",
    "<div className=\"bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 break-inside-avoid\">\n                      <div className=\"flex items-center gap-2 mb-2 pb-2 border-b border-slate-100\">\n                        <Package className=\"w-4 h-4 text-slate-800\" />\n                        <h3 className=\"text-xs font-black text-slate-800 uppercase tracking-widest\">Armor & Outer Sheath</h3>\n                      </div>\n                      {/* Armor Section */}"
  );
  
  // Close Armor & Outer sheath before Advanced Intermediate Diameters Summary
  content = content.replace(
    "{/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}",
    "</div>\n                    {/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}"
  );
  
  // Make the Advanced Diagnostics and Manual Overrides span full width
  content = content.replace(
    "{/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}",
    "<div className=\"col-span-1 xl:col-span-2 2xl:col-span-3 space-y-6\">\n                      {/* Advanced Intermediate Diameters Summary (Advance Mode Only) */}"
  );
  content = content.replace(
    "{/* Add to Project Button moved to bottom of config */}",
    "</div>\n                    {/* Add to Project Button moved to bottom of config */}"
  );

  fs.writeFileSync(file, content);
  console.log("Refactoring complete");
}

refactorConfig();
