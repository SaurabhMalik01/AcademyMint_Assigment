// middleware/visitorLogger.js
const pool = require('../db');

module.exports = function visitorLogger() {
  return (req, res, next) => {
    try {
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
      const ua = req.headers['user-agent'] || null;
      const path = req.originalUrl || req.url || req.path || null;

      // Insert into DB (non-blocking)
      pool.execute(
        `INSERT INTO visitor_logs (visitor_id, ip, user_agent, page_path, visited_at) VALUES (?, ?, ?, ?, UTC_TIMESTAMP())`,
        [null, ip, ua, path]
      ).catch(err => console.error('visitor log failed', err));
    } catch (err) {
      console.error('visitorLogger error', err);
    }
    next();
  };
};
