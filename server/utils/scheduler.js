// Simple daily scheduler — no external dependencies
function scheduleDaily(hour, callback) {
  function getNextRun() {
    const now = new Date();
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  }

  function run() {
    callback();
    // Schedule next run in ~24h (recalculate to handle DST)
    setTimeout(run, getNextRun());
  }

  const msUntilFirst = getNextRun();
  const hoursUntil = (msUntilFirst / (1000 * 60 * 60)).toFixed(1);
  console.log(`Next auto-refresh in ${hoursUntil} hours`);
  setTimeout(run, msUntilFirst);
}

module.exports = { scheduleDaily };
