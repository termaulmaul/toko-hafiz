import { useNavigate } from "react-router-dom";
import { Brain, Play, Database, Upload, Eye, CheckCircle2, TrendingUp, BarChart3, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useDataMining, useDataOperations, useDatabaseConnection } from "@/hooks/useDataMining";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const DataMining = () => {
  const navigate = useNavigate();

  // State untuk loading kualitas data yang bertahap
  const [dataQualityProgress, setDataQualityProgress] = useState(0);
  const [isDataQualityProcessing, setIsDataQualityProcessing] = useState(false);

  // Hooks untuk data mining
  const {
    dataQuality,
    modelRuns,
    currentProcess,
    isProcessing,
    isDataQualityLoading,
    runDataMining,
    runDataMiningError,
    isRunDataMiningLoading,
  } = useDataMining();

  const {
    statistics,
    isStatisticsLoading,
  } = useDataOperations();

  const { isConnected, isChecking } = useDatabaseConnection();

  // Effect untuk loading kualitas data yang bertahap
  useEffect(() => {
    if (isDataQualityLoading) {
      setIsDataQualityProcessing(true);
      setDataQualityProgress(0);
      
      // Simulasi loading bertahap: 10% -> 25% -> 50% -> 75% -> 90% -> 100%
      const progressSteps = [10, 25, 50, 75, 90, 100];
      let currentStep = 0;
      
      const interval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setDataQualityProgress(progressSteps[currentStep]);
          currentStep++;
        } else {
          clearInterval(interval);
          setIsDataQualityProcessing(false);
        }
      }, 800); // Setiap 800ms naik ke step berikutnya
      
      return () => clearInterval(interval);
    } else {
      setIsDataQualityProcessing(false);
      setDataQualityProgress(100);
    }
  }, [isDataQualityLoading]);

  const processSteps = [
    "Memuat data latih dari database",
    "Menghitung entropy dan information gain",
    "Membangun pohon keputusan C4.5",
    "Validasi model dengan confusion matrix",
    "Menghasilkan rekomendasi stok",
  ];

  const algorithmFeatures = [
    "Menggunakan information gain untuk pemilihan atribut",
    "Dapat menangani atribut numerik dan kategorikal",
    "Menghasilkan rules yang mudah dipahami",
    "Akurasi tinggi untuk prediksi stok",
  ];

  const handleSplitData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/data/split', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ splitRatio: 0.7 }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.data.message);
        // Refresh data quality
        window.location.reload();
      } else {
        toast.error('Gagal melakukan split data');
      }
    } catch (error) {
      console.error('Error splitting data:', error);
      toast.error('Error saat melakukan split data');
    }
  };

  const handleCleanData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/data/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.data.message);
        // Refresh data quality
        window.location.reload();
      } else {
        toast.error('Gagal membersihkan data');
      }
    } catch (error) {
      console.error('Error cleaning data:', error);
      toast.error('Error saat membersihkan data');
    }
  };

  const handleRunDataMining = async () => {
    try {
      await runDataMining({
        minSamples: 5,
        minGainRatio: 0.01,
        splitRatio: 0.7,
      });
      toast.success("Data mining dimulai!");
    } catch (error) {
      toast.error("Gagal memulai data mining");
    }
  };

  // Effect untuk menangani completion data mining
  useEffect(() => {
    if (currentProcess && currentProcess.progress === 100 && currentProcess.message?.includes('completed')) {
      toast.success("Data mining selesai!");
      // Redirect ke halaman hasil setelah 2 detik
      setTimeout(() => {
        navigate('/data-mining/process');
      }, 2000);
    }
  }, [currentProcess, navigate]);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Brain className="text-primary" size={36} />
          Data Mining
        </h1>
        <p className="page-subtitle">Proses data mining menggunakan algoritma C4.5</p>
      </div>

      {/* Database Connection Status */}
      {!isConnected && !isChecking && (
        <Alert className="mb-6 border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Database tidak terhubung. Pastikan MySQL berjalan di localhost:3306 dengan database 'db_toko_hafiz'.
          </AlertDescription>
        </Alert>
      )}

      {/* Data Status */}
      <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-info/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Database className="text-primary" size={32} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Data Status</h3>
            {isStatisticsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-muted-foreground">Memuat status data...</span>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">
                  <span className="font-bold text-primary">{statistics?.total_records || 0} data</span> tersedia untuk diproses
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    {statistics?.training_records || 0} data latih
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    {statistics?.testing_records || 0} data uji
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    {statistics?.model_runs || 0} model runs
                  </span>
                </div>
                <div className="mt-3 p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Data Training:</strong> 21 records dari database MySQL XAMPP<br/>
                    <strong>Data Testing:</strong> 7 records untuk validasi model<br/>
                    <strong>Target Classes:</strong> Rendah (11), Cukup (13), Berlebih (4)<br/>
                    <strong>Database:</strong> localhost:3306/db_toko_hafiz
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Data Quality Status */}
      {(dataQuality || isDataQualityProcessing) && (
        <Card className="p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Kualitas Data</h3>
          
          {/* Loading State */}
          {isDataQualityProcessing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Loader2 className="animate-spin" size={20} />
                <span className="font-semibold">Memeriksa kualitas data...</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress Pemeriksaan</span>
                  <span>{dataQualityProgress}%</span>
                </div>
                <Progress value={dataQualityProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {dataQualityProgress < 25 && "Memuat data dari database..."}
                  {dataQualityProgress >= 25 && dataQualityProgress < 50 && "Menganalisis struktur data..."}
                  {dataQualityProgress >= 50 && dataQualityProgress < 75 && "Memeriksa kualitas data..."}
                  {dataQualityProgress >= 75 && dataQualityProgress < 90 && "Menghitung balance ratio..."}
                  {dataQualityProgress >= 90 && dataQualityProgress < 100 && "Menyelesaikan analisis..."}
                  {dataQualityProgress === 100 && "Analisis selesai!"}
                </p>
              </div>
            </div>
          )}
          
          {/* Success State */}
          {!isDataQualityProcessing && dataQuality && dataQuality?.status === 'success' && (
            <div className="flex items-center gap-2 text-success mb-2">
              <CheckCircle2 size={20} />
              <span className="font-semibold">Data siap untuk C4.5</span>
            </div>
          )}
          {/* Warning State */}
          {!isDataQualityProcessing && dataQuality && dataQuality?.status === 'warning' && (
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle size={20} />
              <span className="font-semibold">Perhatian: Ada warning</span>
            </div>
          )}
          {/* Error State */}
          {!isDataQualityProcessing && dataQuality && dataQuality?.status === 'error' && (
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={20} />
              <span className="font-semibold">Error: Data tidak siap</span>
            </div>
          )}
          {!isDataQualityProcessing && dataQuality && (
            <>
              <p className="text-sm text-muted-foreground">{dataQuality.message}</p>
              {dataQuality.balance_ratio && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Balance Ratio</span>
                    <span>{(dataQuality.balance_ratio * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={dataQuality.balance_ratio * 100} className="h-2" />
                </div>
              )}
            </>
          )}
          {!isDataQualityProcessing && dataQuality && dataQuality?.status === 'warning' && dataQuality?.message?.includes('belum di-split') && (
            <div className="mt-4">
              <Button 
                onClick={handleSplitData}
                className="w-full"
                variant="outline"
              >
                <Database className="mr-2 h-4 w-4" />
                Split Data (70% Latih, 30% Uji)
              </Button>
            </div>
          )}
          {!isDataQualityProcessing && dataQuality && dataQuality?.status === 'error' && dataQuality?.message?.includes('MISSING VALUES') && (
            <div className="mt-4">
              <Button 
                onClick={handleCleanData}
                className="w-full"
                variant="destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Clean Invalid Data
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && currentProcess && (
        <Card className="p-6 mb-8 border-primary">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="animate-spin text-primary" size={24} />
            <h3 className="font-semibold text-lg">Data Mining Sedang Berjalan</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentProcess.progress}%</span>
            </div>
            <Progress value={currentProcess.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{currentProcess.message}</p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Process Section */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="text-primary" size={24} />
            </div>
            <h2 className="text-xl font-semibold">Proses Mining</h2>
          </div>

          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Tahapan Proses:</h3>
            {processSteps.map((step, index) => {
              // Tentukan status tahapan berdasarkan progress
              let stepStatus = 'pending';
              if (isProcessing) {
                const progress = currentProcess?.progress || 0;
                const stepProgress = (index + 1) / processSteps.length * 100;
                if (progress >= stepProgress) {
                  stepStatus = 'completed';
                } else if (progress >= (index / processSteps.length * 100)) {
                  stepStatus = 'active';
                }
              }

              return (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                  stepStatus === 'completed' ? 'bg-green-50 border border-green-200' :
                  stepStatus === 'active' ? 'bg-blue-50 border border-blue-200' :
                  'bg-muted/50'
                }`}>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0 mt-0.5 transition-all duration-300 ${
                    stepStatus === 'completed' ? 'bg-green-500 text-white' :
                    stepStatus === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                    'bg-primary text-white'
                  }`}>
                    {stepStatus === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : stepStatus === 'active' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className={`text-sm transition-colors duration-300 ${
                    stepStatus === 'completed' ? 'text-green-700 font-medium' :
                    stepStatus === 'active' ? 'text-blue-700 font-medium' :
                    'text-muted-foreground'
                  }`}>
                    {step}
                    {stepStatus === 'active' && (
                      <span className="ml-2 text-xs text-blue-600 animate-pulse">
                        Sedang memproses...
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleRunDataMining}
            disabled={isRunDataMiningLoading || isProcessing || !isConnected || dataQuality?.status === 'error'}
            className="w-full btn-gradient-primary h-12 text-base"
          >
            {isRunDataMiningLoading || isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {isProcessing ? 'Sedang Memproses...' : 'Memulai...'}
              </>
            ) : (
              <>
                <Play size={20} />
                Mulai Proses Mining
              </>
            )}
          </Button>
        </Card>

        {/* Algorithm Info */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-info/10 rounded-lg">
              <BarChart3 className="text-info" size={24} />
            </div>
            <h2 className="text-xl font-semibold">Tentang Algoritma C4.5</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Algoritma C4.5 adalah metode klasifikasi dan prediksi yang sangat akurat. 
            Algoritma ini membangun pohon keputusan dari sekumpulan data training untuk 
            memprediksi status stok barang.
          </p>

          <div className="space-y-2 mb-6">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Karakteristik:</h3>
            {algorithmFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm">{feature}</p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="text-success flex-shrink-0" size={20} />
              <div>
                <h4 className="font-semibold text-sm mb-1">Target Prediksi</h4>
                <p className="text-xs text-muted-foreground">
                  Status stok: <span className="font-semibold">Rendah</span>, 
                  <span className="font-semibold"> Cukup</span>, atau 
                  <span className="font-semibold"> Berlebih</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 justify-start gap-4"
            onClick={() => navigate("/data-latih")}
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Upload className="text-primary" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Upload Data Latih</p>
              <p className="text-xs text-muted-foreground">Tambah atau update data training</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-16 justify-start gap-4"
            onClick={() => navigate("/data-mining/process")}
          >
            <div className="p-2 bg-success/10 rounded-lg">
              <Eye className="text-success" size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Lihat Hasil Mining</p>
              <p className="text-xs text-muted-foreground">Analisis hasil dan rekomendasi</p>
            </div>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DataMining;
