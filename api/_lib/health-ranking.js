import healthScore from "../../health-score.js";

const { calculateHealthScore, hasCompleteFinalMeasurement } = healthScore;

export function rankHealthScores(employees) {
  return employees
    .filter(employee => hasCompleteFinalMeasurement(employee) && employee.department !== "Executive")
    .map(employee => {
      const score = calculateHealthScore(employee);
      const m1 = employee.months.m1;
      const m4 = employee.months.m4;
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalScore: score.totalScore,
        fatDiff: parseFloat(((m4.fat || 0) - (m1.fat || 0)).toFixed(1)),
        muscleDiff: parseFloat(((m4.muscle || 0) - (m1.muscle || 0)).toFixed(1)),
      };
    })
    .sort((left, right) => {
      if (right.totalScore !== left.totalScore) return right.totalScore - left.totalScore;
      if (left.fatDiff !== right.fatDiff) return left.fatDiff - right.fatDiff;
      if (right.muscleDiff !== left.muscleDiff) return right.muscleDiff - left.muscleDiff;
      return left.employeeName.localeCompare(right.employeeName);
    });
}

export function getPersonalHealthRanking(employees, employeeId) {
  const ranking = rankHealthScores(employees);
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
