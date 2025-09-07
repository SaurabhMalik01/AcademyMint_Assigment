// server/utils/buckets.js

function parseYMD(dateStr) {
  // expects 'YYYY-MM-DD', returns Date object
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function defaultRangeLast7Days() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6); // last 7 days including today
  return { start, end };
}

function getBuckets(start, end, bucket) {
  const buckets = [];
  let current = new Date(start);

  while (current <= end) {
    let next;
    if (bucket === "day") {
      next = new Date(current);
      next.setDate(current.getDate() + 1);
    } else if (bucket === "week") {
      next = new Date(current);
      next.setDate(current.getDate() + 7);
    } else if (bucket === "month") {
      next = new Date(current);
      next.setMonth(current.getMonth() + 1);
    }

    buckets.push({
      startDate: current.toISOString().split("T")[0],
      endDate: new Date(next - 1).toISOString().split("T")[0],
      _startTs: current.getTime(),
      _endTs: next.getTime() - 1,
      productsAdded: 0,
      productsRemoved: 0,
      totalProducts: 0
    });

    current = next;
  }

  return buckets;
}

module.exports = {
  parseYMD,
  defaultRangeLast7Days,
  getBuckets
};
