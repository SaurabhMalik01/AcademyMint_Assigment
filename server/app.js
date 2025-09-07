const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
console.log(".env path:", __dirname + "/../.env");  // Adjust if needed
console.log("DB_USER:", process.env.DB_USER);


const express = require("express");
const bcrypt = require("bcryptjs");
const fileUpload = require("express-fileupload");
const cors = require("cors");

// Routers
const productsRouter = require("./routes/products");
const productImagesRouter = require("./routes/productImages");
const categoryRouter = require("./routes/category");
const searchRouter = require("./routes/search");
const mainImageRouter = require("./routes/mainImages");
const userRouter = require("./routes/users");
const orderRouter = require("./routes/customer_orders");
const slugRouter = require("./routes/slugs");
const orderProductRouter = require("./routes/customer_order_product");
const wishlistRouter = require("./routes/wishlist");
const dashboardRouter = require("./routes/dashboard");   // ✅ NEW

// Middleware
const visitorLogger = require("./middleware/visitorLogger")(); // ✅ NEW

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(fileUpload());

// ✅ log every request into visitor_logs (non-blocking)
app.use(visitorLogger);

// API routes
app.use("/api/products", productsRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/images", productImagesRouter);
app.use("/api/main-image", mainImageRouter);
app.use("/api/users", userRouter);
app.use("/api/search", searchRouter);
app.use("/api/orders", orderRouter);
app.use("/api/order-product", orderProductRouter);
app.use("/api/slugs", slugRouter);
app.use("/api/wishlist", wishlistRouter);

// ✅ new analytics routes
app.use("/dashboard", dashboardRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const pool = require("./db");

pool.getConnection()
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ Database connection failed:", err));
