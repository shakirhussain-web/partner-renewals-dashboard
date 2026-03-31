function computePriorityScore(renewalDate) {
  const now = new Date();
  const renewal = new Date(renewalDate);
  const daysUntilRenewal = Math.ceil((renewal - now) / (1000 * 60 * 60 * 24));

  let urgencyScore;
  if (daysUntilRenewal <= 0) {
    urgencyScore = 100;
  } else if (daysUntilRenewal <= 30) {
    urgencyScore = 95;
  } else if (daysUntilRenewal <= 60) {
    urgencyScore = 80;
  } else if (daysUntilRenewal <= 90) {
    urgencyScore = 60;
  } else if (daysUntilRenewal <= 180) {
    urgencyScore = 40;
  } else if (daysUntilRenewal <= 365) {
    urgencyScore = 20;
  } else {
    urgencyScore = 10;
  }

  return { urgencyScore, daysUntilRenewal };
}

// Health score (0-100): worse health = higher priority
const HEALTH_SCORES = {
  'Churning': 100,
  'Red': 90,
  'Orange': 60,
  'Yellow': 30,
  'Green': 0,
};

function getHealthScore(status) {
  if (!status) return 20; // Unknown health treated as moderate risk
  return HEALTH_SCORES[status] ?? 20;
}

function computePriorityScores(rows) {
  if (!rows || rows.length === 0) return [];

  // Use the USD Value column from the sheet directly
  const enriched = rows.map((row) => {
    const arrUsd = parseFloat(row['USD Value']) || 0;
    return { ...row, arrUsd };
  });

  const maxArrUsd = Math.max(...enriched.map((r) => r.arrUsd), 1);

  return enriched.map((row) => {
    const renewalDate = row.RESELLERCUSTOMER_SUB_RENEWAL_DATE;

    if (!renewalDate) {
      return { ...row, priorityScore: 0, priorityLevel: 'unknown', daysUntilRenewal: null, revenueScore: 0, urgencyScore: 0, healthScore: 0 };
    }

    const { urgencyScore, daysUntilRenewal } = computePriorityScore(renewalDate);
    const revenueScore = Math.round((row.arrUsd / maxArrUsd) * 100);
    const healthScore = getHealthScore(row['Account Health Status']);

    // Combined: 40% urgency, 30% revenue, 30% health
    const priorityScore = Math.round(urgencyScore * 0.4 + revenueScore * 0.3 + healthScore * 0.3);

    let priorityLevel;
    if (priorityScore >= 80) {
      priorityLevel = 'critical';
    } else if (priorityScore >= 60) {
      priorityLevel = 'high';
    } else if (priorityScore >= 40) {
      priorityLevel = 'medium';
    } else {
      priorityLevel = 'low';
    }

    return {
      ...row,
      priorityScore,
      priorityLevel,
      daysUntilRenewal,
      revenueScore,
      urgencyScore,
      healthScore,
    };
  });
}

module.exports = { computePriorityScores };
