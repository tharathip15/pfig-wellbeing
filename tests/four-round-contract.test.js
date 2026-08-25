const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

test('measurement form has one complete DOM field set for each persisted round', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);

  for (const round of ['m1', 'm2', 'm3', 'm4']) {
    for (const field of ['weight', 'bodyage', 'bmi', 'muscle', 'fat', 'photo-input', 'photo-data', 'photo-preview']) {
      assert.equal(ids.includes(`form-${round}-${field}`), true, `missing form-${round}-${field}`);
    }
  }
});

test('CSV source defines twenty fixed columns and parses each round by position', () => {
  assert.match(app, /const headers = \['ชื่อ-นามสกุล', 'แผนก', 'อายุจริง', 'ส่วนสูง'\]/);
  assert.match(app, /for \(let stage = 1; stage <= 4; stage\+\+\) headers\.push/);
  assert.match(app, /for \(let stage = 1; stage <= 4; stage\+\+\) \{ const offset = 4 \+ \(stage - 1\) \* 4/);
  assert.match(app, /months\[`m\$\{stage\}`\] = \{ weight, bodyage, bmi: calcBMI\(weight, height\)/);
  assert.match(app, /columns\.length < 8/);
});
