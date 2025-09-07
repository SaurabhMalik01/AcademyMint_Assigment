// controllers/productAnalytics.js
const pool = require("../db");
const { parseYMD, defaultRangeLast7Days, getBuckets } = require("../utils/buckets");

function parseRange(startDateStr, endDateStr) {
  if (startDateStr && endDateStr) {
    return { start: parseYMD(startDateStr), end: parseYMD(endDateStr) };
  }
  return defaultRangeLast7Days();
}

async function getProducts(req, res) {
  try {
    const bucket = (req.query.bucket || "day").toLowerCase();
    if (!["day", "week", "month"].includes(bucket)) {
      return res.status(400).json({ error: "bucket must be day|week|month" });
    }

    const { start, end } = parseRange(req.query.startDate, req.query.endDate);
    const buckets = getBuckets(start, end, bucket);

    const startSql = `${buckets[0].startDate} 00:00:00`;
    const endSql = `${buckets[buckets.length - 1].endDate} 23:59:59`;

    // history of product create/delete
    const [events] = await pool.execute(
      "SELECT event_type, event_time FROM product_history WHERE event_time BETWEEN ? AND ? ORDER BY event_time ASC",
      [startSql, endSql]
    );

    const trend = buckets.map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      productsAdded: 0,
      productsRemoved: 0,
      totalProducts: 0,
    }));

    // assign events into buckets
    events.forEach((ev) => {
      const ts = new Date(ev.event_time).getTime();
      for (let i = 0; i < buckets.length; i++) {
        const b = buckets[i];
        if (ts >= b._startTs && ts <= b._endTs) {
          if (ev.event_type === "created") trend[i].productsAdded++;
          if (ev.event_type === "deleted") trend[i].productsRemoved++;
          break;
        }
      }
    });

    // cumulative totalProducts for each bucket
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const bucketEndSql = `${b.endDate} 23:59:59`;

      const [[{ c: created }]] = await pool.execute(
        "SELECT COUNT(*) AS c FROM product_history WHERE event_type='created' AND event_time <= ?",
        [bucketEndSql]
      );
      const [[{ c: deleted }]] = await pool.execute(
        "SELECT COUNT(*) AS c FROM product_history WHERE event_type='deleted' AND event_time <= ?",
        [bucketEndSql]
      );

      trend[i].totalProducts = created - deleted;
    }

    // current total (up to end date)
    const [[{ c: createdAll }]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM product_history WHERE event_type='created' AND event_time <= ?",
      [endSql]
    );
    const [[{ c: deletedAll }]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM product_history WHERE event_type='deleted' AND event_time <= ?",
      [endSql]
    );

    res.json({
      currentTotal: createdAll - deletedAll,
      trend,
    });
  } catch (err) {
    console.error("getProducts analytics error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

module.exports = { getProducts };
