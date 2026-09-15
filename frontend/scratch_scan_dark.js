const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) results.push(full);
  });
  return results;
}

const fileCounts = {};
walk('src').forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  content.split('\n').forEach(line => {
    const matches = line.match(/class(?:Name)?=["'][^"']+["']/g);
    if (matches) {
      matches.forEach(m => {
        const classStr = m.replace(/^class(?:Name)?=["']/, '').replace(/["']$/, '');
        classStr.split(/\s+/).forEach(t => {
          if ((t.startsWith('bg-slate-9') || t.startsWith('bg-slate-8') || t.startsWith('bg-slate-950') || t.startsWith('bg-[#0') || t.startsWith('bg-[#1')) && !t.includes(':') && !t.includes('hover:')) {
            if (!line.includes('isDark') && !line.includes('dark:') && !classStr.includes('dark:')) {
              fileCounts[f] = (fileCounts[f] || 0) + 1;
            }
          }
        });
      });
    }
  });
});

for (const [k, v] of Object.entries(fileCounts)) {
  console.log(`${v.toString().padStart(3, ' ')} issues: ${k}`);
}
