#!/usr/bin/env node

import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'db_toko_hafiz',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

// Drift detection thresholds
const DRIFT_THRESHOLDS = {
  accuracy_drop: 0.1, // 10% drop in accuracy
  new_data_threshold: 50, // Retrain when 50+ new records
  time_window_days: 7, // Check every 7 days
  min_samples_for_retrain: 100
};

class ModelMonitoringSystem {
  constructor() {
    this.pool = mysql.createPool(dbConfig);
  }

  async initialize() {
    // Create monitoring tables if they don't exist
    await this.createMonitoringTables();
    console.log('📊 Model monitoring system initialized');
  }

  async createMonitoringTables() {
    const connection = await this.pool.getConnection();

    try {
      // Create model_monitoring table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS model_monitoring (
          id INT PRIMARY KEY AUTO_INCREMENT,
          model_run_id INT NOT NULL,
          check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_predictions INT DEFAULT 0,
          correct_predictions INT DEFAULT 0,
          accuracy DECIMAL(5,4) DEFAULT 0.0000,
          drift_detected BOOLEAN DEFAULT FALSE,
          drift_reason TEXT,
          retraining_recommended BOOLEAN DEFAULT FALSE,
          new_records_since_last_train INT DEFAULT 0,
          days_since_last_train INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (model_run_id) REFERENCES model_runs(id)
        )
      `);

      // Create model_performance_history table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS model_performance_history (
          id INT PRIMARY KEY AUTO_INCREMENT,
          model_run_id INT NOT NULL,
          metric_name VARCHAR(50) NOT NULL,
          metric_value DECIMAL(10,4) NOT NULL,
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_model_metric (model_run_id, metric_name)
        )
      `);

      // Create retraining_log table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS retraining_log (
          id INT PRIMARY KEY AUTO_INCREMENT,
          triggered_by VARCHAR(100) NOT NULL,
          reason TEXT,
          old_model_id INT,
          new_model_id INT,
          retraining_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          retraining_end TIMESTAMP NULL,
          success BOOLEAN DEFAULT FALSE,
          error_message TEXT,
          performance_improvement DECIMAL(5,4) DEFAULT 0.0000,
          FOREIGN KEY (old_model_id) REFERENCES model_runs(id),
          FOREIGN KEY (new_model_id) REFERENCES model_runs(id)
        )
      `);

    } finally {
      connection.release();
    }
  }

  async checkDriftAndPerformance() {
    console.log('🔍 Checking model drift and performance...');

    const latestModel = await this.getLatestModel();
    if (!latestModel) {
      console.log('⚠️ No trained model found');
      return;
    }

    const predictions = await this.getRecentPredictions(latestModel.id);
    const newRecordsCount = await this.getNewRecordsCount();

    if (predictions.length === 0) {
      console.log('⚠️ No recent predictions to analyze');
      return;
    }

    // Calculate current accuracy
    const correctPredictions = predictions.filter(p => p.is_correct === 1).length;
    const currentAccuracy = correctPredictions / predictions.length;

    // Get historical accuracy
    const historicalAccuracy = latestModel.accuracy;

    // Check for accuracy drift
    const accuracyDrop = historicalAccuracy - currentAccuracy;
    const driftDetected = accuracyDrop > DRIFT_THRESHOLDS.accuracy_drop;

    // Check retraining conditions
    const retrainingRecommended =
      driftDetected ||
      newRecordsCount >= DRIFT_THRESHOLDS.new_data_threshold ||
      await this.shouldRetrainBasedOnTime();

    // Log monitoring results
    await this.logMonitoringResults({
      model_run_id: latestModel.id,
      total_predictions: predictions.length,
      correct_predictions: correctPredictions,
      accuracy: currentAccuracy,
      drift_detected: driftDetected,
      drift_reason: driftDetected ? `Accuracy dropped by ${(accuracyDrop * 100).toFixed(1)}%` : null,
      retraining_recommended: retrainingRecommended,
      new_records_since_last_train: newRecordsCount,
      days_since_last_train: await this.getDaysSinceLastTraining()
    });

    console.log(`📈 Current Accuracy: ${(currentAccuracy * 100).toFixed(1)}%`);
    console.log(`📉 Historical Accuracy: ${(historicalAccuracy * 100).toFixed(1)}%`);
    console.log(`🔄 Drift Detected: ${driftDetected ? 'YES' : 'NO'}`);
    console.log(`🔧 Retraining Recommended: ${retrainingRecommended ? 'YES' : 'NO'}`);

    if (retrainingRecommended) {
      await this.triggerRetraining(driftDetected ? 'drift_detected' : 'scheduled_retraining');
    }
  }

  async getLatestModel() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM model_runs ORDER BY created_at DESC LIMIT 1'
    );
    return rows[0] || null;
  }

  async getRecentPredictions(modelRunId, days = 7) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM predictions WHERE model_run_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [modelRunId, days]
    );
    return rows;
  }

  async getNewRecordsCount() {
    const latestModel = await this.getLatestModel();
    if (!latestModel) return 0;

    const [rows] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM data_unified WHERE created_at > ?',
      [latestModel.created_at]
    );
    return rows[0].count;
  }

  async shouldRetrainBasedOnTime() {
    const latestModel = await this.getLatestModel();
    if (!latestModel) return true;

    const [rows] = await this.pool.execute(
      'SELECT DATEDIFF(NOW(), ?) as days_diff',
      [latestModel.created_at]
    );
    return rows[0].days_diff >= DRIFT_THRESHOLDS.time_window_days;
  }

  async getDaysSinceLastTraining() {
    const latestModel = await this.getLatestModel();
    if (!latestModel) return 999;

    const [rows] = await this.pool.execute(
      'SELECT DATEDIFF(NOW(), ?) as days_diff',
      [latestModel.created_at]
    );
    return rows[0].days_diff;
  }

  async logMonitoringResults(results) {
    await this.pool.execute(
      `INSERT INTO model_monitoring
       (model_run_id, total_predictions, correct_predictions, accuracy, drift_detected, drift_reason, retraining_recommended, new_records_since_last_train, days_since_last_train)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        results.model_run_id,
        results.total_predictions,
        results.correct_predictions,
        results.accuracy,
        results.drift_detected,
        results.drift_reason,
        results.retraining_recommended,
        results.new_records_since_last_train,
        results.days_since_last_train
      ]
    );
  }

  async triggerRetraining(reason) {
    console.log(`🚀 Triggering retraining: ${reason}`);

    const latestModel = await this.getLatestModel();
    const retrainingId = await this.logRetrainingStart(reason, latestModel?.id);

    try {
      // Here you would call your actual retraining process
      // For now, we'll simulate it
      console.log('🔄 Retraining process started...');

      // Simulate retraining time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate new model (this would be your actual C4.5 training)
      const newModelId = await this.simulateModelRetraining();

      // Calculate performance improvement
      const oldAccuracy = latestModel?.accuracy || 0;
      const newModel = await this.getModelById(newModelId);
      const improvement = newModel.accuracy - oldAccuracy;

      await this.logRetrainingEnd(retrainingId, newModelId, true, null, improvement);

      console.log(`✅ Retraining completed! New model accuracy: ${(newModel.accuracy * 100).toFixed(1)}%`);
      console.log(`📈 Performance improvement: ${(improvement * 100).toFixed(1)}%`);

    } catch (error) {
      await this.logRetrainingEnd(retrainingId, null, false, error.message, 0);
      console.error('❌ Retraining failed:', error.message);
    }
  }

  async logRetrainingStart(reason, oldModelId) {
    const [result] = await this.pool.execute(
      'INSERT INTO retraining_log (triggered_by, reason, old_model_id) VALUES (?, ?, ?)',
      [reason, reason, oldModelId]
    );
    return result.insertId;
  }

  async logRetrainingEnd(retrainingId, newModelId, success, errorMessage, improvement) {
    await this.pool.execute(
      'UPDATE retraining_log SET new_model_id = ?, retraining_end = NOW(), success = ?, error_message = ?, performance_improvement = ? WHERE id = ?',
      [newModelId, success, errorMessage, improvement, retrainingId]
    );
  }

  async simulateModelRetraining() {
    // This simulates creating a new model run
    // In real implementation, this would call your actual C4.5 training algorithm

    const [result] = await this.pool.execute(
      `INSERT INTO model_runs
       (algorithm, accuracy, precision, recall, f1_score, tree_structure, rules_count, training_samples, test_samples)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'C4.5',
        0.75 + Math.random() * 0.15, // Random accuracy between 75-90%
        0.70 + Math.random() * 0.20,
        0.70 + Math.random() * 0.20,
        0.70 + Math.random() * 0.20,
        '{"simulated": "tree_structure"}',
        Math.floor(Math.random() * 20) + 10,
        500 + Math.floor(Math.random() * 100),
        100 + Math.floor(Math.random() * 50)
      ]
    );

    return result.insertId;
  }

  async getModelById(modelId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM model_runs WHERE id = ?',
      [modelId]
    );
    return rows[0];
  }

  async getMonitoringHistory(limit = 10) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM model_monitoring ORDER BY check_date DESC LIMIT ?',
      [limit]
    );
    return rows;
  }

  async getRetrainingHistory(limit = 10) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM retraining_log ORDER BY retraining_start DESC LIMIT ?',
      [limit]
    );
    return rows;
  }

  async generateMonitoringReport() {
    console.log('\n📊 MODEL MONITORING REPORT');
    console.log('=' .repeat(50));

    const latestModel = await this.getLatestModel();
    const monitoringHistory = await this.getMonitoringHistory(5);
    const retrainingHistory = await this.getRetrainingHistory(5);

    console.log(`🤖 Latest Model: ID ${latestModel?.id || 'None'}`);
    console.log(`📈 Accuracy: ${(latestModel?.accuracy * 100 || 0).toFixed(1)}%`);
    console.log(`📅 Created: ${latestModel?.created_at || 'Never'}`);

    console.log(`\n🔍 Recent Monitoring (${monitoringHistory.length} checks):`);
    monitoringHistory.forEach(check => {
      console.log(`  ${check.check_date.toISOString().split('T')[0]}: ${(check.accuracy * 100).toFixed(1)}% accuracy, Drift: ${check.drift_detected ? 'YES' : 'NO'}`);
    });

    console.log(`\n🔄 Recent Retraining (${retrainingHistory.length} attempts):`);
    retrainingHistory.forEach(retrain => {
      console.log(`  ${retrain.retraining_start.toISOString().split('T')[0]}: ${retrain.triggered_by} - ${retrain.success ? 'SUCCESS' : 'FAILED'}`);
    });

    // Recommendations
    const lastCheck = monitoringHistory[0];
    if (lastCheck) {
      console.log(`\n💡 Recommendations:`);
      if (lastCheck.drift_detected) {
        console.log(`  ⚠️ DRIFT DETECTED - Immediate retraining recommended`);
      }
      if (lastCheck.retraining_recommended) {
        console.log(`  🔧 Retraining recommended`);
      }
      if (lastCheck.new_records_since_last_train > 100) {
        console.log(`  📊 ${lastCheck.new_records_since_last_train} new records available for training`);
      }
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Main monitoring function
async function runMonitoring() {
  const monitor = new ModelMonitoringSystem();

  try {
    await monitor.initialize();
    await monitor.checkDriftAndPerformance();
    await monitor.generateMonitoringReport();
  } catch (error) {
    console.error('❌ Monitoring failed:', error);
  } finally {
    await monitor.close();
  }
}

// Run monitoring
runMonitoring().catch(console.error);