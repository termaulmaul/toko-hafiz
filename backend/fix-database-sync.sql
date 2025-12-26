-- Database Synchronization Script for db_toko_hafiz
-- This script ensures the database schema matches the application requirements

USE db_toko_hafiz;

-- Add missing columns to model_runs if they don't exist
ALTER TABLE model_runs
  ADD COLUMN IF NOT EXISTS confusion_matrix LONGTEXT NULL AFTER tree_structure,
  ADD COLUMN IF NOT EXISTS training_time_ms INT DEFAULT 0 AFTER test_samples,
  ADD COLUMN IF NOT EXISTS rules_count INT DEFAULT 0 AFTER f1_score;

-- Ensure correct column types and constraints for model_runs
ALTER TABLE model_runs
  MODIFY COLUMN algorithm VARCHAR(50) NOT NULL DEFAULT 'C4.5',
  MODIFY COLUMN accuracy DECIMAL(5,4) NOT NULL,
  MODIFY COLUMN `precision` DECIMAL(5,4) NOT NULL,
  MODIFY COLUMN recall DECIMAL(5,4) NOT NULL,
  MODIFY COLUMN f1_score DECIMAL(5,4) NOT NULL,
  MODIFY COLUMN tree_structure LONGTEXT NOT NULL,
  MODIFY COLUMN training_samples INT NOT NULL,
  MODIFY COLUMN test_samples INT NOT NULL;

-- Add missing columns to model_rules if they don't exist
ALTER TABLE model_rules
  ADD COLUMN IF NOT EXISTS rule_number INT NOT NULL AFTER model_run_id,
  ADD COLUMN IF NOT EXISTS support_count INT NOT NULL AFTER confidence;

-- Ensure correct column names and types for model_rules
-- Check if old column names exist and rename them
SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'db_toko_hafiz'
  AND TABLE_NAME = 'model_rules'
  AND COLUMN_NAME = 'rule_condition'
);

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE model_rules CHANGE rule_condition condition_text TEXT NOT NULL;',
  'SELECT "condition_text column already exists" as status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'db_toko_hafiz'
  AND TABLE_NAME = 'model_rules'
  AND COLUMN_NAME = 'rule_result'
);

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE model_rules CHANGE rule_result predicted_class VARCHAR(50) NOT NULL;',
  'SELECT "predicted_class column already exists" as status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure predictions table has correct structure
-- First, check if we need to migrate data from old structure to new structure
SET @old_structure_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'db_toko_hafiz'
  AND TABLE_NAME = 'predictions'
  AND COLUMN_NAME = 'jenis_barang'
);

-- If old structure exists, we need to migrate data
-- For now, we'll recreate the table with correct structure if needed
-- (This is a simplified approach - in production, you'd want proper data migration)

-- Create backup of predictions table if it has old structure
SET @sql = IF(@old_structure_exists > 0,
  'CREATE TABLE predictions_backup AS SELECT * FROM predictions;',
  'SELECT "No old structure found" as status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Recreate predictions table with correct structure if needed
SET @sql = IF(@old_structure_exists > 0,
  'DROP TABLE predictions;',
  'SELECT "Table structure is already correct" as status;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create predictions table with correct structure
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_run_id INT NOT NULL,
    input_data LONGTEXT NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    actual_class VARCHAR(50) NULL,
    is_correct TINYINT(1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    INDEX idx_model_run (model_run_id),
    INDEX idx_predicted_class (predicted_class),
    INDEX idx_confidence (confidence)
);

-- Add missing indexes if they don't exist
ALTER TABLE model_runs
  ADD INDEX IF NOT EXISTS idx_algorithm (algorithm),
  ADD INDEX IF NOT EXISTS idx_accuracy (accuracy DESC),
  ADD INDEX IF NOT EXISTS idx_created_at (created_at);

ALTER TABLE model_rules
  ADD INDEX IF NOT EXISTS idx_model_run (model_run_id),
  ADD INDEX IF NOT EXISTS idx_confidence (confidence);

ALTER TABLE predictions
  ADD INDEX IF NOT EXISTS idx_model_run (model_run_id),
  ADD INDEX IF NOT EXISTS idx_predicted_class (predicted_class),
  ADD INDEX IF NOT EXISTS idx_confidence (confidence);

-- Update any NULL values in critical columns
UPDATE model_runs SET rules_count = 0 WHERE rules_count IS NULL;
UPDATE model_runs SET training_time_ms = 0 WHERE training_time_ms IS NULL;

-- Ensure data integrity
UPDATE model_rules SET support_count = 1 WHERE support_count IS NULL OR support_count = 0;

-- Final verification
SELECT 'Database synchronization completed!' as status;
SELECT
  (SELECT COUNT(*) FROM data_unified) as data_records,
  (SELECT COUNT(*) FROM model_runs) as model_runs,
  (SELECT COUNT(*) FROM model_rules) as total_rules,
  (SELECT COUNT(*) FROM predictions) as predictions;