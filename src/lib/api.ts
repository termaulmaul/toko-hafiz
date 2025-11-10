import axios from 'axios';
import { DataUnified, ModelRun, ModelRule, Prediction } from './database';
import { C45Result } from './c45-algorithm';

// Konfigurasi API
const API_BASE_URL = 'http://localhost:3000/api'; // Backend API endpoint

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface DataQualityValidation {
  status: 'success' | 'warning' | 'error';
  message: string;
  total_count: number;
  balance_ratio?: number;
  unique_counts?: Record<string, number>;
  distribution?: Array<{ status_stok: string; count: number }>;
  missing_fields?: string[];
  outlier_fields?: string[];
}

export interface DataMiningProcess {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: C45Result;
  error?: string;
  created_at: string;
  updated_at: string;
}

// API Service Class
export class ApiService {
  // Database operations
  static async testDatabaseConnection(): Promise<boolean> {
    try {
      const response = await api.get('/database/test');
      return response.data.success;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  static async getAllData(): Promise<DataUnified[]> {
    try {
      const response = await api.get<ApiResponse<DataUnified[]>>('/data/unified');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  static async getTrainingData(): Promise<DataUnified[]> {
    try {
      const response = await api.get<ApiResponse<DataUnified[]>>('/data/training');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching training data:', error);
      throw error;
    }
  }

  static async getTestingData(): Promise<DataUnified[]> {
    try {
      const response = await api.get<ApiResponse<DataUnified[]>>('/data/testing');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching testing data:', error);
      throw error;
    }
  }

  static async validateDataQuality(): Promise<DataQualityValidation> {
    try {
      const response = await api.get<ApiResponse<DataQualityValidation>>('/data/validate');
      return response.data.data;
    } catch (error) {
      console.error('Error validating data quality:', error);
      throw error;
    }
  }

  // Model operations
  static async runDataMining(config?: {
    minSamples?: number;
    minGainRatio?: number;
    splitRatio?: number;
  }): Promise<DataMiningProcess> {
    try {
      const response = await api.post<ApiResponse<DataMiningProcess>>('/data-mining/run', config);
      return response.data.data;
    } catch (error) {
      console.error('Error running data mining:', error);
      throw error;
    }
  }

  static async getDataMiningStatus(processId: string): Promise<DataMiningProcess> {
    try {
      const response = await api.get<ApiResponse<DataMiningProcess>>(`/data-mining/status/${processId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting data mining status:', error);
      throw error;
    }
  }

  static async getAllModelRuns(): Promise<ModelRun[]> {
    try {
      const response = await api.get<ApiResponse<ModelRun[]>>('/model-runs');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching model runs:', error);
      throw error;
    }
  }

  static async getModelRules(modelRunId: number): Promise<ModelRule[]> {
    try {
      const response = await api.get<ApiResponse<ModelRule[]>>(`/model-runs/${modelRunId}/rules`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching model rules:', error);
      throw error;
    }
  }

  static async getPredictions(modelRunId: number): Promise<Prediction[]> {
    try {
      const response = await api.get<ApiResponse<Prediction[]>>(`/model-runs/${modelRunId}/predictions`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching predictions:', error);
      throw error;
    }
  }

  // Prediction operations
  static async makePrediction(data: Partial<DataUnified>, modelRunId: number): Promise<{
    prediction: string;
    confidence: number;
  }> {
    try {
      const response = await api.post<ApiResponse<{
        prediction: string;
        confidence: number;
      }>>(`/predict/${modelRunId}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }

  // File operations
  static async uploadData(file: File): Promise<{
    success: boolean;
    message: string;
    imported_count: number;
    errors: string[];
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<{
        success: boolean;
        message: string;
        imported_count: number;
        errors: string[];
      }>>('/data/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading data:', error);
      throw error;
    }
  }

  static async exportData(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    try {
      const response = await api.get(`/data/export?format=${format}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Statistics operations
  static async getDataStatistics(): Promise<{
    total_records: number;
    training_records: number;
    testing_records: number;
    unsplit_records: number;
    model_runs: number;
    last_model_run?: string;
    data_quality_status: string;
  }> {
    try {
      const response = await api.get<ApiResponse<{
        total_records: number;
        training_records: number;
        testing_records: number;
        unsplit_records: number;
        model_runs: number;
        last_model_run?: string;
        data_quality_status: string;
      }>>('/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  // Utility functions
  static async downloadFile(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static formatError(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Terjadi kesalahan yang tidak diketahui';
  }
}

// Export API functions
export const fetchDataQuality = async () => {
  const response = await api.get('/data-quality');
  return response.data.data;
};

export const fetchStatistics = async () => {
  const response = await api.get('/statistics');
  return response.data.data;
};

export const runDataMiningProcess = async (options: { minSamples: number; minGainRatio: number; splitRatio: number }) => {
  const response = await api.post('/data-mining/run', options);
  return response.data.data;
};

export const fetchModelRuns = async () => {
  const response = await api.get('/model-runs');
  return response.data.data;
};

export const fetchModelRules = async (modelRunId: number) => {
  const response = await api.get(`/model-runs/${modelRunId}/rules`);
  return response.data.data;
};

export const fetchModelPredictions = async (modelRunId: number) => {
  const response = await api.get(`/model-runs/${modelRunId}/predictions`);
  return response.data.data;
};

export const checkDbConnection = async () => {
  const response = await api.get('/check-db');
  return response.data.data;
};

// Get decision tree visualization
export const fetchDecisionTree = async (modelId: number) => {
  const response = await api.get(`/model-runs/${modelId}/tree`);
  return response.data.data;
};

export default api;
