// Unified Data Interfaces for Toko Hafiz Stock Prediction System

export interface StockData {
  // Core stock information
  currentStock: number;
  avgSales: number;
  leadTime: number;

  // Optional extended fields
  productId?: string;
  productName?: string;
  category?: string;
  price?: number;
  minStock?: number;
  maxStock?: number;

  // Prediction target
  status: StockStatus;
}

export type StockStatus = 'PerluRestock' | 'Aman' | 'Rendah' | 'Cukup' | 'Berlebih';

export interface PredictionInput {
  currentStock: number;
  avgSales: number;
  leadTime: number;
  productId?: string;
}

export interface PredictionOutput {
  prediction: StockStatus;
  confidence: number;
  recommendation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  reasoning: string[];
  modelInfo: {
    id: string;
    version: string;
    accuracy: number;
    createdAt: string;
  };
}

export interface TrainingDataset {
  data: StockData[];
  metadata: {
    source: string;
    createdAt: string;
    version: string;
    totalRecords: number;
    featureCount: number;
    classDistribution: Record<StockStatus, number>;
  };
}

export interface ModelMetadata {
  id: string;
  name: string;
  version: string;
  algorithm: 'C4.5' | 'ID3' | 'CART';
  createdAt: string;
  updatedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  crossValidationFolds?: number;
  hyperparameters: {
    minSamples?: number;
    minGainRatio?: number;
    maxDepth?: number;
  };
  tags: string[];
  isActive: boolean;
}

// Data transformation utilities
export class DataTransformer {
  /**
   * Transform CSV data to unified StockData format
   */
  static fromCSV(csvData: any[]): StockData[] {
    return csvData.map(row => ({
      currentStock: Number(row.StokSekarang || row.stok_sekarang || 0),
      avgSales: Number(row.PenjualanRata2 || row.penjualan_rata2 || 0),
      leadTime: Number(row.LeadTime || row.lead_time || 1),
      productId: row.productId || row.kode_barang,
      productName: row.productName || row.nama_barang || row.jenis_barang,
      category: row.category || row.kategori,
      price: Number(row.price || row.harga || 0),
      minStock: Number(row.minStock || row.stok_minimum || 0),
      maxStock: Number(row.maxStock || row.stok_maksimum || 0),
      status: this.mapStatus(row.Label || row.status_stok || row.status)
    }));
  }

  /**
   * Transform unified StockData to prediction input
   */
  static toPredictionInput(data: StockData): PredictionInput {
    return {
      currentStock: data.currentStock,
      avgSales: data.avgSales,
      leadTime: data.leadTime,
      productId: data.productId
    };
  }

  /**
   * Map various status representations to unified format
   */
  private static mapStatus(status: string): StockStatus {
    const statusMap: Record<string, StockStatus> = {
      'PerluRestock': 'PerluRestock',
      'perlu restock': 'PerluRestock',
      'restock': 'PerluRestock',
      'Aman': 'Aman',
      'aman': 'Aman',
      'safe': 'Aman',
      'Rendah': 'Rendah',
      'rendah': 'Rendah',
      'low': 'Rendah',
      'Cukup': 'Cukup',
      'cukup': 'Cukup',
      'sufficient': 'Cukup',
      'Berlebih': 'Berlebih',
      'berlebih': 'Berlebih',
      'excess': 'Berlebih'
    };

    return statusMap[status.toLowerCase()] || 'Cukup';
  }

  /**
   * Validate StockData integrity
   */
  static validate(data: StockData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.currentStock < 0) errors.push('Current stock cannot be negative');
    if (data.avgSales < 0) errors.push('Average sales cannot be negative');
    if (data.leadTime <= 0) errors.push('Lead time must be positive');
    if (data.price && data.price < 0) errors.push('Price cannot be negative');

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Legacy compatibility interfaces
export interface LegacyTrainingData {
  [key: string]: string | number;
}

export interface LegacyPredictionResult {
  prediction: string;
  confidence: number;
  path: string[];
}

// Adapter for legacy compatibility
export class LegacyAdapter {
  static toUnified(data: LegacyTrainingData): StockData {
    return DataTransformer.fromCSV([data])[0];
  }

  static fromUnified(data: StockData): LegacyTrainingData {
    return {
      StokSekarang: data.currentStock,
      PenjualanRata2: data.avgSales,
      LeadTime: data.leadTime,
      Label: data.status,
      ...(data.productId && { kode_barang: data.productId }),
      ...(data.productName && { nama_barang: data.productName }),
      ...(data.category && { kategori: data.category }),
      ...(data.price && { harga: data.price })
    };
  }

  static predictionToUnified(legacy: LegacyPredictionResult): PredictionOutput {
    return {
      prediction: legacy.prediction as StockStatus,
      confidence: legacy.confidence,
      recommendation: this.generateRecommendation(legacy.prediction, legacy.confidence),
      riskLevel: this.calculateRiskLevel(legacy.confidence),
      reasoning: [`Decision path: ${legacy.path.join(' → ')}`],
      modelInfo: {
        id: 'legacy-model',
        version: '1.0.0',
        accuracy: 0.75,
        createdAt: new Date().toISOString()
      }
    };
  }

  private static generateRecommendation(prediction: string, confidence: number): string {
    if (prediction.toLowerCase().includes('restock')) {
      return `Perlu restock segera. Confidence: ${(confidence * 100).toFixed(1)}%`;
    }
    return `Stok aman. Confidence: ${(confidence * 100).toFixed(1)}%`;
  }

  private static calculateRiskLevel(confidence: number): 'Low' | 'Medium' | 'High' {
    if (confidence > 0.8) return 'Low';
    if (confidence > 0.6) return 'Medium';
    return 'High';
  }
}