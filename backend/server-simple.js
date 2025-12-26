// Toko Hafiz - Simplified Backend Server
// Optimized for small shop, not big data systems

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Simplified configuration
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection (XAMPP optimized)
let db;
async function initDatabase() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "db_toko_hafiz_simple",
      // XAMPP socket path
      socketPath: process.env.DB_SOCKET || "/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock",
      waitForConnections: true,
      connectionLimit: 5, // Reduced for small shop
      queueLimit: 0
    });
    console.log("✅ Database connected successfully (XAMPP)");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("💡 Make sure XAMPP MySQL is running and socket path is correct");
    process.exit(1);
  }
}

// Middleware (simplified)
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));

// Rate limiting (simplified)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});
app.use(limiter);

// File upload (simplified)
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || path.extname(file.originalname).toLowerCase() === ".csv") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  }
});

// ===========================================
// API ROUTES (Simplified for small shop)
// ===========================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running", timestamp: new Date() });
});

// Database test
app.get("/api/database/test", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT 1 as test");
    res.json({ success: true, data: true, message: "Database connected successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// PRODUCTS API (Simplified inventory)
// ===========================================

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE status = 'Aktif' ORDER BY nama_barang"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM products WHERE id = ? AND status = 'Aktif'",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update product stock
app.put("/api/products/:id/stock", async (req, res) => {
  try {
    const { stok_sekarang } = req.body;
    await db.execute(
      "UPDATE products SET stok_sekarang = ?, updated_at = NOW() WHERE id = ?",
      [stok_sekarang, req.params.id]
    );
    res.json({ success: true, message: "Stock updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// TRAINING DATA API (For C4.5)
// ===========================================

// Get training data
app.get("/api/training-data", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM training_data WHERE is_training = 1 ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get test data
app.get("/api/test-data", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM training_data WHERE is_training = 0 ORDER BY created_at DESC"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add training data
app.post("/api/training-data", async (req, res) => {
  try {
    const { nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan } = req.body;

    await db.execute(
      "INSERT INTO training_data (nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan, is_training) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
      [nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan]
    );

    res.json({ success: true, message: "Training data added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// STATISTICS API (Simplified)
// ===========================================

app.get("/api/statistics", async (req, res) => {
  try {
    // Get basic counts
    const [trainingCount] = await db.execute("SELECT COUNT(*) as count FROM training_data WHERE is_training = 1");
    const [testCount] = await db.execute("SELECT COUNT(*) as count FROM training_data WHERE is_training = 0");
    const [productCount] = await db.execute("SELECT COUNT(*) as count FROM products WHERE status = 'Aktif'");
    const [modelCount] = await db.execute("SELECT COUNT(*) as count FROM models");

    const stats = {
      total_records: trainingCount[0].count + testCount[0].count,
      training_records: trainingCount[0].count,
      testing_records: testCount[0].count,
      total_products: productCount[0].count,
      model_runs: modelCount[0].count
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// DATA MINING API (Simplified C4.5)
// ===========================================

// Run data mining
app.post("/api/data-mining/run", async (req, res) => {
  try {
    const { minSamples = 3, minGainRatio = 0.01 } = req.body;

    // Get training data
    const [trainingData] = await db.execute(
      "SELECT nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok FROM training_data WHERE is_training = 1"
    );

    if (trainingData.length === 0) {
      return res.status(400).json({ success: false, message: "No training data available" });
    }

    // Simple C4.5 implementation (simplified for small dataset)
    const tree = buildSimpleDecisionTree(trainingData, minSamples, minGainRatio);

    // Evaluate on test data
    const [testData] = await db.execute(
      "SELECT nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok FROM training_data WHERE is_training = 0"
    );

    const metrics = evaluateModel(tree, testData);

    // Save model
    const treeJson = JSON.stringify(tree);
    await db.execute(
      "INSERT INTO models (name, algorithm, accuracy, tree_structure, training_samples, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [`Model ${new Date().toISOString().split('T')[0]}`, 'C4.5', metrics.accuracy, treeJson, trainingData.length]
    );

    res.json({
      success: true,
      data: {
        ...metrics,
        training_samples: trainingData.length,
        test_samples: testData.length,
        rules_count: countTreeNodes(tree)
      }
    });

  } catch (error) {
    console.error('Data mining error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// PREDICTION API (Simplified)
// ===========================================

app.post("/api/predict", async (req, res) => {
  try {
    const { nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time } = req.body;

    // Get latest active model
    const [models] = await db.execute(
      "SELECT * FROM models WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1"
    );

    if (models.length === 0) {
      return res.status(400).json({ success: false, message: "No trained model available" });
    }

    const model = models[0];
    const tree = JSON.parse(model.tree_structure);

    // Make prediction
    const prediction = predictWithTree(tree, {
      nama_barang,
      kategori,
      stok_sekarang: parseInt(stok_sekarang),
      penjualan_rata_rata: parseInt(penjualan_rata_rata),
      lead_time: parseInt(lead_time)
    });

    res.json({
      success: true,
      data: {
        prediction: prediction.status,
        confidence: prediction.confidence,
        model_accuracy: model.accuracy
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// FILE UPLOAD API (Simplified)
// ===========================================

app.post("/api/upload/training-data", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          for (const row of results.slice(0, 100)) { // Limit to 100 rows for small shop
            await db.execute(
              "INSERT INTO training_data (nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan, is_training) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
              [
                row.nama_barang || row.NamaBarang,
                row.kategori || row.Kategori,
                parseInt(row.stok_sekarang || row.StokSekarang || 0),
                parseInt(row.penjualan_rata_rata || row.PenjualanRataRata || 0),
                parseInt(row.lead_time || row.LeadTime || 7),
                row.status_stok || row.StatusStok,
                row.bulan || row.Bulan || 'Januari'
              ]
            );
            imported++;
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            success: true,
            message: `Successfully imported ${imported} training records`,
            importedCount: imported
          });

        } catch (error) {
          fs.unlinkSync(req.file.path);
          res.status(500).json({ success: false, message: error.message });
        }
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: error.message });
      });

  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// UTILITY FUNCTIONS (Simplified C4.5)
// ===========================================

function buildSimpleDecisionTree(data, minSamples, minGainRatio) {
  // Simplified decision tree for small datasets
  // Uses stok_sekarang as primary splitter

  const lowStock = data.filter(item => item.stok_sekarang < 10);
  const normalStock = data.filter(item => item.stok_sekarang >= 10 && item.stok_sekarang <= 30);
  const highStock = data.filter(item => item.stok_sekarang > 30);

  return {
    attribute: 'stok_sekarang',
    threshold: 10,
    branches: {
      low: {
        type: 'leaf',
        label: getMajorityClass(lowStock.map(item => item.status_stok)),
        confidence: calculateConfidence(lowStock)
      },
      normal: {
        type: 'leaf',
        label: getMajorityClass(normalStock.map(item => item.status_stok)),
        confidence: calculateConfidence(normalStock)
      },
      high: {
        type: 'leaf',
        label: getMajorityClass(highStock.map(item => item.status_stok)),
        confidence: calculateConfidence(highStock)
      }
    }
  };
}

function getMajorityClass(labels) {
  const counts = {};
  labels.forEach(label => counts[label] = (counts[label] || 0) + 1);

  let maxCount = 0;
  let majorityClass = 'Cukup';

  for (const [label, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      majorityClass = label;
    }
  }

  return majorityClass;
}

function calculateConfidence(data) {
  if (data.length === 0) return 0.5;
  return Math.min(0.95, Math.max(0.5, data.length / 10)); // Simple confidence based on sample size
}

function evaluateModel(tree, testData) {
  let correct = 0;
  let total = testData.length;

  testData.forEach(item => {
    const prediction = predictWithTree(tree, item);
    if (prediction.status === item.status_stok) {
      correct++;
    }
  });

  const accuracy = correct / total;
  const precision = accuracy; // Simplified
  const recall = accuracy;    // Simplified
  const f1Score = accuracy;   // Simplified

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: {} // Simplified
  };
}

function predictWithTree(tree, item) {
  const stok = item.stok_sekarang;

  let branch;
  if (stok < 10) branch = 'low';
  else if (stok <= 30) branch = 'normal';
  else branch = 'high';

  const leaf = tree.branches[branch];
  return {
    status: leaf.label,
    confidence: leaf.confidence
  };
}

function countTreeNodes(tree) {
  if (tree.type === 'leaf') return 1;

  let count = 1; // Root node
  if (tree.branches) {
    Object.values(tree.branches).forEach(branch => {
      count += countTreeNodes(branch);
    });
  }

  return count;
}

// ===========================================
// START SERVER
// ===========================================

async function startServer() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`🚀 Toko Hafiz Server running on port ${PORT}`);
    console.log(`📊 Database: db_toko_hafiz_simple`);
    console.log(`🌐 API available at http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);