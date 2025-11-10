import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiService, DataQualityValidation, DataMiningProcess, fetchDataQuality } from '../lib/api';
import { DataUnified, ModelRun } from '../lib/database';

// Hook untuk data mining operations
export const useDataMining = () => {
  const queryClient = useQueryClient();

  // State untuk proses data mining
  const [currentProcess, setCurrentProcess] = useState<DataMiningProcess | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Query untuk validasi kualitas data
  const dataQualityQuery = useQuery({
    queryKey: ['data-quality'],
    queryFn: fetchDataQuality,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query untuk model runs
  const modelRunsQuery = useQuery({
    queryKey: ['model-runs'],
    queryFn: ApiService.getAllModelRuns,
    refetchOnWindowFocus: false,
  });

  // Mutation untuk menjalankan data mining
  const runDataMiningMutation = useMutation({
    mutationFn: ApiService.runDataMining,
    onSuccess: (data) => {
      setCurrentProcess(data);
      setIsProcessing(true);
      queryClient.invalidateQueries({ queryKey: ['model-runs'] });
    },
    onError: (error) => {
      console.error('Error running data mining:', error);
      setIsProcessing(false);
    },
  });

  // Mutation untuk membuat prediksi
  const makePredictionMutation = useMutation({
    mutationFn: ({ data, modelRunId }: { data: Partial<DataUnified>; modelRunId: number }) =>
      ApiService.makePrediction(data, modelRunId),
  });

  // Function untuk menjalankan data mining
  const runDataMining = useCallback((config?: {
    minSamples?: number;
    minGainRatio?: number;
    splitRatio?: number;
  }) => {
    setIsProcessing(true);
    runDataMiningMutation.mutate(config);
  }, [runDataMiningMutation]);

  // Function untuk membuat prediksi
  const makePrediction = useCallback((data: Partial<DataUnified>, modelRunId: number) => {
    return makePredictionMutation.mutateAsync({ data, modelRunId });
  }, [makePredictionMutation]);

  // Polling untuk status data mining jika sedang processing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isProcessing && currentProcess?.id) {
      interval = setInterval(async () => {
        try {
          const status = await ApiService.getDataMiningStatus(currentProcess.id);
          setCurrentProcess(status);

          if (status.status === 'completed' || status.status === 'failed') {
            setIsProcessing(false);
            queryClient.invalidateQueries({ queryKey: ['model-runs'] });
            queryClient.invalidateQueries({ queryKey: ['data-quality'] });
          }
        } catch (error) {
          console.error('Error polling data mining status:', error);
          setIsProcessing(false);
        }
      }, 2000); // Poll setiap 2 detik
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isProcessing, currentProcess?.id, queryClient]);

  return {
    // Data
    dataQuality: dataQualityQuery.data,
    modelRuns: modelRunsQuery.data || [],
    currentProcess,
    
    // Loading states
    isDataQualityLoading: dataQualityQuery.isLoading,
    isModelRunsLoading: modelRunsQuery.isLoading,
    isProcessing,
    
    // Error states
    dataQualityError: dataQualityQuery.error,
    modelRunsError: modelRunsQuery.error,
    
    // Actions
    runDataMining,
    makePrediction,
    refetchDataQuality: dataQualityQuery.refetch,
    refetchModelRuns: modelRunsQuery.refetch,
    
    // Mutation states
    isRunDataMiningLoading: runDataMiningMutation.isPending,
    isMakePredictionLoading: makePredictionMutation.isPending,
    runDataMiningError: runDataMiningMutation.error,
    makePredictionError: makePredictionMutation.error,
  };
};

// Hook untuk data operations
export const useDataOperations = () => {
  const queryClient = useQueryClient();

  // Query untuk semua data
  const allDataQuery = useQuery({
    queryKey: ['data-unified'],
    queryFn: ApiService.getAllData,
    refetchOnWindowFocus: false,
  });

  // Query untuk data latih
  const trainingDataQuery = useQuery({
    queryKey: ['data-training'],
    queryFn: ApiService.getTrainingData,
    refetchOnWindowFocus: false,
  });

  // Query untuk data uji
  const testingDataQuery = useQuery({
    queryKey: ['data-testing'],
    queryFn: ApiService.getTestingData,
    refetchOnWindowFocus: false,
  });

  // Query untuk statistik
  const statisticsQuery = useQuery({
    queryKey: ['statistics'],
    queryFn: ApiService.getDataStatistics,
    refetchOnWindowFocus: false,
  });

  // Mutation untuk upload data
  const uploadDataMutation = useMutation({
    mutationFn: ApiService.uploadData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-unified'] });
      queryClient.invalidateQueries({ queryKey: ['data-training'] });
      queryClient.invalidateQueries({ queryKey: ['data-testing'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['data-quality'] });
    },
  });

  // Function untuk upload file
  const uploadData = useCallback((file: File) => {
    return uploadDataMutation.mutateAsync(file);
  }, [uploadDataMutation]);

  // Function untuk export data
  const exportData = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      const blob = await ApiService.exportData(format);
      const filename = `data_export.${format}`;
      await ApiService.downloadFile(blob, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }, []);

  return {
    // Data
    allData: allDataQuery.data || [],
    trainingData: trainingDataQuery.data || [],
    testingData: testingDataQuery.data || [],
    statistics: statisticsQuery.data,
    
    // Loading states
    isAllDataLoading: allDataQuery.isLoading,
    isTrainingDataLoading: trainingDataQuery.isLoading,
    isTestingDataLoading: testingDataQuery.isLoading,
    isStatisticsLoading: statisticsQuery.isLoading,
    
    // Error states
    allDataError: allDataQuery.error,
    trainingDataError: trainingDataQuery.error,
    testingDataError: testingDataQuery.error,
    statisticsError: statisticsQuery.error,
    
    // Actions
    uploadData,
    exportData,
    refetchAll: () => {
      queryClient.invalidateQueries({ queryKey: ['data-unified'] });
      queryClient.invalidateQueries({ queryKey: ['data-training'] });
      queryClient.invalidateQueries({ queryKey: ['data-testing'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
    
    // Mutation states
    isUploadLoading: uploadDataMutation.isPending,
    uploadError: uploadDataMutation.error,
  };
};

// Hook untuk model operations
export const useModelOperations = (modelRunId?: number) => {
  const queryClient = useQueryClient();

  // Query untuk rules model
  const modelRulesQuery = useQuery({
    queryKey: ['model-rules', modelRunId],
    queryFn: () => modelRunId ? ApiService.getModelRules(modelRunId) : Promise.resolve([]),
    enabled: !!modelRunId,
    refetchOnWindowFocus: false,
  });

  // Query untuk prediksi model
  const modelPredictionsQuery = useQuery({
    queryKey: ['model-predictions', modelRunId],
    queryFn: () => modelRunId ? ApiService.getPredictions(modelRunId) : Promise.resolve([]),
    enabled: !!modelRunId,
    refetchOnWindowFocus: false,
  });

  return {
    // Data
    modelRules: modelRulesQuery.data || [],
    modelPredictions: modelPredictionsQuery.data || [],
    
    // Loading states
    isModelRulesLoading: modelRulesQuery.isLoading,
    isModelPredictionsLoading: modelPredictionsQuery.isLoading,
    
    // Error states
    modelRulesError: modelRulesQuery.error,
    modelPredictionsError: modelPredictionsQuery.error,
    
    // Actions
    refetchModelData: () => {
      queryClient.invalidateQueries({ queryKey: ['model-rules', modelRunId] });
      queryClient.invalidateQueries({ queryKey: ['model-predictions', modelRunId] });
    },
  };
};

// Hook untuk database connection
export const useDatabaseConnection = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const connected = await ApiService.testDatabaseConnection();
      setIsConnected(connected);
    } catch (error) {
      console.error('Database connection check failed:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    checkConnection,
  };
};
