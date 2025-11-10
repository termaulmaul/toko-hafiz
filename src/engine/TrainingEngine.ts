// Training Engine for C4.5 Algorithm
import { C45Algorithm, TreeNode, TrainingData, ModelMetrics } from '../algorithms/C45';

export interface TrainingConfig {
  minSamples: number;
  minGainRatio: number;
  targetAttribute: string;
  testSplitRatio: number;
}

export interface TrainingResult {
  tree: TreeNode;
  metrics: ModelMetrics;
  trainingData: TrainingData[];
  testData: TrainingData[];
  config: TrainingConfig;
}

export interface ModelInfo {
  id: string;
  name: string;
  createdAt: Date;
  accuracy: number;
  dataSize: number;
  config: TrainingConfig;
}

export class TrainingEngine {
  private algorithm: C45Algorithm;

  constructor(config: Partial<TrainingConfig> = {}) {
    const defaultConfig: TrainingConfig = {
      minSamples: 5,
      minGainRatio: 0.01,
      targetAttribute: 'status_stok',
      testSplitRatio: 0.8
    };

    const finalConfig = { ...defaultConfig, ...config };
    this.algorithm = new C45Algorithm(finalConfig.minSamples, finalConfig.minGainRatio);
  }

  /**
   * Split data into training and test sets
   */
  private splitData(data: TrainingData[], testRatio: number): {
    training: TrainingData[];
    test: TrainingData[];
  } {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const testSize = Math.floor(data.length * (1 - testRatio));
    
    return {
      training: shuffled.slice(0, data.length - testSize),
      test: shuffled.slice(data.length - testSize)
    };
  }

  /**
   * Train model with data
   */
  async train(
    data: TrainingData[], 
    config: Partial<TrainingConfig> = {}
  ): Promise<TrainingResult> {
    const finalConfig: TrainingConfig = {
      minSamples: 5,
      minGainRatio: 0.01,
      targetAttribute: 'status_stok',
      testSplitRatio: 0.8,
      ...config
    };

    // Validate data
    if (!data || data.length === 0) {
      throw new Error('Data training tidak boleh kosong');
    }

    // Split data
    const { training, test } = this.splitData(data, finalConfig.testSplitRatio);

    // Train model
    const tree = this.algorithm.buildTree(training, finalConfig.targetAttribute);

    // Evaluate model
    const metrics = this.algorithm.evaluate(tree, test, finalConfig.targetAttribute);

    return {
      tree,
      metrics,
      trainingData: training,
      testData: test,
      config: finalConfig
    };
  }

  /**
   * Cross validation training
   */
  async crossValidate(
    data: TrainingData[], 
    folds: number = 5,
    config: Partial<TrainingConfig> = {}
  ): Promise<ModelMetrics[]> {
    const finalConfig: TrainingConfig = {
      minSamples: 5,
      minGainRatio: 0.01,
      targetAttribute: 'status_stok',
      testSplitRatio: 0.8,
      ...config
    };

    const foldSize = Math.floor(data.length / folds);
    const results: ModelMetrics[] = [];

    for (let i = 0; i < folds; i++) {
      const start = i * foldSize;
      const end = i === folds - 1 ? data.length : (i + 1) * foldSize;
      
      const testFold = data.slice(start, end);
      const trainFold = [...data.slice(0, start), ...data.slice(end)];

      const tree = this.algorithm.buildTree(trainFold, finalConfig.targetAttribute);
      const metrics = this.algorithm.evaluate(tree, testFold, finalConfig.targetAttribute);
      
      results.push(metrics);
    }

    return results;
  }

  /**
   * Save model to localStorage
   */
  saveModel(result: TrainingResult, modelId: string): void {
    const modelInfo: ModelInfo = {
      id: modelId,
      name: `Model ${new Date().toLocaleDateString()}`,
      createdAt: new Date(),
      accuracy: result.metrics.accuracy,
      dataSize: result.trainingData.length,
      config: result.config
    };

    const modelData = {
      info: modelInfo,
      tree: result.tree,
      metrics: result.metrics
    };

    localStorage.setItem(`model_${modelId}`, JSON.stringify(modelData));
    localStorage.setItem('lastModelId', modelId);
  }

  /**
   * Load model from localStorage
   */
  loadModel(modelId: string): { tree: TreeNode; info: ModelInfo; metrics: ModelMetrics } | null {
    try {
      const modelData = localStorage.getItem(`model_${modelId}`);
      if (!modelData) return null;

      const parsed = JSON.parse(modelData);
      return {
        tree: parsed.tree,
        info: parsed.info,
        metrics: parsed.metrics
      };
    } catch (error) {
      console.error('Error loading model:', error);
      return null;
    }
  }

  /**
   * Get all saved models
   */
  getAllModels(): ModelInfo[] {
    const models: ModelInfo[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('model_')) {
        try {
          const modelData = JSON.parse(localStorage.getItem(key) || '{}');
          if (modelData.info) {
            models.push(modelData.info);
          }
        } catch (error) {
          console.error(`Error parsing model ${key}:`, error);
        }
      }
    }

    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete model
   */
  deleteModel(modelId: string): boolean {
    try {
      localStorage.removeItem(`model_${modelId}`);
      return true;
    } catch (error) {
      console.error('Error deleting model:', error);
      return false;
    }
  }

  /**
   * Get model statistics
   */
  getModelStats(models: ModelInfo[]): {
    totalModels: number;
    averageAccuracy: number;
    bestModel: ModelInfo | null;
    totalTrainingData: number;
  } {
    if (models.length === 0) {
      return {
        totalModels: 0,
        averageAccuracy: 0,
        bestModel: null,
        totalTrainingData: 0
      };
    }

    const totalAccuracy = models.reduce((sum, model) => sum + model.accuracy, 0);
    const bestModel = models.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best
    );
    const totalTrainingData = models.reduce((sum, model) => sum + model.dataSize, 0);

    return {
      totalModels: models.length,
      averageAccuracy: totalAccuracy / models.length,
      bestModel,
      totalTrainingData
    };
  }
}