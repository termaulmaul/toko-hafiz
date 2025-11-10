// Prediction Engine Component
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Loader2
} from "lucide-react";
import { PredictionEngine as PredictionEngineClass } from '../engine/PredictionEngine';
import { PredictionRequest, PredictionResponse } from '../engine/PredictionEngine';

interface PredictionEngineProps {
  onPredictionComplete?: (result: PredictionResponse) => void;
  onError?: (error: string) => void;
}

export const PredictionEngine: React.FC<PredictionEngineProps> = ({
  onPredictionComplete,
  onError
}) => {
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    stokSekarang: '',
    penjualanRata2: '',
    leadTime: ''
  });

  const predictionEngine = new PredictionEngineClass();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateInput = (): string | null => {
    const stok = parseFloat(formData.stokSekarang);
    const penjualan = parseFloat(formData.penjualanRata2);
    const leadTime = parseFloat(formData.leadTime);

    if (isNaN(stok) || stok < 0) {
      return 'Stok sekarang harus berupa angka positif';
    }
    if (isNaN(penjualan) || penjualan < 0) {
      return 'Penjualan rata-rata harus berupa angka positif';
    }
    if (isNaN(leadTime) || leadTime < 1) {
      return 'Lead time harus berupa angka minimal 1';
    }

    return null;
  };

  const makePrediction = async () => {
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPredicting(true);
    setError(null);

    try {
      const request: PredictionRequest = {
        stokSekarang: parseFloat(formData.stokSekarang),
        penjualanRata2: parseFloat(formData.penjualanRata2),
        leadTime: parseFloat(formData.leadTime)
      };

      const result = await predictionEngine.predict(request);
      
      // Save to history
      predictionEngine.savePredictionToHistory(result, request);
      
      setPredictionResult(result);
      onPredictionComplete?.(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat prediksi';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsPredicting(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return <CheckCircle2 className="text-success" size={20} />;
      case 'Medium':
        return <AlertTriangle className="text-warning" size={20} />;
      case 'High':
        return <AlertCircle className="text-danger" size={20} />;
      default:
        return <Info className="text-info" size={20} />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-success/10 text-success border-success/20';
      case 'Medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'High':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-info/10 text-info border-info/20';
    }
  };

  const getPredictionIcon = (prediction: string) => {
    if (prediction.toLowerCase().includes('restock') || prediction.toLowerCase().includes('perlu')) {
      return <TrendingDown className="text-danger" size={20} />;
    } else {
      return <TrendingUp className="text-success" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="text-primary" size={24} />
          </div>
          <h3 className="text-lg font-semibold">Prediksi Status Stok</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="stok">Stok Sekarang</Label>
            <Input
              id="stok"
              type="number"
              placeholder="Contoh: 50"
              value={formData.stokSekarang}
              onChange={(e) => handleInputChange('stokSekarang', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Jumlah stok saat ini (unit)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="penjualan">Penjualan Rata-rata</Label>
            <Input
              id="penjualan"
              type="number"
              placeholder="Contoh: 30"
              value={formData.penjualanRata2}
              onChange={(e) => handleInputChange('penjualanRata2', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Penjualan per bulan (unit)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadtime">Lead Time</Label>
            <Input
              id="leadtime"
              type="number"
              placeholder="Contoh: 5"
              value={formData.leadTime}
              onChange={(e) => handleInputChange('leadTime', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Waktu tunggu supplier (hari)</p>
          </div>
        </div>

        <Button
          onClick={makePrediction}
          disabled={isPredicting}
          className="w-full btn-gradient-primary h-12 text-base"
        >
          {isPredicting ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={20} />
              Menganalisis...
            </>
          ) : (
            <>
              <Brain size={20} className="mr-2" />
              Prediksi Status Stok
            </>
          )}
        </Button>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Prediction Result */}
      {predictionResult && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-info/10 rounded-lg">
              {getPredictionIcon(predictionResult.prediction)}
            </div>
            <h3 className="text-lg font-semibold">Hasil Prediksi</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Prediction Summary */}
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Brain className="text-primary" size={20} />
                  <span className="font-semibold">Prediksi</span>
                </div>
                <div className="flex items-center gap-2">
                  {getPredictionIcon(predictionResult.prediction)}
                  <span className="text-lg font-bold">{predictionResult.prediction}</span>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="text-info" size={20} />
                  <span className="font-semibold">Tingkat Keyakinan</span>
                </div>
                <div className="text-2xl font-bold text-info">
                  {(predictionResult.confidence * 100).toFixed(1)}%
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${getRiskColor(predictionResult.riskLevel)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getRiskIcon(predictionResult.riskLevel)}
                  <span className="font-semibold">Tingkat Risiko</span>
                </div>
                <div className="text-lg font-bold">{predictionResult.riskLevel}</div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-info/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="text-primary flex-shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold mb-2">Rekomendasi</h4>
                    <p className="text-sm text-muted-foreground">
                      {predictionResult.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {predictionResult.modelInfo && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Info Model</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Akurasi Model:</span>
                      <span className="font-medium">
                        {(predictionResult.modelInfo.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Training:</span>
                      <span className="font-medium">{predictionResult.modelInfo.dataSize} records</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Decision Path */}
          {predictionResult.path.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h4 className="font-semibold mb-3">Jalur Keputusan</h4>
                <div className="flex flex-wrap gap-2">
                  {predictionResult.path.map((step, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {step}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};