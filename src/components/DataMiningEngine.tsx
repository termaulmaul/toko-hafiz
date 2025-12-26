// Data Mining Engine Component
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  TrendingUp,
  Download,
  Eye,
  Loader2
} from "lucide-react";
import { TrainingEngine } from '../engine/TrainingEngine';
import { PredictionEngine } from '../engine/PredictionEngine';
import { parseCSV, csvToTrainingData, validateTrainingData } from '../utils/dataUtils';
import { TrainingData } from '../algorithms/C45';

interface DataMiningEngineProps {
  onTrainingComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export const DataMiningEngine: React.FC<DataMiningEngineProps> = ({
  onTrainingComplete,
  onError
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const trainingEngine = new TrainingEngine();
  const predictionEngine = new PredictionEngine();

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      const response = await fetch('/data/data_latih.csv');
      const csvText = await response.text();
      const csvData = parseCSV(csvText);
      const trainingData = csvToTrainingData(csvData);
      
      // Validate data
      const validation = validateTrainingData(trainingData);
      if (!validation.isValid) {
        throw new Error(`Data tidak valid: ${validation.errors.join(', ')}`);
      }

      setTrainingData(trainingData);
      setDataLoaded(true);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memuat data latih';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const startTraining = async () => {
    if (!dataLoaded || trainingData.length === 0) {
      setError('Data latih belum dimuat');
      return;
    }

    setIsTraining(true);
    setTrainingProgress(0);
    setError(null);

    let progressInterval: NodeJS.Timeout;

    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // Train model
      const result = await trainingEngine.train(trainingData, {
        minSamples: 5,
        minGainRatio: 0.01,
        targetAttribute: 'Label',
        testSplitRatio: 0.8
      });

      clearInterval(progressInterval);
      setTrainingProgress(100);

      // Save model
      const modelId = `model_${Date.now()}`;
      trainingEngine.saveModel(result, modelId);

      setTrainingResult(result);
      onTrainingComplete?.(result);

      setTimeout(() => {
        setIsTraining(false);
      }, 1000);

    } catch (err) {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsTraining(false);
      const errorMessage = err instanceof Error ? err.message : 'Gagal melatih model';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const processSteps = [
    { id: 1, name: "Memuat data latih", completed: dataLoaded },
    { id: 2, name: "Menghitung entropy dan information gain", completed: isTraining && trainingProgress > 20 },
    { id: 3, name: "Membangun pohon keputusan C4.5", completed: isTraining && trainingProgress > 60 },
    { id: 4, name: "Validasi model dengan test data", completed: isTraining && trainingProgress > 80 },
    { id: 5, name: "Menyimpan model", completed: trainingResult !== null },
  ];

  return (
    <div className="space-y-6">
      {/* Data Status */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-info/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Brain className="text-primary" size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Status Data Mining</h3>
            <p className="text-muted-foreground mb-2">
              <span className="font-bold text-primary">{trainingData.length} data</span> latih tersedia untuk diproses
            </p>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Data tervalidasi
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                Siap diproses
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Training Progress */}
      {isTraining && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="text-primary animate-spin" size={24} />
            <h3 className="text-lg font-semibold">Melatih Model C4.5</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(trainingProgress)}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Tahapan Proses:
              </h4>
              {processSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    step.completed 
                      ? 'bg-success text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step.completed ? <CheckCircle2 size={12} /> : step.id}
                  </div>
                  <span className={`text-sm ${step.completed ? 'text-success font-medium' : ''}`}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Training Result */}
      {trainingResult && (
        <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle2 className="text-success" size={24} />
            </div>
            <h3 className="text-lg font-semibold">Model Berhasil Dilatih</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-success">
                {(trainingResult.metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Akurasi</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-info">
                {(trainingResult.metrics.precision * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Precision</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-warning">
                {(trainingResult.metrics.recall * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Recall</div>
            </div>
            <div className="text-center p-3 bg-white/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {trainingResult.trainingData.length}
              </div>
              <div className="text-xs text-muted-foreground">Data Training</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Eye size={16} className="mr-2" />
              Lihat Pohon Keputusan
            </Button>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" />
              Download Model
            </Button>
          </div>
        </Card>
      )}

      {/* Training Controls */}
      {!isTraining && !trainingResult && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="text-primary" size={24} />
            </div>
            <h3 className="text-lg font-semibold">Mulai Proses Mining</h3>
          </div>

          <p className="text-muted-foreground mb-6">
            Klik tombol di bawah untuk memulai proses data mining menggunakan algoritma C4.5. 
            Proses ini akan membangun model prediksi untuk status stok barang.
          </p>

          <Button
            onClick={startTraining}
            disabled={!dataLoaded}
            className="w-full btn-gradient-primary h-12 text-base"
          >
            <Play size={20} className="mr-2" />
            Mulai Proses Mining
          </Button>

          {!dataLoaded && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Sedang memuat data latih...
            </p>
          )}
        </Card>
      )}
    </div>
  );
};