// controllers/products.js

const pool = require("../db");
const { parseYMD, defaultRangeLast7Days, getBuckets } = require("../utils/buckets");

// --- CRUD Functions ---

async function getAllProducts(req, res) {
  try {
    const [rows] = await pool.execute("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    console.error("getAllProducts error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

async function createProduct(req, res) {
  try {
    const { name, price } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO products (name, price) VALUES (?, ?)",
      [name, price]
    );
    res.status(201).json({ id: result.insertId, name, price });
  } catch (err) {
    console.error("createProduct error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    await pool.execute(
      "UPDATE products SET name = ?, price = ? WHERE id = ?",
      [name, price, id]
    );
    res.json({ id, name, price });
  } catch (err) {
    console.error("updateProduct error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await pool.execute("DELETE FROM products WHERE id = ?", [id]);
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

async function searchProducts(req, res) {
  try {
    const { q } = req.query;
    const [rows] = await pool.execute(
      "SELECT * FROM products WHERE name LIKE ?",
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error("searchProducts error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getProductById error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

// --- Analytics for dashboard ---

async function getProducts(req, res) {
  try {
    const bucket = (req.query.bucket || "day").toLowerCase();
    if (!["day", "week", "month"].includes(bucket)) {
      return res.status(400).json({ error: "bucket must be day|week|month" });
    }

    const { start, end } = req.query.startDate && req.query.endDate
      ? { start: parseYMD(req.query.startDate), end: parseYMD(req.query.endDate) }
      : defaultRangeLast7Days();

    const bucketsArr = getBuckets(start, end, bucket);

    const startSql = `${bucketsArr[0].startDate} 00:00:00`;
    const endSql = `${bucketsArr[bucketsArr.length - 1].endDate} 23:59:59`;

    const [events] = await pool.execute(
      "SELECT event_type, event_time FROM product_history WHERE event_time BETWEEN ? AND ? ORDER BY event_time ASC",
      [startSql, endSql]
    );

    const trend = bucketsArr.map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      productsAdded: 0,
      productsRemoved: 0,
      totalProducts: 0,
    }));

    events.forEach((ev) => {
      const ts = new Date(ev.event_time).getTime();
      for (const b of bucketsArr) {
        if (ts >= b._startTs && ts <= b._endTs) {
          if (ev.event_type === "created") b.productsAdded++;
          if (ev.event_type === "deleted") b.productsRemoved++;
          break;
        }
      }
    });

    for (const b of trend) {
      const bucketEndSql = `${b.endDate} 23:59:59`;
      const [[{ c: created }]] = await pool.execute(
        "SELECT COUNT(*) AS c FROM product_history WHERE event_type='created' AND event_time <= ?",
        [bucketEndSql]
      );
      const [[{ c: deleted }]] = await pool.execute(
        "SELECT COUNT(*) AS c FROM product_history WHERE event_type='deleted' AND event_time <= ?",
        [bucketEndSql]
      );
      b.totalProducts = created - deleted;
    }

    const [[{ c: currentCreated }]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM product_history WHERE event_type='created' AND event_time <= ?",
      [endSql]
    );
    const [[{ c: currentDeleted }]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM product_history WHERE event_type='deleted' AND event_time <= ?",
      [endSql]
    );

    res.json({ currentTotal: currentCreated - currentDeleted, trend });
  } catch (err) {
    console.error("getProducts analytics error", err);
    res.status(500).json({ error: "internal server error" });
  }
}

// --- Export all functions ---

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
  getProducts
};
