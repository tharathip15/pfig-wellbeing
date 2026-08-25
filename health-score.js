(function exposeHealthScore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.PfigHealthScore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createHealthScoreApi() {
  function hasCompleteFinalMeasurement(emp) {
    const months = emp && emp.months;
    const baseline = months && months.m1;
    const final = months && months.m4;
    return Number(baseline && baseline.weight) > 0
      && Number(baseline && baseline.bodyage) > 0
      && Number(final && final.weight) > 0
      && Number(final && final.bodyage) > 0;
  }

  function latestMonth(emp) {
    const months = (emp && emp.months) || {};
    const final = months.m4;
    return Number(final && final.weight) > 0 && Number(final && final.bodyage) > 0
      ? final
      : null;
  }

  function calculateHealthScore(emp) {
    const months = (emp && emp.months) || {};
    const m1 = months.m1;
    const latest = latestMonth(emp);
    if (!hasCompleteFinalMeasurement(emp) || !m1 || !latest) {
      return { weightScore: 0, muscleScore: 0, fatScore: 0, totalScore: 0 };
    }

    const gender = months.gender || 'male';
    const m1Fat = m1.fat || 0;
    const latestFat = latest.fat || 0;
    const fatDecrease = parseFloat((m1Fat - latestFat).toFixed(1));
    const isStartFatStandard = gender === 'female'
      ? m1Fat >= 14 && m1Fat <= 31
      : m1Fat >= 6 && m1Fat <= 24;
    let fatScore = 0;
    if (isStartFatStandard) {
      fatScore = fatDecrease >= -0.5 ? 40 : 0;
    } else if (fatDecrease > 0) {
      fatScore = Math.min(40, Math.floor(fatDecrease / 0.5) * 5);
    }

    const m1Muscle = m1.muscle || 0;
    const latestMuscle = latest.muscle || 0;
    const muscleIncrease = parseFloat((latestMuscle - m1Muscle).toFixed(1));
    const isStartMuscleExcellent = gender === 'female' ? m1Muscle >= 27 : m1Muscle >= 33;
    let muscleScore = 0;
    if (isStartMuscleExcellent) {
      muscleScore = muscleIncrease >= 0 ? 40 : 0;
    } else if (muscleIncrease > 0) {
      muscleScore = Math.min(40, Math.floor(muscleIncrease / 0.2) * 5);
    }

    const m1Bmi = m1.bmi || 0;
    const latestBmi = latest.bmi || 0;
    const isStartBmiStandard = m1Bmi >= 18.5 && m1Bmi <= 22.9;
    let bmiScore = 0;
    if (isStartBmiStandard) {
      bmiScore = latestBmi >= 18.5 && latestBmi <= 22.9 ? 20 : 0;
    } else {
      const startDistance = Math.abs(m1Bmi - 21);
      const latestDistance = Math.abs(latestBmi - 21);
      if (latestBmi >= 18.5 && latestBmi <= 22.9) {
        bmiScore = 20;
      } else if (latestDistance < startDistance) {
        const progressRatio = (startDistance - latestDistance) / startDistance;
        bmiScore = parseFloat((10 + (10 * progressRatio)).toFixed(2));
      }
    }

    return {
      weightScore: bmiScore,
      muscleScore,
      fatScore,
      totalScore: parseFloat((bmiScore + muscleScore + fatScore).toFixed(2)),
    };
  }

  return { calculateHealthScore, hasCompleteFinalMeasurement };
});
