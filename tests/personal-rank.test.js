const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function makeElement() {
  return {
    style: {},
    className: '',
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      }
    },
    addEventListener() {},
    appendChild() {},
    remove() {},
    querySelector() {
      return makeElement();
    },
    querySelectorAll() {
      return [];
    },
    set textContent(value) {
      this._textContent = value;
    },
    get textContent() {
      return this._textContent || '';
    },
    set innerHTML(value) {
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || '';
    }
  };
}

function loadApp() {
  const appPath = path.join(__dirname, '..', 'app.js');
  const code = fs.readFileSync(appPath, 'utf8');
  const sandbox = {
    console,
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    },
    document: {
      body: makeElement(),
      addEventListener() {},
      getElementById() {
        return makeElement();
      },
      querySelectorAll() {
        return [];
      },
      createElement() {
        return makeElement();
      }
    },
    supabase: {
      createClient() {
        return {
          from() {
            return this;
          },
          select() {
            return this;
          },
          order() {
            return Promise.resolve({ data: [], error: null });
          },
          channel() {
            return {
              on() {
                return this;
              },
              subscribe() {
                return this;
              }
            };
          }
        };
      }
    },
    window: {}
  };

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: appPath });
  return sandbox;
}

test('builds body-age ranking for personal rank badges with competition exclusions', () => {
  const app = loadApp();

  assert.equal(typeof app.getRankedAchievers, 'function');
  assert.equal(typeof app.getPersonalRankBadgeData, 'function');

  const fixtures = [
    {
      id: 'runner',
      name: 'Runner',
      department: 'Sales',
      age: 31,
      height: 170,
      months: { m1: { weight: 75, bodyage: 42 }, m3: { weight: 73, bodyage: 38 } }
    },
    {
      id: 'winner',
      name: 'Winner',
      department: 'Logistics',
      age: 29,
      height: 168,
      months: { m1: { weight: 82, bodyage: 45 }, m3: { weight: 78, bodyage: 38 } }
    },
    {
      id: 'exec',
      name: 'Executive',
      department: 'Executive',
      age: 50,
      height: 172,
      months: { m1: { weight: 88, bodyage: 55 }, m3: { weight: 80, bodyage: 30 } }
    },
    {
      id: 'waiting',
      name: 'Waiting',
      department: 'Finance & Acc',
      age: 33,
      height: 166,
      months: { m1: { weight: 70, bodyage: 40 } }
    }
  ];

  const ranking = app.getRankedAchievers('bodyage', fixtures);

  assert.deepEqual(ranking.items.map(item => item.emp.id), ['winner', 'runner']);
  assert.equal(ranking.items[0].valText, '-7 ปี');
  assert.equal(ranking.items[0].descText, 'อายุร่างกายลดลง');
  assert.match(ranking.items[0].reasonText, /อายุร่างกาย ลด 7 ปี/);
  assert.match(ranking.items[0].reasonText, /45→38 ปี/);

  const runnerBadge = app.getPersonalRankBadgeData('runner', 'bodyage', fixtures);
  assert.equal(runnerBadge.hasRank, true);
  assert.equal(runnerBadge.rank, 2);
  assert.equal(runnerBadge.icon, '🥈');
  assert.equal(runnerBadge.rankClass, 'rank-2');
  assert.match(runnerBadge.contextText, /อันดับ 2 จาก 2 คน/);

  const waitingBadge = app.getPersonalRankBadgeData('waiting', 'bodyage', fixtures);
  assert.equal(waitingBadge.hasRank, false);
  assert.equal(waitingBadge.icon, '⏳');
});

test('renders personal rank as a compact inline badge for the score card title', () => {
  const app = loadApp();

  assert.equal(typeof app.renderPersonalRankInlineBadge, 'function');

  const html = app.renderPersonalRankInlineBadge({
    hasRank: true,
    rank: 2,
    icon: '🥈',
    rankClass: 'rank-2',
    titleText: 'อันดับ 2',
    metricText: '-4 ปี',
    descText: 'อายุร่างกายลดลง',
    contextText: 'อันดับ 2 จาก 2 คน'
  });

  assert.match(html, /personal-rank-inline/);
  assert.match(html, /#2/);
  assert.match(html, /อันดับ 2 จาก 2 คน/);
  assert.doesNotMatch(html, /personal-rank-card/);
});

test('omits the duplicate numeric icon for inline ranks below the podium', () => {
  const app = loadApp();

  const html = app.renderPersonalRankInlineBadge({
    hasRank: true,
    rank: 15,
    icon: '15',
    rankClass: 'rank-other',
    titleText: 'อันดับ 15',
    metricText: '11.0 คะแนน',
    descText: 'คะแนนสุขภาพรวม',
    contextText: 'อันดับ 15 จาก 27 คน'
  });

  assert.match(html, /#15/);
  assert.doesNotMatch(html, /personal-rank-inline-icon">15/);
});

test('adds dashboard leaderboard reason text for health score rankings', () => {
  const app = loadApp();

  const fixtures = [
    {
      id: 'fit',
      name: 'Fit Person',
      department: 'Sales',
      age: 31,
      height: 170,
      months: {
        gender: 'male',
        m1: { weight: 90, bmi: 31.14, bodyage: 45, muscle: 32, fat: 30 },
        m3: { weight: 80, bmi: 27.68, bodyage: 42, muscle: 33, fat: 28 }
      }
    }
  ];

  const ranking = app.getRankedAchievers('health_score', fixtures);
  const reasonText = ranking.items[0].reasonText;

  assert.match(reasonText, /BMI .*\/20/);
  assert.match(reasonText, /กล้ามเนื้อ เพิ่ม 1\.0%/);
  assert.match(reasonText, /ไขมัน ลด 2\.0%/);
  assert.doesNotMatch(reasonText, /อายุจริง/);
});
