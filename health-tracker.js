(function exposeHealthTracker(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.PfigHealthTracker = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createHealthTrackerApi() {
  const LEGACY_ROUND_DEFAULTS = [
    { key: "m1", date: "2026-07-01", label: "บันทึกเริ่มต้น #1" },
    { key: "m2", date: "2026-08-01", label: "บันทึกเริ่มต้น #2" },
    { key: "m3", date: "2026-09-01", label: "บันทึกเริ่มต้น #3" },
    { key: "m4", date: "2026-10-01", label: "บันทึกเริ่มต้น #4" },
  ];

  function calcBMI(weight, heightCm) {
    const w = Number(weight);
    const h = Number(heightCm) / 100;
    if (!Number.isFinite(w) || w <= 0 || !Number.isFinite(h) || h <= 0) return null;
    return parseFloat((w / (h * h)).toFixed(2));
  }

  function toOptionalNumber(val) {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) && n > 0 ? parseFloat(n.toFixed(2)) : null;
  }

  function sanitizeLogEntry(raw, heightCm, index = 0) {
    if (!raw || typeof raw !== "object") return null;
    const weight = toOptionalNumber(raw.weight);
    const bodyage = toOptionalNumber(raw.bodyage);
    const muscle = toOptionalNumber(raw.muscle);
    const fat = toOptionalNumber(raw.fat);
    const visceralFat = toOptionalNumber(raw.visceralFat);
    const photo = raw.photo ? String(raw.photo) : null;
    if (weight === null && bodyage === null && !photo) return null;

    const bmi = weight !== null
      ? (calcBMI(weight, heightCm) ?? toOptionalNumber(raw.bmi))
      : toOptionalNumber(raw.bmi);

    const dateStr = raw.date && /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date).trim())
      ? String(raw.date).trim()
      : `2026-07-${String(Math.min(28, index + 1)).padStart(2, "0")}`;

    return {
      id: raw.id ? String(raw.id) : `log-${dateStr}-${index + 1}`,
      date: dateStr,
      label: raw.label ? String(raw.label).trim().slice(0, 120) : "",
      weight,
      bmi,
      bodyage: bodyage !== null ? Math.round(bodyage) : null,
      muscle,
      fat,
      visceralFat,
      note: raw.note ? String(raw.note).trim().slice(0, 300) : "",
      photo,
      legacyRound: raw.legacyRound || null,
    };
  }

  function sortLogsChronologically(logs) {
    return [...logs].sort((a, b) => {
      const dateCmp = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCmp !== 0) return dateCmp;
      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  function syncLegacyMirrors(months, sortedLogs) {
    const validWeightLogs = sortedLogs.filter(item => Number(item.weight) > 0);
    if (validWeightLogs.length > 0 && !months.m1) {
      const first = validWeightLogs[0];
      months.m1 = {
        weight: first.weight,
        bmi: first.bmi,
        bodyage: first.bodyage || 30,
        muscle: first.muscle,
        fat: first.fat,
        photo: first.photo || null,
      };
    }
    return months;
  }

  function normalizeEmployeeTimeline(emp) {
    if (!emp || typeof emp !== "object") return emp;
    const rawMonths = emp.months && typeof emp.months === "object" && !Array.isArray(emp.months)
      ? { ...emp.months }
      : {};
    const heightCm = Number(emp.height) || 0;

    let logs = [];
    if (Array.isArray(rawMonths.logs) && rawMonths.logs.length > 0) {
      logs = rawMonths.logs
        .map((entry, idx) => sanitizeLogEntry(entry, heightCm, idx))
        .filter(Boolean);
    } else {
      LEGACY_ROUND_DEFAULTS.forEach((roundDef, idx) => {
        const m = rawMonths[roundDef.key];
        if (!m || typeof m !== "object") return;
        const entry = sanitizeLogEntry({
          id: `legacy-${roundDef.key}`,
          date: m.date || roundDef.date,
          label: roundDef.label,
          weight: m.weight,
          bmi: m.bmi,
          bodyage: m.bodyage,
          muscle: m.muscle,
          fat: m.fat,
          visceralFat: m.visceralFat,
          note: m.note || "",
          photo: m.photo || null,
          legacyRound: roundDef.key,
        }, heightCm, idx);
        if (entry) logs.push(entry);
      });
    }

    const sortedLogs = sortLogsChronologically(logs);
    const goals = rawMonths.goals && typeof rawMonths.goals === "object"
      ? {
          targetWeight: toOptionalNumber(rawMonths.goals.targetWeight),
          targetFat: toOptionalNumber(rawMonths.goals.targetFat),
          targetMuscle: toOptionalNumber(rawMonths.goals.targetMuscle),
          targetBodyage: toOptionalNumber(rawMonths.goals.targetBodyage),
        }
      : {};

    const normalizedMonths = {
      ...rawMonths,
      gender: rawMonths.gender || null,
      goals,
      logs: sortedLogs,
    };
    syncLegacyMirrors(normalizedMonths, sortedLogs);

    return {
      ...emp,
      months: normalizedMonths,
    };
  }

  function addOrUpdateHealthLog(emp, logInput) {
    const normalizedEmp = normalizeEmployeeTimeline(emp);
    const currentLogs = [...(normalizedEmp.months.logs || [])];
    const weight = toOptionalNumber(logInput?.weight);
    if (weight === null) {
      throw new Error("กรุณาระบุน้ำหนักที่ถูกต้อง (มากกว่า 0 kg)");
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const dateStr = logInput?.date && /^\d{4}-\d{2}-\d{2}$/.test(String(logInput.date).trim())
      ? String(logInput.date).trim()
      : todayStr;

    const existingIdx = logInput?.id
      ? currentLogs.findIndex(item => item.id === String(logInput.id))
      : -1;

    const entryId = existingIdx >= 0
      ? currentLogs[existingIdx].id
      : (logInput?.id ? String(logInput.id) : `log-${dateStr}-${Date.now().toString(36)}`);

    const newEntry = sanitizeLogEntry({
      ...(existingIdx >= 0 ? currentLogs[existingIdx] : {}),
      ...logInput,
      id: entryId,
      date: dateStr,
      weight,
    }, normalizedEmp.height, currentLogs.length);

    if (existingIdx >= 0) {
      currentLogs[existingIdx] = newEntry;
    } else {
      currentLogs.push(newEntry);
    }

    const sortedLogs = sortLogsChronologically(currentLogs);
    const savedIndex = sortedLogs.findIndex(item => item.id === newEntry.id);
    const previousLog = savedIndex > 0 ? sortedLogs[savedIndex - 1] : null;

    const updatedMonths = {
      ...normalizedEmp.months,
      logs: sortedLogs,
    };
    syncLegacyMirrors(updatedMonths, sortedLogs);

    return {
      employee: {
        ...normalizedEmp,
        months: updatedMonths,
      },
      savedLog: newEntry,
      previousLog,
    };
  }

  function deleteHealthLog(emp, logId) {
    const normalizedEmp = normalizeEmployeeTimeline(emp);
    const filtered = (normalizedEmp.months.logs || []).filter(item => item.id !== String(logId));
    return {
      ...normalizedEmp,
      months: {
        ...normalizedEmp.months,
        logs: filtered,
      },
    };
  }

  function parseIsoDate(dateStr) {
    const [y, m, d] = String(dateStr || "2026-01-01").split("-").map(Number);
    return new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  }

  function diffDays(dateA, dateB) {
    const msPerDay = 86400000;
    return Math.round((parseIsoDate(dateA) - parseIsoDate(dateB)) / msPerDay);
  }

  function computeDiffSummary(target, base) {
    if (!target || !base) {
      return {
        hasComparison: false,
        weightDiff: null,
        bmiDiff: null,
        bodyageDiff: null,
        muscleDiff: null,
        fatDiff: null,
        visceralFatDiff: null,
      };
    }
    const diffOrNull = (a, b, decimals = 1) => (
      Number.isFinite(Number(a)) && Number.isFinite(Number(b)) && a !== null && b !== null
        ? parseFloat((Number(a) - Number(b)).toFixed(decimals))
        : null
    );
    return {
      hasComparison: true,
      weightDiff: diffOrNull(target.weight, base.weight, 1),
      bmiDiff: diffOrNull(target.bmi, base.bmi, 2),
      bodyageDiff: diffOrNull(target.bodyage, base.bodyage, 0),
      muscleDiff: diffOrNull(target.muscle, base.muscle, 1),
      fatDiff: diffOrNull(target.fat, base.fat, 1),
      visceralFatDiff: diffOrNull(target.visceralFat, base.visceralFat, 1),
    };
  }

  function calculateStreakAndStats(empOrLogs, nowDateStr = new Date().toISOString().slice(0, 10)) {
    const logs = Array.isArray(empOrLogs)
      ? sortLogsChronologically(empOrLogs)
      : (normalizeEmployeeTimeline(empOrLogs)?.months?.logs || []);

    const validLogs = logs.filter(l => Number(l.weight) > 0);
    const totalLogs = validLogs.length;
    if (totalLogs === 0) {
      return {
        totalLogs: 0,
        streakCount: 0,
        logsThisMonth: 0,
        logsThisWeek: 0,
        baselineLog: null,
        latestLog: null,
        previousLog: null,
        latestVsBaseline: computeDiffSummary(null, null),
        latestVsPrevious: computeDiffSummary(null, null),
      };
    }

    const nowPrefixMonth = String(nowDateStr).slice(0, 7);
    const logsThisMonth = validLogs.filter(l => String(l.date).startsWith(nowPrefixMonth)).length;
    const logsThisWeek = validLogs.filter(l => {
      const gap = diffDays(nowDateStr, l.date);
      return gap >= 0 && gap <= 7;
    }).length;

    // Streak calculation: consecutive check-ins where adjacent check-ins are within 35 days of each other
    // and the latest check-in is within 35 days of nowDateStr (supports daily, weekly, or monthly habits!)
    let streakCount = 0;
    const latestLog = validLogs[validLogs.length - 1];
    const daysSinceLatest = diffDays(nowDateStr, latestLog.date);
    if (daysSinceLatest <= 35) {
      streakCount = 1;
      for (let i = validLogs.length - 1; i > 0; i -= 1) {
        const gap = Math.abs(diffDays(validLogs[i].date, validLogs[i - 1].date));
        if (gap <= 35) {
          streakCount += 1;
        } else {
          break;
        }
      }
    }

    const baselineLog = validLogs[0];
    const previousLog = validLogs.length >= 2 ? validLogs[validLogs.length - 2] : null;

    return {
      totalLogs,
      streakCount,
      logsThisMonth,
      logsThisWeek,
      baselineLog,
      latestLog,
      previousLog,
      latestVsBaseline: computeDiffSummary(latestLog, baselineLog),
      latestVsPrevious: computeDiffSummary(latestLog, previousLog),
    };
  }

  function calculateGoalProgress(emp) {
    const normalizedEmp = normalizeEmployeeTimeline(emp);
    const goals = normalizedEmp?.months?.goals || {};
    const stats = calculateStreakAndStats(normalizedEmp);
    const baseline = stats.baselineLog;
    const latest = stats.latestLog;

    const items = [];
    const computeProgress = (key, label, unit, icon, startVal, currentVal, targetVal, direction) => {
      if (!Number.isFinite(Number(targetVal)) || targetVal === null) return;
      const cur = Number.isFinite(Number(currentVal)) && currentVal !== null ? Number(currentVal) : null;
      const start = Number.isFinite(Number(startVal)) && startVal !== null ? Number(startVal) : cur;
      if (cur === null) {
        items.push({ key, label, unit, icon, targetVal, currentVal: null, startVal: null, progressPct: 0, achieved: false, remainingText: "รอการบันทึกค่านี้" });
        return;
      }

      let achieved = false;
      let progressPct = 0;
      if (direction === "down") {
        achieved = cur <= targetVal;
        if (achieved) progressPct = 100;
        else if (start !== null && start > targetVal) {
          progressPct = Math.max(5, Math.min(99, Math.round(((start - cur) / (start - targetVal)) * 100)));
        }
      } else if (direction === "up") {
        achieved = cur >= targetVal;
        if (achieved) progressPct = 100;
        else if (start !== null && start < targetVal) {
          progressPct = Math.max(5, Math.min(99, Math.round(((cur - start) / (targetVal - start)) * 100)));
        }
      } else {
        const dist = Math.abs(cur - targetVal);
        const startDist = start !== null ? Math.abs(start - targetVal) : dist;
        achieved = dist <= 0.3;
        if (achieved) progressPct = 100;
        else if (startDist > 0 && dist < startDist) {
          progressPct = Math.max(5, Math.min(99, Math.round(((startDist - dist) / startDist) * 100)));
        }
      }

      const diffRemaining = parseFloat(Math.abs(cur - targetVal).toFixed(1));
      const remainingText = achieved
        ? "🎉 พิชิตเป้าหมายสำเร็จแล้ว!"
        : `อีก ${diffRemaining} ${unit} จะถึงเป้าหมาย (${targetVal} ${unit})`;

      items.push({
        key,
        label,
        unit,
        icon,
        startVal: start,
        currentVal: cur,
        targetVal: Number(targetVal),
        progressPct,
        achieved,
        remainingText,
      });
    };

    const startW = baseline?.weight;
    const curW = latest?.weight;
    const targetW = goals.targetWeight;
    const wDir = startW && targetW ? (targetW <= startW ? "down" : "up") : "closest";
    computeProgress("targetWeight", "เป้าหมายน้ำหนัก", "kg", "⚖️", startW, curW, targetW, wDir);
    computeProgress("targetFat", "เป้าหมายไขมัน", "%", "📉", baseline?.fat, latest?.fat, goals.targetFat, "down");
    computeProgress("targetMuscle", "เป้าหมายกล้ามเนื้อ", "%", "💪", baseline?.muscle, latest?.muscle, goals.targetMuscle, "up");
    computeProgress("targetBodyage", "เป้าหมายอายุร่างกาย", "ปี", "🧬", baseline?.bodyage, latest?.bodyage, goals.targetBodyage, "down");

    return {
      hasGoals: items.length > 0,
      anyAchieved: items.some(item => item.achieved),
      items,
    };
  }

  function evaluateBadges(emp, nowDateStr = new Date().toISOString().slice(0, 10)) {
    const normalizedEmp = normalizeEmployeeTimeline(emp);
    const stats = calculateStreakAndStats(normalizedEmp, nowDateStr);
    const goals = calculateGoalProgress(normalizedEmp);
    const latest = stats.latestLog;
    const baseline = stats.baselineLog;
    const realAge = Number(normalizedEmp?.age) || 0;

    const latestWithBodyage = [...(normalizedEmp?.months?.logs || [])].reverse().find(l => Number(l.bodyage) > 0);
    const latestWithMuscle = [...(normalizedEmp?.months?.logs || [])].reverse().find(l => Number(l.muscle) > 0);
    const baseWithMuscle = (normalizedEmp?.months?.logs || []).find(l => Number(l.muscle) > 0);
    const latestWithFat = [...(normalizedEmp?.months?.logs || [])].reverse().find(l => Number(l.fat) > 0);
    const baseWithFat = (normalizedEmp?.months?.logs || []).find(l => Number(l.fat) > 0);

    return [
      {
        id: "first_step",
        icon: "🌱",
        title: "ก้าวแรกเพื่อตัวเอง",
        desc: "เริ่มต้นบันทึกข้อมูลสุขภาพครั้งแรกสำเร็จ",
        unlocked: stats.totalLogs >= 1,
      },
      {
        id: "streak_3",
        icon: "🔥",
        title: "ฟิตต่อเนื่อง x3",
        desc: "เช็คอินอัปเดตข้อมูลร่างกายต่อเนื่องครบ 3 ครั้ง",
        unlocked: stats.streakCount >= 3,
      },
      {
        id: "streak_7",
        icon: "⚡",
        title: "สายวินัยตัวจริง x7",
        desc: "เช็คอินอัปเดตข้อมูลร่างกายต่อเนื่องครบ 7 ครั้ง",
        unlocked: stats.streakCount >= 7,
      },
      {
        id: "time_traveler",
        icon: "🧬",
        title: "โกงอายุสำเร็จ",
        desc: "อายุร่างกายน้อยกว่าหรือเท่ากับอายุจริงของคุณ",
        unlocked: Boolean(latestWithBodyage && realAge > 0 && latestWithBodyage.bodyage <= realAge),
      },
      {
        id: "golden_bmi",
        icon: "⚖️",
        title: "สมดุลทองคำ (BMI ปกติ)",
        desc: "ค่า BMI ล่าสุดอยู่ในเกณฑ์สมส่วนมาตรฐาน (18.5 - 22.9)",
        unlocked: Boolean(latest && latest.bmi >= 18.5 && latest.bmi <= 22.9),
      },
      {
        id: "muscle_up",
        icon: "💪",
        title: "สายสตรองกล้ามเนื้อพุ่ง",
        desc: "มวลกล้ามเนื้อเพิ่มขึ้นจากจุดเริ่มต้นอย่างน้อย +0.5%",
        unlocked: Boolean(
          latestWithMuscle &&
          baseWithMuscle &&
          latestWithMuscle.id !== baseWithMuscle.id &&
          latestWithMuscle.muscle - baseWithMuscle.muscle >= 0.5
        ),
      },
      {
        id: "fat_burner",
        icon: "🔥",
        title: "นักเผาผลาญไขมัน",
        desc: "ลดอัตราไขมันในร่างกายลงจากจุดเริ่มต้นอย่างน้อย -1.0%",
        unlocked: Boolean(
          latestWithFat &&
          baseWithFat &&
          latestWithFat.id !== baseWithFat.id &&
          baseWithFat.fat - latestWithFat.fat >= 1.0
        ),
      },
      {
        id: "goal_crusher",
        icon: "🏆",
        title: "ผู้พิชิตเป้าหมาย",
        desc: "ทำสำเร็จตามเป้าหมายส่วนตัวที่ตั้งไว้",
        unlocked: goals.anyAchieved,
      },
    ];
  }

  function generateCelebrationFeedback(emp, newLog, previousLog) {
    const highlights = [];
    let title = "🎉 บันทึกข้อมูลร่างกายสำเร็จแล้ว!";
    let message = "ทุกครั้งที่มาวัดและจดบันทึก คือการดูแลตัวเองที่ยอดเยี่ยมที่สุด สู้ต่อไปนะ!";

    if (previousLog && Number(newLog?.weight) > 0 && Number(previousLog?.weight) > 0) {
      const wDiff = parseFloat((newLog.weight - previousLog.weight).toFixed(1));
      if (wDiff < 0) {
        const lost = Math.abs(wDiff);
        highlights.push(`⚖️ น้ำหนักลดลง -${lost} kg จากครั้งก่อน`);
        title = `🌟 ว้าว! น้ำหนักลดลง ${lost} kg จากครั้งก่อน!`;
        message = lost >= 1
          ? "เบาตัวขึ้นเยอะเลย! วินัยของคุณกำลังออกดอกออกผลอย่างชัดเจน!"
          : "ค่อยๆ ลดแบบสุขภาพดี รักษามาตรฐานนี้ไว้เลย!";
      } else if (wDiff === 0) {
        highlights.push("⚖️ น้ำหนักคงที่เป๊ะจากครั้งก่อน");
        title = "✨ รักษาสมดุลร่างกายได้นิ่งมาก!";
        message = "ความสม่ำเสมอคือกุญแจสำคัญของการมีสุขภาพดีระยะยาว!";
      } else {
        highlights.push(`⚖️ น้ำหนักเปลี่ยนแปลง +${wDiff} kg จากครั้งก่อน`);
        title = "💪 เช็คอินวันนี้เรียบร้อย! รู้ทันร่างกายคือชัยชนะ";
        message = "น้ำหนักขยับขึ้นลงตามน้ำและอาหารในแต่ละวันได้เป็นเรื่องปกติ ดื่มน้ำเยอะๆ พักผ่อนให้พอ แล้วลุยต่อ!";
      }
    } else if (Number(newLog?.weight) > 0) {
      highlights.push(`⚖️ น้ำหนักเริ่มต้น ${newLog.weight} kg`);
    }

    if (Number(newLog?.bodyage) > 0) {
      if (previousLog && Number(previousLog?.bodyage) > 0) {
        const ageDiff = newLog.bodyage - previousLog.bodyage;
        if (ageDiff < 0) {
          highlights.push(`🧬 อายุร่างกายเด็กลง ${Math.abs(ageDiff)} ปี (${previousLog.bodyage} ➔ ${newLog.bodyage} ปี)`);
          title = `🧬 สุดยอด! อายุร่างกายเด็กลง ${Math.abs(ageDiff)} ปี!`;
        } else {
          highlights.push(`🧬 อายุร่างกาย ${newLog.bodyage} ปี`);
        }
      } else {
        highlights.push(`🧬 อายุร่างกาย ${newLog.bodyage} ปี`);
      }
    }

    if (Number(newLog?.muscle) > 0 && previousLog && Number(previousLog?.muscle) > 0) {
      const mDiff = parseFloat((newLog.muscle - previousLog.muscle).toFixed(1));
      if (mDiff > 0) {
        highlights.push(`💪 กล้ามเนื้อเพิ่มขึ้น +${mDiff}%`);
      }
    }

    if (Number(newLog?.fat) > 0 && previousLog && Number(previousLog?.fat) > 0) {
      const fDiff = parseFloat((newLog.fat - previousLog.fat).toFixed(1));
      if (fDiff < 0) {
        highlights.push(`📉 ไขมันลดลง ${fDiff}%`);
      }
    }

    return {
      title,
      message,
      highlights,
    };
  }

  function buildCommunityPulse(allEmployees, nowDateStr = new Date().toISOString().slice(0, 10)) {
    const list = Array.isArray(allEmployees) ? allEmployees : [];
    let totalTrackedEmployees = 0;
    let activeThisMonth = 0;
    let activeThisWeek = 0;
    let totalLogsCompanyWide = 0;
    let totalUnlockedBadges = 0;
    const participantSummaries = [];

    list.forEach(emp => {
      const normalized = normalizeEmployeeTimeline(emp);
      const stats = calculateStreakAndStats(normalized, nowDateStr);
      const badges = evaluateBadges(normalized, nowDateStr);
      const unlockedCount = badges.filter(b => b.unlocked).length;

      if (stats.totalLogs > 0) {
        totalTrackedEmployees += 1;
        totalLogsCompanyWide += stats.totalLogs;
        totalUnlockedBadges += unlockedCount;
        if (stats.logsThisMonth > 0) activeThisMonth += 1;
        if (stats.logsThisWeek > 0) activeThisWeek += 1;

        participantSummaries.push({
          id: normalized.id,
          name: normalized.name,
          department: normalized.department,
          streakCount: stats.streakCount,
          totalLogs: stats.totalLogs,
          logsThisMonth: stats.logsThisMonth,
          unlockedBadges: unlockedCount,
          latestDate: stats.latestLog?.date || null,
        });
      }
    });

    const consistencyLeaders = participantSummaries
      .filter(item => item.streakCount >= 3 || item.totalLogs >= 3)
      .sort((a, b) => {
        if (b.streakCount !== a.streakCount) return b.streakCount - a.streakCount;
        if (b.totalLogs !== a.totalLogs) return b.totalLogs - a.totalLogs;
        return String(a.name || "").localeCompare(String(b.name || ""), "th");
      })
      .slice(0, 6);

    return {
      totalTrackedEmployees,
      activeThisMonth,
      activeThisWeek,
      totalLogsCompanyWide,
      totalUnlockedBadges,
      consistencyLeaders,
    };
  }

  return {
    calcBMI,
    normalizeEmployeeTimeline,
    addOrUpdateHealthLog,
    deleteHealthLog,
    calculateStreakAndStats,
    calculateGoalProgress,
    evaluateBadges,
    generateCelebrationFeedback,
    buildCommunityPulse,
  };
});
