// controllers/visitors.js
const pool = require('../db');
const { parseYMD, defaultRangeLast7Days, getBuckets } = require('../utils/buckets');

function parseRange(startDateStr, endDateStr){
  let start, end;
  if(startDateStr && endDateStr){
    start = parseYMD(startDateStr);
    end = parseYMD(endDateStr);
  } else {
    const def = defaultRangeLast7Days();
    start = def.start;
    end = def.end;
  }
  return { start, end };
}

async function getVisitors(req, res){
  try {
    const bucket = (req.query.bucket || 'day').toLowerCase();
    if(!['day','week','month'].includes(bucket)){
      return res.status(400).json({ error: 'bucket must be day|week|month' });
    }

    const { start, end } = parseRange(req.query.startDate, req.query.endDate);
    const buckets = getBuckets(start, end, bucket);

    const startSql = `${start.getUTCFullYear()}-${(start.getUTCMonth()+1).toString().padStart(2,'0')}-${start.getUTCDate().toString().padStart(2,'0')} 00:00:00`;
    const endSql   = `${end.getUTCFullYear()}-${(end.getUTCMonth()+1).toString().padStart(2,'0')}-${end.getUTCDate().toString().padStart(2,'0')} 23:59:59`;

    const [rows] = await pool.execute(
      `SELECT visited_at FROM visitor_logs WHERE visited_at BETWEEN ? AND ? ORDER BY visited_at ASC`,
      [startSql, endSql]
    );

    // Initialize all buckets with 0 visitors
    const result = buckets.map(b => ({
      startDate: b.startDate,
      endDate: b.endDate,
      visitors: 0
    }));

    // Place each log into its bucket
    rows.forEach(r => {
      const ts = new Date(r.visited_at).getTime();
      for (let i=0; i<buckets.length; i++) {
        const b = buckets[i];
        if(ts >= b._startTs && ts <= b._endTs){
          result[i].visitors += 1;
          break;
        }
      }
    });

    const totalVisitors = result.reduce((s, x) => s + x.visitors, 0);

    res.json({ totalVisitors, visitorsByBucket: result });
  } catch (err){
    console.error('getVisitors error', err);
    res.status(500).json({ error: 'internal' });
  }
}

module.exports = { getVisitors };
