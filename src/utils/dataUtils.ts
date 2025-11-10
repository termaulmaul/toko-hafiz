// Data Utilities for toko-hafiz
import { TrainingData } from '../algorithms/C45';

export interface CSVRow {
  [key: string]: string | number;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataStatistics {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  columns: string[];
  columnStats: Record<string, {
    type: 'string' | 'number';
    uniqueValues: number;
    nullCount: number;
    sampleValues: any[];
  }>;
}

/**
 * Parse CSV data from string
 */
export function parseCSV(csvString: string): CSVRow[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV harus memiliki minimal header dan 1 baris data');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      console.warn(`Baris ${i + 1} memiliki jumlah kolom yang tidak sesuai`);
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      // Try to parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && value !== '') {
        row[header] = numValue;
      } else {
        row[header] = value;
      }
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Convert CSV data to training data format
 */
export function csvToTrainingData(csvData: CSVRow[]): TrainingData[] {
  return csvData.map(row => {
    const trainingRow: TrainingData = {};
    
    Object.entries(row).forEach(([key, value]) => {
      trainingRow[key] = value;
    });

    return trainingRow;
  });
}

/**
 * Validate training data
 */
export function validateTrainingData(
  data: TrainingData[], 
  requiredColumns: string[] = ['StokSekarang', 'PenjualanRata2', 'LeadTime', 'Label']
): DataValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Data tidak boleh kosong');
    return { isValid: false, errors, warnings };
  }

  // Check required columns
  const firstRow = data[0];
  const availableColumns = Object.keys(firstRow);
  
  requiredColumns.forEach(column => {
    if (!availableColumns.includes(column)) {
      errors.push(`Kolom '${column}' tidak ditemukan`);
    }
  });

  // Check data types and values
  data.forEach((row, index) => {
    // Check numeric columns
    ['StokSekarang', 'PenjualanRata2', 'LeadTime'].forEach(column => {
      if (row[column] !== undefined) {
        const value = row[column];
        if (typeof value !== 'number' || isNaN(value as number)) {
          errors.push(`Baris ${index + 1}: Kolom '${column}' harus berupa angka`);
        } else if ((value as number) < 0) {
          warnings.push(`Baris ${index + 1}: Kolom '${column}' memiliki nilai negatif`);
        }
      }
    });

    // Check label column
    if (row.Label !== undefined) {
      const label = row.Label as string;
      if (typeof label !== 'string' || label.trim() === '') {
        errors.push(`Baris ${index + 1}: Label tidak boleh kosong`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get data statistics
 */
export function getDataStatistics(data: TrainingData[]): DataStatistics {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      columns: [],
      columnStats: {}
    };
  }

  const columns = Object.keys(data[0]);
  const columnStats: Record<string, any> = {};

  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    const uniqueValues = [...new Set(values)];
    const nullCount = data.length - values.length;

    // Determine type
    const sampleValues = values.slice(0, 5);
    const isNumeric = sampleValues.every(v => typeof v === 'number');

    columnStats[column] = {
      type: isNumeric ? 'number' : 'string',
      uniqueValues: uniqueValues.length,
      nullCount,
      sampleValues
    };
  });

  return {
    totalRows: data.length,
    validRows: data.length,
    invalidRows: 0,
    columns,
    columnStats
  };
}

/**
 * Clean and normalize data
 */
export function cleanData(data: TrainingData[]): TrainingData[] {
  return data.map(row => {
    const cleanedRow: TrainingData = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // Remove whitespace from strings
      if (typeof value === 'string') {
        cleanedRow[key] = value.trim();
      } else {
        cleanedRow[key] = value;
      }
    });

    return cleanedRow;
  });
}

/**
 * Split data into train and test sets
 */
export function splitData(
  data: TrainingData[], 
  testRatio: number = 0.2,
  randomSeed?: number
): { train: TrainingData[]; test: TrainingData[] } {
  if (randomSeed !== undefined) {
    // Simple seeded shuffle (not cryptographically secure)
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((randomSeed + i) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    const testSize = Math.floor(shuffled.length * testRatio);
    return {
      train: shuffled.slice(testSize),
      test: shuffled.slice(0, testSize)
    };
  }

  // Random shuffle
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const testSize = Math.floor(shuffled.length * testRatio);
  
  return {
    train: shuffled.slice(testSize),
    test: shuffled.slice(0, testSize)
  };
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: TrainingData[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(',')];

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Generate sample data for testing
 */
export function generateSampleData(count: number = 100): TrainingData[] {
  const data: TrainingData[] = [];
  
  for (let i = 0; i < count; i++) {
    const stok = Math.floor(Math.random() * 100) + 10;
    const penjualan = Math.floor(Math.random() * 50) + 10;
    const leadTime = Math.floor(Math.random() * 10) + 1;
    
    // Simple rule for label generation
    let label: string;
    if (stok < 30 && penjualan > 30) {
      label = 'PerluRestock';
    } else if (stok > 70 && penjualan < 20) {
      label = 'Aman';
    } else {
      label = Math.random() > 0.5 ? 'PerluRestock' : 'Aman';
    }

    data.push({
      StokSekarang: stok,
      PenjualanRata2: penjualan,
      LeadTime: leadTime,
      Label: label
    });
  }

  return data;
}