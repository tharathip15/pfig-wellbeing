const assert = require('node:assert/strict');
const test = require('node:test');
const { calculateHealthScore, hasCompleteFinalMeasurement } = require('../health-score.js');

const baseline = { weight: 100, bodyage: 50, bmi: 34.6, muscle: 20, fat: 40 };
const middleTwo = { weight: 60, bodyage: 20, bmi: 20.76, muscle: 40, fat: 10 };
const middleThree = { weight: 70, bodyage: 25, bmi: 24.22, muscle: 35, fat: 30 };
const final = { weight: 90, bodyage: 45, bmi: 31.14, muscle: 21, fat: 39 };

test('uses m4 final instead of conflicting middle measurements for scoring', () => {
  const employee = { months: { m1: baseline, m2: middleTwo, m3: middleThree, m4: final } };
  const scoreWithFinal = calculateHealthScore(employee);
  const scoreWithMiddle = calculateHealthScore({ months: { m1: baseline, m4: middleTwo } });

  assert.equal(hasCompleteFinalMeasurement(employee), true);
  assert.ok(scoreWithFinal.totalScore > 0);
  assert.notDeepEqual(scoreWithFinal, scoreWithMiddle);
  assert.deepEqual(scoreWithFinal, calculateHealthScore({ months: { m1: baseline, m4: final } }));
});

test('requires baseline and m4 final measurements', () => {
  const employee = { months: { m1: baseline, m2: middleTwo, m3: middleThree } };

  assert.equal(hasCompleteFinalMeasurement(employee), false);
  assert.deepEqual(calculateHealthScore(employee), {
    weightScore: 0,
    muscleScore: 0,
    fatScore: 0,
    totalScore: 0
  });
});

test('rejects incomplete m4 even when middle data is complete', () => {
  const employee = { months: { m1: baseline, m2: middleTwo, m3: middleThree, m4: { weight: 90, bodyage: null } } };

  assert.equal(hasCompleteFinalMeasurement(employee), false);
  assert.equal(calculateHealthScore(employee).totalScore, 0);
});

test('calculates health score for m3 when targetRound is m3', () => {
  const employee = { months: { m1: baseline, m2: middleTwo, m3: middleThree } };
  const scoreM3 = calculateHealthScore(employee, 'm3');

  assert.ok(scoreM3.totalScore > 0);
  assert.deepEqual(scoreM3, calculateHealthScore({ months: { m1: baseline, m3: middleThree } }, 'm3'));
});

