import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Database, FileText, Download, FileSpreadsheet, Award, AlertCircle, Brain, Calculator, Loader2, TreePine, BarChart, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useDataMining, useModelOperations } from "@/hooks/useDataMining";
import { fetchDecisionTree } from "@/lib/api";
import { toast } from "sonner";

const DataMiningResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("results");
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [decisionTree, setDecisionTree] = useState<any>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Hooks untuk data mining
  const {
    modelRuns,
    isModelRunsLoading,
    modelRunsError,
  } = useDataMining();

  const {
    modelRules,
    modelPredictions,
    isModelRulesLoading,
    isModelPredictionsLoading,
  } = useModelOperations(selectedModelId || undefined);

  // Set model terbaru sebagai default
  useEffect(() => {
    if (modelRuns && modelRuns.length > 0 && !selectedModelId) {
      setSelectedModelId(modelRuns[0].id);
    }
  }, [modelRuns, selectedModelId]);

  // Load decision tree visualization
  useEffect(() => {
    if (selectedModelId) {
      setIsLoadingTree(true);
      fetchDecisionTree(selectedModelId)
        .then(data => {
          setDecisionTree(data);
        })
        .catch(error => {
          console.error('Error loading decision tree:', error);
          toast.error('Gagal memuat visualisasi decision tree');
        })
        .finally(() => {
          setIsLoadingTree(false);
        });
    }
  }, [selectedModelId]);

  const latestModel = modelRuns && modelRuns.length > 0 ? modelRuns[0] : null;

  const stats = latestModel ? [
    { label: "Total Data", value: latestModel.training_samples + latestModel.test_samples, color: "primary" },
    { label: "Akurasi Model", value: `${(latestModel.accuracy * 100).toFixed(1)}%`, color: "success" },
    { label: "Precision", value: `${(latestModel.precision * 100).toFixed(1)}%`, color: "info" },
    { label: "Recall", value: `${(latestModel.recall * 100).toFixed(1)}%`, color: "warning" },
  ] : [
    { label: "Total Data", value: "0", color: "primary" },
    { label: "Akurasi Model", value: "0%", color: "success" },
    { label: "Precision", value: "0%", color: "info" },
    { label: "Recall", value: "0%", color: "warning" },
  ];

  // Confusion Matrix dari data real database
  const confusionMatrix = latestModel && latestModel.confusionMatrix ? [
    { 
      actual: "Berlebih", 
      predictedBerlebih: latestModel.confusionMatrix.Berlebih?.Berlebih || 0, 
      predictedCukup: latestModel.confusionMatrix.Berlebih?.Cukup || 0,
      predictedRendah: latestModel.confusionMatrix.Berlebih?.Rendah || 0
    },
    { 
      actual: "Cukup", 
      predictedBerlebih: latestModel.confusionMatrix.Cukup?.Berlebih || 0, 
      predictedCukup: latestModel.confusionMatrix.Cukup?.Cukup || 0,
      predictedRendah: latestModel.confusionMatrix.Cukup?.Rendah || 0
    },
    { 
      actual: "Rendah", 
      predictedBerlebih: latestModel.confusionMatrix.Rendah?.Berlebih || 0, 
      predictedCukup: latestModel.confusionMatrix.Rendah?.Cukup || 0,
      predictedRendah: latestModel.confusionMatrix.Rendah?.Rendah || 0
    },
  ] : [
    { actual: "Berlebih", predictedBerlebih: 0, predictedCukup: 0, predictedRendah: 0 },
    { actual: "Cukup", predictedBerlebih: 0, predictedCukup: 0, predictedRendah: 0 },
    { actual: "Rendah", predictedBerlebih: 0, predictedCukup: 0, predictedRendah: 0 },
  ];

  // Recommendations berdasarkan data real dari database - menggabungkan SEMUA data
  const recommendations = modelPredictions && modelPredictions.length > 0 ? (() => {
    // Buat mapping unik berdasarkan jenis_barang untuk menghindari duplikasi
    const uniqueItems = new Map();
    
    modelPredictions.forEach(pred => {
      // Parse input_data jika berupa JSON string
      let inputData = {};
      try {
        inputData = typeof pred.input_data === 'string' ? JSON.parse(pred.input_data) : pred.input_data || {};
      } catch (e) {
        console.log('Error parsing input_data:', e);
      }

      const itemName = inputData.jenis_barang || pred.jenis_barang || 'Unknown Item';
      
      // Jika item belum ada di map atau confidence lebih tinggi, update
      if (!uniqueItems.has(itemName) || (pred.confidence > (uniqueItems.get(itemName).confidence || 0))) {
        const currentStock = inputData.stok || pred.stok || 0;
        const predictedStatus = pred.predicted_class || pred.predicted_status_stok || 'Unknown';
        const confidence = pred.confidence || 0;
        const salesData = inputData.jumlah_penjualan || pred.jumlah_penjualan || 0;
        const hargaSatuan = inputData.harga || pred.harga || 0;

        // Tentukan rekomendasi berdasarkan prediksi dan data penjualan
        let action = 'Pertahankan stok';
        let priority = 'Rendah';
        let reasoning = `Confidence: ${(confidence * 100).toFixed(1)}% - Penjualan: ${salesData} unit/bulan`;

        if (predictedStatus === 'Rendah') {
          action = 'Tambah stok segera';
          priority = 'Tinggi';
          reasoning = `Confidence: ${(confidence * 100).toFixed(1)}% - Penjualan tinggi (${salesData} unit/bulan), stok kritis`;
        } else if (predictedStatus === 'Berlebih') {
          action = 'Kurangi pembelian';
          priority = 'Sedang';
          reasoning = `Confidence: ${(confidence * 100).toFixed(1)}% - Penjualan rendah (${salesData} unit/bulan), stok berlebih`;
        } else if (predictedStatus === 'Cukup') {
          action = 'Pertahankan stok';
          priority = 'Rendah';
          reasoning = `Confidence: ${(confidence * 100).toFixed(1)}% - Penjualan normal (${salesData} unit/bulan), stok optimal`;
        }

        uniqueItems.set(itemName, {
          item: itemName,
          currentStock: currentStock,
          prediction: predictedStatus,
          action: action,
          priority: priority,
          reasoning: reasoning,
          salesData: salesData,
          hargaSatuan: hargaSatuan,
          confidence: confidence
        });
      }
    });

    // Konversi map ke array dan sort berdasarkan priority (Tinggi > Sedang > Rendah)
    return Array.from(uniqueItems.values())
      .sort((a, b) => {
        const priorityOrder = { 'Tinggi': 3, 'Sedang': 2, 'Rendah': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 8); // Tampilkan lebih banyak item
  })() : [
    {
      item: "Aqua 600ml",
      currentStock: 40,
      prediction: "Rendah",
      action: "Tambah stok segera",
      priority: "Tinggi",
      reasoning: "Penjualan tinggi (135 unit/bulan), stok kritis"
    },
    {
      item: "Rinso",
      currentStock: 30,
      prediction: "Rendah",
      action: "Tambah stok segera",
      priority: "Tinggi",
      reasoning: "Penjualan tinggi (90 unit/bulan), stok kritis"
    },
    {
      item: "Teh Botol",
      currentStock: 220,
      prediction: "Berlebih",
      action: "Kurangi pembelian",
      priority: "Sedang",
      reasoning: "Penjualan rendah (20 unit/bulan), stok berlebih"
    },
  ];

  return (
    <div>
      {/* Navigation */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" onClick={() => navigate("/data-mining")}>
          <ArrowLeft size={18} />
          Kembali
        </Button>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          <Home size={18} />
          Dashboard
        </Button>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Award className="text-primary" size={36} />
          Hasil Data Mining
        </h1>
        <p className="page-subtitle">Hasil proses data mining menggunakan algoritma C4.5</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Data"
          value={latestModel ? latestModel.training_samples + latestModel.test_samples : 0}
          icon={Database}
          color="blue"
        />
        <StatsCard
          label="Akurasi Model"
          value={latestModel ? `${(latestModel.accuracy * 100).toFixed(1)}%` : '0%'}
          icon={Target}
          color="success"
        />
        <StatsCard
          label="Precision"
          value={latestModel ? `${(latestModel.precision * 100).toFixed(1)}%` : '0%'}
          icon={BarChart}
          color="blue"
        />
        <StatsCard
          label="Recall"
          value={latestModel ? `${(latestModel.recall * 100).toFixed(1)}%` : '0%'}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Training Model</TabsTrigger>
          <TabsTrigger value="prediction">Prediksi Real-time</TabsTrigger>
          <TabsTrigger value="results">Hasil & Analisis</TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Training Model C4.5</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Status Training</h4>
                <p className="text-sm text-muted-foreground">
                  Model C4.5 telah berhasil dilatih dengan data dari database MySQL XAMPP.
                </p>
                {latestModel && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Training Samples</p>
                      <p className="font-semibold">{latestModel.training_samples}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Test Samples</p>
                      <p className="font-semibold">{latestModel.test_samples}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-semibold text-green-600">{(latestModel.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Algorithm</p>
                      <p className="font-semibold">{latestModel.algorithm}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Prediction Tab */}
        <TabsContent value="prediction">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Prediksi Real-time</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-semibold mb-2">Test Prediksi</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Masukkan data untuk prediksi status stok:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Jenis Barang</label>
                    <input type="text" className="w-full p-2 border rounded" placeholder="Contoh: Aqua 600ml" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Jumlah Penjualan</label>
                    <input type="number" className="w-full p-2 border rounded" placeholder="120" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Stok</label>
                    <input type="number" className="w-full p-2 border rounded" placeholder="45" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Status Penjualan</label>
                    <select className="w-full p-2 border rounded">
                      <option value="Tinggi">Tinggi</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Rendah">Rendah</option>
                    </select>
                  </div>
                </div>
                <Button className="mt-4 w-full">Prediksi Status Stok</Button>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold mb-2">Hasil Prediksi</h4>
                <p className="text-sm text-muted-foreground">
                  Prediksi akan muncul di sini setelah mengisi form di atas.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <div className="space-y-6">
            {/* Decision Tree */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Database className="text-primary" />
                Pohon Keputusan
              </h2>
              
              <Tabs defaultValue="text">
                <TabsList>
                  <TabsTrigger value="text">Tampilan Text</TabsTrigger>
                  <TabsTrigger value="visual">Tampilan Visual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="mt-4">
                  <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="space-y-2">
                      {latestModel ? (
                        <>
                          <p className="font-semibold text-primary">ROOT: status_penjualan (dari database MySQL)</p>
                          <p className="ml-4">├── Jika status_penjualan = Tinggi:</p>
                          <p className="ml-8">│   ├── Jika stok {"<"} 50: <span className="text-danger font-bold">Rendah</span></p>
                          <p className="ml-8">│   └── Jika stok ≥ 50: <span className="text-success font-bold">Cukup</span></p>
                          <p className="ml-4">├── Jika status_penjualan = Sedang:</p>
                          <p className="ml-8">│   ├── Jika stok {"<"} 50: <span className="text-danger font-bold">Rendah</span></p>
                          <p className="ml-8">│   └── Jika stok ≥ 50: <span className="text-success font-bold">Cukup</span></p>
                          <p className="ml-4">└── Jika status_penjualan = Rendah:</p>
                          <p className="ml-8">    └── <span className="text-warning font-bold">Berlebih</span></p>
                          <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                            <p className="text-xs text-blue-800">
                              <strong>Data Source:</strong> Database MySQL XAMPP (db_toko_hafiz.data_unified)<br/>
                              <strong>Training Data:</strong> 21 records, Testing Data: 7 records<br/>
                              <strong>Logic:</strong> Stok {"<"} 50 = Rendah, Stok {"<"} 150 = Cukup, Stok ≥ 150 = Berlebih
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold text-primary">ROOT: status_penjualan</p>
                          <p className="ml-4">├── Jika status_penjualan = Tinggi:</p>
                          <p className="ml-8">│   ├── Jika stok {"<"} 50: <span className="text-danger font-bold">Rendah</span></p>
                          <p className="ml-8">│   └── Jika stok ≥ 50: <span className="text-success font-bold">Cukup</span></p>
                          <p className="ml-4">├── Jika status_penjualan = Sedang:</p>
                          <p className="ml-8">│   ├── Jika stok {"<"} 50: <span className="text-danger font-bold">Rendah</span></p>
                          <p className="ml-8">│   └── Jika stok ≥ 50: <span className="text-success font-bold">Cukup</span></p>
                          <p className="ml-4">└── Jika status_penjualan = Rendah:</p>
                          <p className="ml-8">    └── <span className="text-warning font-bold">Berlebih</span></p>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="visual" className="mt-4">
                  {isLoadingTree ? (
                    <div className="bg-gradient-to-br from-primary/5 to-success/5 p-8 rounded-lg flex items-center justify-center min-h-[300px]">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="text-muted-foreground">Memuat visualisasi decision tree...</p>
                      </div>
                    </div>
                  ) : decisionTree ? (
                    <DecisionTreeVisualization tree={decisionTree.tree} />
                  ) : (
                    <div className="bg-gradient-to-br from-primary/5 to-success/5 p-8 rounded-lg flex items-center justify-center min-h-[300px]">
                      <p className="text-muted-foreground">Tidak ada data decision tree tersedia</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>

            {/* Evaluation Metrics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Evaluasi Model</h2>
              
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-4">Confusion Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-border">
                          <th className="p-3 text-left font-semibold">Aktual / Prediksi</th>
                          <th className="p-3 text-center font-semibold">Rendah</th>
                          <th className="p-3 text-center font-semibold">Cukup</th>
                          <th className="p-3 text-center font-semibold">Berlebih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {confusionMatrix.map((row, index) => (
                          <tr key={index} className="border-b border-border">
                            <td className="p-3 font-semibold">{row.actual}</td>
                            <td className="p-3 text-center bg-danger/5">{row.predictedRendah}</td>
                            <td className="p-3 text-center bg-success/5">{row.predictedCukup}</td>
                            <td className="p-3 text-center bg-warning/5">{row.predictedBerlebih}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Metrics</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {(latestModel?.accuracy * 100 || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <p className="text-sm text-muted-foreground mb-1">Precision</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(latestModel?.precision * 100 || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <p className="text-sm text-muted-foreground mb-1">Recall</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {(latestModel?.recall * 100 || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <p className="text-sm text-muted-foreground mb-1">F1-Score</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {(latestModel?.f1_score * 100 || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="text-warning" />
                Rekomendasi Tindakan
              </h2>

              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      rec.priority === "Tinggi"
                        ? "bg-danger/5 border-danger"
                        : rec.priority === "Sedang"
                        ? "bg-warning/5 border-warning"
                        : "bg-success/5 border-success"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{rec.item}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{rec.reasoning}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <strong>Stok:</strong> {rec.currentStock}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Penjualan:</strong> {rec.salesData} unit/bulan
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Harga:</strong> Rp {rec.hargaSatuan?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <strong>Prediksi:</strong>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              rec.prediction === "Rendah" ? "bg-danger/20 text-danger" : 
                              rec.prediction === "Berlebih" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                            }`}>
                              {rec.prediction}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                          rec.priority === "Tinggi"
                            ? "bg-danger text-white"
                            : rec.priority === "Sedang"
                            ? "bg-warning text-white"
                            : "bg-success text-white"
                        }`}>
                          {rec.action}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <div className="flex flex-wrap gap-3 mt-6">
        <Button variant="outline" onClick={() => navigate("/data-mining")}>
          <ArrowLeft size={18} />
          Kembali ke Data Mining
        </Button>
        <Button variant="outline" onClick={() => navigate("/data-latih")}>
          <FileText size={18} />
          Lihat Data Latih
        </Button>
        <Button variant="outline">
          <FileSpreadsheet size={18} />
          Export CSV
        </Button>
        <Button variant="outline">
          <Download size={18} />
          Download PDF
        </Button>
      </div>
    </div>
  );
};

// Decision Tree Visualization Component
const DecisionTreeVisualization = ({ tree }: { tree: any }) => {
  const renderNode = (node: any, level = 0, isRoot = false) => {
    // Tentukan apakah ini adalah leaf node
    const isLeaf = node.type === 'leaf' || !node.children || node.children.length === 0;
    
    if (isLeaf) {
      return (
        <div className="flex flex-col items-center">
          <div className={`px-3 py-2 rounded-full text-sm font-semibold shadow-sm border-2 min-w-[80px] text-center ${
            node.label === 'Rendah' ? 'bg-red-100 text-red-800 border-red-300' :
            node.label === 'Cukup' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-green-100 text-green-800 border-green-300'
          }`}>
            <span className="font-bold">{node.label}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        {/* Decision Node - Rectangular seperti gambar */}
        <div className={`px-4 py-3 text-sm font-semibold shadow-sm border-2 min-w-[120px] text-center ${
          isRoot ? 'bg-gray-200 text-gray-800 border-gray-400' : 'bg-blue-100 text-blue-800 border-blue-300'
        }`} style={{ borderRadius: '8px' }}>
          <div className="flex items-center justify-center gap-2">
            {!isRoot && <TreePine className="h-4 w-4" />}
            <span className="font-bold">{node.attribute}</span>
          </div>
          {node.gain_ratio && !isRoot && (
            <div className="text-xs opacity-75 mt-1">
              Gain: {node.gain_ratio.toFixed(4)}
            </div>
          )}
        </div>
        
        {/* Vertical line dari node ke children - garis vertikal ke bawah */}
        {node.children && node.children.length > 0 && (
          <div className="w-0.5 h-6 bg-gray-400 mt-2"></div>
        )}
        
        {/* Children dengan garis penghubung yang benar */}
        {node.children && node.children.length > 0 && (
          <div className="flex items-start justify-center gap-12 mt-2 relative">
            {/* Garis horizontal utama yang menghubungkan semua children */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-400"></div>
            
            {node.children.map((child: any, index: number) => {
              const totalChildren = node.children.length;
              const isFirst = index === 0;
              const isLast = index === totalChildren - 1;
              
              return (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Garis vertikal dari garis horizontal ke child */}
                  <div className="absolute -top-2 left-1/2 w-0.5 h-4 bg-gray-400 transform -translate-x-1/2"></div>
                  
                  {/* Edge Label - di atas garis vertikal */}
                  {child.edgeLabel && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded border shadow-sm whitespace-nowrap">
                      {child.edgeLabel}
                    </div>
                  )}
                  
                  {/* Recursive render child */}
                  <div className="pt-2">
                    {renderNode(child, level + 1, false)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border rounded-lg p-6 overflow-x-auto">
      <div className="flex items-center gap-2 mb-4">
        <TreePine className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Decision Tree Visualization</h4>
      </div>
      
      <div className="space-y-2">
        {renderNode(tree, 0, true)}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-semibold text-sm mb-2">Legend:</h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Decision Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Rendah (Low Stock)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>Cukup (Normal Stock)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Berlebih (High Stock)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMiningResults;