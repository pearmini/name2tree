import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const namesPath = path.join(__dirname, '../src/names.json');

// Read the file
const raw = fs.readFileSync(namesPath, 'utf-8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON:', e);
  process.exit(1);
}

const prevCount = data.length;

// Deduplicate by 'name' (keep first occurrence)
const seen = new Set();
const deduped = [];
for (const item of data) {
  if (!item.name) continue;
  if (!seen.has(item.name)) {
    seen.add(item.name);
    deduped.push(item);
  }
}

const currCount = deduped.length;

console.log('Previous count:', prevCount);
console.log('Current count:', currCount);

// Find duplicated data
const nameCounts = data.reduce((acc, item) => {
  if (!item.name) return acc;
  acc[item.name] = (acc[item.name] || 0) + 1;
  return acc;
}, {});
const duplicated = data.filter(item => nameCounts[item.name] > 1);
console.log('Duplicated data:', duplicated);

// Optionally, overwrite the file with deduplicated data
fs.writeFileSync(namesPath, JSON.stringify(deduped, null, 2), 'utf-8');
