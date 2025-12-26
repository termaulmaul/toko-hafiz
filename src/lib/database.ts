import mysql from 'mysql2/promise';

// Konfigurasi database MySQL
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'db_toko_hafiz',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

// Pool koneksi untuk performa yang lebih baik
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface DataUnified {
  id: number;
  jenis_barang: string;
  kategori: string;
  harga: number;
  bulan: string;
  jumlah_penjualan: number;
  stok: number;
  status: 'grosir' | 'eceran';
  status_penjualan: string;
  status_stok: 'Rendah' | 'Cukup' | 'Berlebih';
  split_type?: 'latih' | 'uji';
  split_percentage?: number;
  is_processed?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ModelRun {
  id: number;
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  tree_structure: string;
  confusionMatrix?: any; // Added confusionMatrix property
  rules_count: number;
  training_samples: number;
  test_samples: number;
  created_at: Date;
  updated_at: Date;
}

export interface ModelRule {
  id: number;
  model_run_id: number;
  rule_condition: string;
  rule_result: string;
  confidence: number;
  support: number;
  created_at: Date;
  updated_at: Date;
}

export interface Prediction {
  id: number;
  model_run_id: number;
  jenis_barang: string;
  kategori: string;
  harga: number;
  bulan: string;
  jumlah_penjualan: number;
  stok: number;
  status: string;
  predicted_status_stok: string;
  confidence: number;
  created_at: Date;
  updated_at: Date;
}

// Database helper functions
export class DatabaseService {
  // Test koneksi database
  static async testConnection(): Promise<boolean> {
    try {
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // Ambil semua data unified
  static async getAllDataUnified(): Promise<DataUnified[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM data_unified ORDER BY created_at DESC'
      );
      return rows as DataUnified[];
    } catch (error) {
      console.error('Error fetching data unified:', error);
      throw error;
    }
  }

  // Ambil data latih untuk C4.5
  static async getTrainingData(): Promise<DataUnified[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM data_unified WHERE split_type = ? ORDER BY created_at DESC',
        ['latih']
      );
      return rows as DataUnified[];
    } catch (error) {
      console.error('Error fetching training data:', error);
      throw error;
    }
  }

  // Ambil data uji untuk C4.5
  static async getTestingData(): Promise<DataUnified[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM data_unified WHERE split_type = ? ORDER BY created_at DESC',
        ['uji']
      );
      return rows as DataUnified[];
    } catch (error) {
      console.error('Error fetching testing data:', error);
      throw error;
    }
  }

  // Simpan hasil model run
  static async saveModelRun(modelRun: Omit<ModelRun, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      const [result] = await pool.execute(
        `INSERT INTO model_runs 
         (algorithm, accuracy, precision, recall, f1_score, tree_structure, rules_count, training_samples, test_samples) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          modelRun.algorithm,
          modelRun.accuracy,
          modelRun.precision,
          modelRun.recall,
          modelRun.f1_score,
          modelRun.tree_structure,
          modelRun.rules_count,
          modelRun.training_samples,
          modelRun.test_samples
        ]
      );
      return (result as any).insertId;
    } catch (error) {
      console.error('Error saving model run:', error);
      throw error;
    }
  }

  // Simpan rules model
  static async saveModelRules(modelRunId: number, rules: Array<{
    rule_condition: string;
    rule_result: string;
    confidence: number;
    support: number;
  }>): Promise<void> {
    try {
      const values = rules.map(rule => [
        modelRunId,
        rule.rule_condition,
        rule.rule_result,
        rule.confidence,
        rule.support
      ]);

      await pool.execute(
        `INSERT INTO model_rules (model_run_id, rule_condition, rule_result, confidence, support) 
         VALUES ${values.map(() => '(?, ?, ?, ?, ?)').join(', ')}`,
        values.flat()
      );
    } catch (error) {
      console.error('Error saving model rules:', error);
      throw error;
    }
  }

  // Simpan prediksi
  static async savePrediction(prediction: Omit<Prediction, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    try {
      const [result] = await pool.execute(
        `INSERT INTO predictions 
         (model_run_id, jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, predicted_status_stok, confidence) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prediction.model_run_id,
          prediction.jenis_barang,
          prediction.kategori,
          prediction.harga,
          prediction.bulan,
          prediction.jumlah_penjualan,
          prediction.stok,
          prediction.status,
          prediction.predicted_status_stok,
          prediction.confidence
        ]
      );
      return (result as any).insertId;
    } catch (error) {
      console.error('Error saving prediction:', error);
      throw error;
    }
  }

  // Ambil semua model runs
  static async getModelRuns(): Promise<ModelRun[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM model_runs ORDER BY created_at DESC'
      );
      return rows as ModelRun[];
    } catch (error) {
      console.error('Error fetching model runs:', error);
      throw error;
    }
  }

  // Ambil rules untuk model tertentu
  static async getModelRules(modelRunId: number): Promise<ModelRule[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM model_rules WHERE model_run_id = ? ORDER BY confidence DESC',
        [modelRunId]
      );
      return rows as ModelRule[];
    } catch (error) {
      console.error('Error fetching model rules:', error);
      throw error;
    }
  }

  // Ambil prediksi untuk model tertentu
  static async getPredictions(modelRunId: number): Promise<Prediction[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM predictions WHERE model_run_id = ? ORDER BY created_at DESC',
        [modelRunId]
      );
      return rows as Prediction[];
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  }

  // Validasi kualitas data
  static async validateDataQuality(): Promise<{
    status: 'success' | 'warning' | 'error';
    message: string;
    total_count: number;
    balance_ratio?: number;
    unique_counts?: Record<string, number>;
    distribution?: Array<{ status_stok: string; count: number }>;
    missing_fields?: string[];
    outlier_fields?: string[];
  }> {
    try {
      // Hitung total data
      const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM data_unified');
      const total = (totalResult as any)[0].total;

      if (total < 50) {
        return {
          status: 'error',
          message: 'Data terlalu sedikit. Minimal 50 records untuk C4.5.',
          total_count: total
        };
      }

      // Cek distribusi status_stok
      const [distributionResult] = await pool.execute(
        'SELECT status_stok, COUNT(*) as count FROM data_unified GROUP BY status_stok'
      );
      const distribution = distributionResult as Array<{ status_stok: string; count: number }>;

      const counts = distribution.map(d => d.count);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      const balanceRatio = maxCount > 0 ? minCount / maxCount : 0;

      // Cek missing values
      const [missingResult] = await pool.execute(`
        SELECT 
          SUM(CASE WHEN jenis_barang IS NULL OR jenis_barang = '' THEN 1 ELSE 0 END) as missing_jenis_barang,
          SUM(CASE WHEN kategori IS NULL OR kategori = '' THEN 1 ELSE 0 END) as missing_kategori,
          SUM(CASE WHEN harga IS NULL OR harga <= 0 THEN 1 ELSE 0 END) as missing_harga,
          SUM(CASE WHEN bulan IS NULL OR bulan = '' THEN 1 ELSE 0 END) as missing_bulan,
          SUM(CASE WHEN jumlah_penjualan IS NULL OR jumlah_penjualan <= 0 THEN 1 ELSE 0 END) as missing_jumlah_penjualan,
          SUM(CASE WHEN stok IS NULL OR stok < 0 THEN 1 ELSE 0 END) as missing_stok,
          SUM(CASE WHEN status IS NULL OR status = '' THEN 1 ELSE 0 END) as missing_status,
          SUM(CASE WHEN status_penjualan IS NULL OR status_penjualan = '' THEN 1 ELSE 0 END) as missing_status_penjualan,
          SUM(CASE WHEN status_stok IS NULL OR status_stok = '' THEN 1 ELSE 0 END) as missing_status_stok
        FROM data_unified
      `);

      const missing = missingResult as any[0];
      const missingFields: string[] = [];
      
      if (missing.missing_jenis_barang > 0) missingFields.push(`jenis_barang: ${missing.missing_jenis_barang}`);
      if (missing.missing_kategori > 0) missingFields.push(`kategori: ${missing.missing_kategori}`);
      if (missing.missing_harga > 0) missingFields.push(`harga: ${missing.missing_harga}`);
      if (missing.missing_bulan > 0) missingFields.push(`bulan: ${missing.missing_bulan}`);
      if (missing.missing_jumlah_penjualan > 0) missingFields.push(`jumlah_penjualan: ${missing.missing_jumlah_penjualan}`);
      if (missing.missing_stok > 0) missingFields.push(`stok: ${missing.missing_stok}`);
      if (missing.missing_status > 0) missingFields.push(`status: ${missing.missing_status}`);
      if (missing.missing_status_penjualan > 0) missingFields.push(`status_penjualan: ${missing.missing_status_penjualan}`);
      if (missing.missing_status_stok > 0) missingFields.push(`status_stok: ${missing.missing_status_stok}`);

      if (missingFields.length > 0) {
        return {
          status: 'error',
          message: 'DITEMUKAN MISSING VALUES! Data tidak aman untuk C4.5.',
          total_count: total,
          missing_fields: missingFields
        };
      }

      // Hitung unique counts
      const [uniqueResult] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT jenis_barang) as unique_jenis_barang,
          COUNT(DISTINCT kategori) as unique_kategori,
          COUNT(DISTINCT bulan) as unique_bulan
        FROM data_unified
      `);

      const unique = uniqueResult as any[0];

      return {
        status: 'success',
        message: '✅ Kualitas data EXCELLENT untuk C4.5!',
        total_count: total,
        balance_ratio: balanceRatio,
        unique_counts: {
          jenis_barang: unique.unique_jenis_barang,
          kategori: unique.unique_kategori,
          bulan: unique.unique_bulan
        },
        distribution
      };
    } catch (error) {
      console.error('Error validating data quality:', error);
      throw error;
    }
  }
}

export default pool;
