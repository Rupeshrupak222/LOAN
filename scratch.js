const fs = require('fs');
let content = fs.readFileSync('c:/Users/HP/Desktop/LOAN/frontend/src/app/(app)/applications/[id]/page.tsx', 'utf-8');

const lines = content.split(/\r?\n/);

const checklistStartIdx = lines.findIndex(l => l.includes('{/* Prominent Action & Workflow Control Bar (Always visible outside) */}'));
if (checklistStartIdx !== -1) {
  // If we already deleted the old checklist but swallowed the closing tags, we can add them back right above the Prominent Action bar if they are missing
  const prevLine = lines[checklistStartIdx - 1];
  if (!prevLine.includes(')}')) {
    lines.splice(checklistStartIdx, 0, '        </div>', '      )}', '');
  }
}

fs.writeFileSync('c:/Users/HP/Desktop/LOAN/frontend/src/app/(app)/applications/[id]/page.tsx', lines.join('\n'));
console.log('Script executed');
