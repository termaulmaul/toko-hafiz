// Prediction Engine for C4.5 Algorithm
import { C45Algorithm, TreeNode, TrainingData, PredictionResult } from '../algorithms/C45';

export interface PredictionRequest {
  stokSekarang: number;
  penjualanRata2: number;
  leadTime: number;
  modelId?: string;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  recommendation: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  path: string[];
  modelInfo?: {
    id: string;
    accuracy: number;
    dataSize: number;
  };
}

export interface BatchPredictionRequest {
  data: TrainingData[];
  modelId?: string;
}

export interface BatchPredictionResponse {
  predictions: PredictionResponse[];
  summary: {
    total: number;
    restockNeeded: number;
    safe: number;
    averageConfidence: number;
  };
}

export class PredictionEngine {
  private algorithm: C45Algorithm;

  constructor() {
    this.algorithm = new C45Algorithm();
  }

  /**
   * Load model from localStorage
   */
  private loadModel(modelId: string): { tree: TreeNode; info: any } | null {
    try {
      const modelData = localStorage.getItem(`model_${modelId}`);
      if (!modelData) return null;

      const parsed = JSON.parse(modelData);
      return {
        tree: parsed.tree,
        info: parsed.info
      };
    } catch (error) {
      console.error('Error loading model:', error);
      return null;
    }
  }

  /**
   * Get default model (last trained model)
   */
  private getDefaultModel(): { tree: TreeNode; info: any } | null {
    const lastModelId = localStorage.getItem('lastModelId');
    if (!lastModelId) return null;

    return this.loadModel(lastModelId);
  }

  /**
   * Make single prediction
   */
  async predict(request: PredictionRequest): Promise<PredictionResponse> {
    const modelId = request.modelId || localStorage.getItem('lastModelId');
    
    if (!modelId) {
      throw new Error('Tidak ada model yang tersedia. Silakan train model terlebih dahulu.');
    }

    const model = this.loadModel(modelId);
    if (!model) {
      throw new Error(`Model dengan ID ${modelId} tidak ditemukan.`);
    }

    // Prepare data for prediction - standardize field names
    const data: TrainingData = {
      StokSekarang: request.stokSekarang,
      PenjualanRata2: request.penjualanRata2,
      LeadTime: request.leadTime
    };

    // Make prediction
    const result = this.algorithm.predict(model.tree, data);

    // Generate recommendation
    const recommendation = this.generateRecommendation(
      result.prediction, 
      request.stokSekarang, 
      request.penjualanRata2, 
      request.leadTime
    );

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(
      result.prediction, 
      result.confidence, 
      request.stokSekarang, 
      request.penjualanRata2
    );

    return {
      prediction: result.prediction,
      confidence: result.confidence,
      recommendation,
      riskLevel,
      path: result.path,
      modelInfo: {
        id: model.info.id,
        accuracy: model.info.accuracy,
        dataSize: model.info.dataSize
      }
    };
  }

  /**
   * Make batch predictions
   */
  async batchPredict(request: BatchPredictionRequest): Promise<BatchPredictionResponse> {
    const modelId = request.modelId || localStorage.getItem('lastModelId');
    
    if (!modelId) {
      throw new Error('Tidak ada model yang tersedia. Silakan train model terlebih dahulu.');
    }

    const model = this.loadModel(modelId);
    if (!model) {
      throw new Error(`Model dengan ID ${modelId} tidak ditemukan.`);
    }

    const predictions: PredictionResponse[] = [];

    for (const data of request.data) {
      const result = this.algorithm.predict(model.tree, data);
      
      const recommendation = this.generateRecommendation(
        result.prediction,
        data.StokSekarang as number,
        data.PenjualanRata2 as number,
        data.LeadTime as number
      );

      const riskLevel = this.calculateRiskLevel(
        result.prediction,
        result.confidence,
        data.StokSekarang as number,
        data.PenjualanRata2 as number
      );

      predictions.push({
        prediction: result.prediction,
        confidence: result.confidence,
        recommendation,
        riskLevel,
        path: result.path,
        modelInfo: {
          id: model.info.id,
          accuracy: model.info.accuracy,
          dataSize: model.info.dataSize
        }
      });
    }

    // Calculate summary
    const restockNeeded = predictions.filter(p => 
      p.prediction.toLowerCase().includes('restock') || 
      p.prediction.toLowerCase().includes('perlu')
    ).length;

    const safe = predictions.length - restockNeeded;
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    return {
      predictions,
      summary: {
        total: predictions.length,
        restockNeeded,
        safe,
        averageConfidence
      }
    };
  }

  /**
   * Generate recommendation based on prediction
   */
  private generateRecommendation(
    prediction: string, 
    stok: number, 
    penjualan: number, 
    leadTime: number
  ): string {
    const isRestock = prediction.toLowerCase().includes('restock') || 
                     prediction.toLowerCase().includes('perlu');

    if (isRestock) {
      // Calculate suggested order quantity
      const dailyDemand = penjualan / 30; // Assuming monthly sales
      const suggestedOrder = Math.ceil(dailyDemand * leadTime * 1.2); // 20% safety margin
      
      return `Perlu restock segera. Disarankan order ${suggestedOrder} unit untuk mengantisipasi permintaan selama ${leadTime} hari.`;
    } else {
      return `Stok aman. Tidak perlu restock saat ini. Stok ${stok} unit cukup untuk ${Math.ceil(stok / (penjualan / 30))} hari ke depan.`;
    }
  }

  /**
   * Calculate risk level based on prediction and confidence
   */
  private calculateRiskLevel(
    prediction: string, 
    confidence: number, 
    stok: number, 
    penjualan: number
  ): 'Low' | 'Medium' | 'High' {
    const isRestock = prediction.toLowerCase().includes('restock') || 
                     prediction.toLowerCase().includes('perlu');
    
    const stockDays = stok / (penjualan / 30); // Days of stock remaining

    if (isRestock) {
      if (stockDays < 3 || confidence < 0.7) {
        return 'High';
      } else if (stockDays < 7 || confidence < 0.8) {
        return 'Medium';
      } else {
        return 'Low';
      }
    } else {
      if (stockDays > 14 && confidence > 0.8) {
        return 'Low';
      } else if (stockDays > 7 && confidence > 0.7) {
        return 'Medium';
      } else {
        return 'High';
      }
    }
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(): any[] {
    try {
      const history = localStorage.getItem('prediction_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading prediction history:', error);
      return [];
    }
  }

  /**
   * Save prediction to history
   */
  savePredictionToHistory(prediction: PredictionResponse, request: PredictionRequest): void {
    try {
      const history = this.getPredictionHistory();
      const historyEntry = {
        timestamp: new Date().toISOString(),
        request,
        response: prediction
      };

      history.unshift(historyEntry);
      
      // Keep only last 100 predictions
      if (history.length > 100) {
        history.splice(100);
      }

      localStorage.setItem('prediction_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving prediction to history:', error);
    }
  }

  /**
   * Clear prediction history
   */
  clearPredictionHistory(): void {
    localStorage.removeItem('prediction_history');
  }
}