const fs = require('fs');

function groupSections() {
  const file = 'src/components/CableDesigner.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Find where activeTab === 'config' starts
  const startIdx = content.indexOf("{activeTab === 'config' && (");
  if (startIdx === -1) {
    console.error("Config tab not found");
    return;
  }

  // Find the `<div className="space-y-4">` immediately after it
  const divStart = content.indexOf('<div className="space-y-4">', startIdx);
  
  // We want to replace `<div className="space-y-4">` with something that establishes a grid.
  // Actually, we can leave it, but change className.
  const newClass = 'grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 items-start';
  let newContent = content.substring(0, divStart) + `<div className="${newClass}">` + content.substring(divStart + '<div className="space-y-4">'.length);

  fs.writeFileSync(file, newContent);
  console.log("Done updating grid container.");
}

groupSections();
