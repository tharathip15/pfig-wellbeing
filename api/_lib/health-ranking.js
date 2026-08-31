import healthScore from "../../health-score.js";

const { calculateHealthScore, hasCompleteMeasurement } = healthScore;

export function resolveEvaluationRound(employees, preferredRound = "auto") {
  if (preferredRound === "m3" || preferredRound === "m4") {
    return preferredRound;
  }
  const hasM4 = employees.some(emp => hasCompleteMeasurement(emp, "m4"));
  if (hasM4) return "m4";
  const hasM3 = employees.some(emp => hasCompleteMeasurement(emp, "m3"));
  return hasM3 ? "m3" : "m4";
}

export function rankHealthScores(employees, targetRound = "m4") {
  const round = resolveEvaluationRound(employees, targetRound);
  return employees
    .filter(employee => hasCompleteMeasurement(employee, round) && employee.department !== "Executive")
    .map(employee => {
      const score = calculateHealthScore(employee, round);
      const m1 = employee.months.m1;
      const target = employee.months[round];
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalScore: score.totalScore,
        fatDiff: parseFloat(((target.fat || 0) - (m1.fat || 0)).toFixed(1)),
        muscleDiff: parseFloat(((target.muscle || 0) - (m1.muscle || 0)).toFixed(1)),
      };
    })
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
      if (left.fatDiff !== right.fatDiff) return left.fatDiff - right.fatDiff;
      if (right.muscleDiff !== left.muscleDiff) return right.muscleDiff - left.muscleDiff;
      return left.employeeName.localeCompare(right.employeeName);
    });
}

export function getPersonalHealthRanking(employees, employeeId, targetRound = "m4") {
  const ranking = rankHealthScores(employees, targetRound);
  const rankIndex = ranking.findIndex(item => item.employeeId === employeeId);
  if (rankIndex === -1) {
    return { hasRank: false, rank: null, totalParticipants: ranking.length, totalScore: null };
  }
  return {
    hasRank: true,
    rank: rankIndex + 1,
    totalParticipants: ranking.length,
    totalScore: ranking[rankIndex].totalScore,
  };
}
