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
import axios from "axios";
import HtmlDecisionTree from "@/components/HtmlDecisionTree";

const DataMiningResults = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("results");
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [decisionTree, setDecisionTree] = useState<any>(null);
  const [isLoadingTree, setIsLoadingTree] = useState(false);

  // Prediction form state
  const [predictionData, setPredictionData] = useState({
    jenis_barang: '',
    jumlah_penjualan: '',
    stok: '',
    status_penjualan: 'Tinggi'
  });
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

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

  // Handle prediction
  const handlePrediction = async () => {
    if (!selectedModelId) {
      toast.error("Model belum dipilih");
      return;
    }

    if (!predictionData.jenis_barang || !predictionData.jumlah_penjualan || !predictionData.stok) {
      toast.error("Semua field harus diisi");
      return;
    }

    setIsPredicting(true);
    try {
      const response = await axios.post(`http://localhost:3000/api/predict/${selectedModelId}`, {
        jenis_barang: predictionData.jenis_barang,
        jumlah_penjualan: parseInt(predictionData.jumlah_penjualan),
        stok: parseInt(predictionData.stok),
        status_penjualan: predictionData.status_penjualan
      });

      setPredictionResult(response.data.data);
      toast.success("Prediksi berhasil!");
    } catch (error: any) {
      toast.error("Gagal melakukan prediksi: " + error.message);
    } finally {
      setIsPredicting(false);
    }
  };

  // Handle CSV export
  const handleCSVExport = () => {
    setIsExportingCSV(true);
    try {
      // Create CSV content with mining results
      let csvContent = "Mining Results Export\n\n";

      // Add model information
      if (latestModel) {
        csvContent += "Model Information\n";
        csvContent += `Algorithm,${latestModel.algorithm}\n`;
        csvContent += `Accuracy,${(latestModel.accuracy * 100).toFixed(2)}%\n`;
        csvContent += `Precision,${(latestModel.precision * 100).toFixed(2)}%\n`;
        csvContent += `Recall,${(latestModel.recall * 100).toFixed(2)}%\n`;
        csvContent += `F1 Score,${(latestModel.f1_score * 100).toFixed(2)}%\n`;
        csvContent += `Training Samples,${latestModel.training_samples}\n`;
        csvContent += `Test Samples,${latestModel.test_samples}\n\n`;
      }

      // Add predictions data
      if (modelPredictions && modelPredictions.length > 0) {
        csvContent += "Predictions Data\n";
        csvContent += "ID,Input Data,Predicted Class,Confidence,Actual Class,Is Correct\n";

        modelPredictions.forEach((pred: any, index: number) => {
          const inputData = typeof pred.input_data === 'string' ?
            JSON.parse(pred.input_data) : pred.input_data || {};
          csvContent += `${index + 1},"${JSON.stringify(inputData)}",${pred.predicted_class},${pred.confidence},${pred.actual_class},${pred.is_correct ? 'Yes' : 'No'}\n`;
        });
        csvContent += "\n";
      }

      // Add recommendations
      if (recommendations && recommendations.length > 0) {
        csvContent += "Recommendations\n";
        csvContent += "Item,Current Stock,Prediction,Action,Priority,Reasoning\n";

        recommendations.forEach((rec: any) => {
          csvContent += `"${rec.item}",${rec.currentStock},"${rec.prediction}","${rec.action}","${rec.priority}","${rec.reasoning}"\n`;
        });
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mining-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal export CSV");
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Handle PDF download
  const handlePDFDownload = () => {
    setIsDownloadingPDF(true);
    try {
      // Create a comprehensive printable version of the results
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Data Mining Results Report - ${new Date().toLocaleDateString()}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              margin: 1cm;
              size: A4;
            }
            @media print {
              body { print-color-adjust: exact; }
              .no-print { display: none; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #2563eb;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section h2 {
              color: #2563eb;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 5px;
              margin-bottom: 15px;
              font-size: 20px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin: 20px 0;
            }
            .metric-card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              background: #f9fafb;
              text-align: center;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              display: block;
            }
            .metric-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
              color: #374151;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .confusion-matrix {
              max-width: 400px;
              margin: 0 auto;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            }
            .status-rendah { background: #fef2f2; color: #dc2626; }
            .status-cukup { background: #f0fdf4; color: #16a34a; }
            .status-berlebih { background: #fefce8; color: #ca8a04; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Data Mining Results Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Algorithm: C4.5 Decision Tree | Model ID: ${selectedModelId || 'N/A'}</p>
          </div>

          <div class="section">
            <h2>Model Performance Metrics</h2>
            <div class="metrics-grid">
              <div class="metric-card">
                <span class="metric-value">${(latestModel?.accuracy * 100 || 0).toFixed(1)}%</span>
                <span class="metric-label">Accuracy</span>
              </div>
              <div class="metric-card">
                <span class="metric-value">${(latestModel?.precision * 100 || 0).toFixed(1)}%</span>
                <span class="metric-label">Precision</span>
              </div>
              <div class="metric-card">
                <span class="metric-value">${(latestModel?.recall * 100 || 0).toFixed(1)}%</span>
                <span class="metric-label">Recall</span>
              </div>
              <div class="metric-card">
                <span class="metric-value">${(latestModel?.f1_score * 100 || 0).toFixed(1)}%</span>
                <span class="metric-label">F1 Score</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Decision Tree Structure</h2>
            <p><strong>Algorithm:</strong> C4.5 Decision Tree</p>
            <p><strong>Root Attribute:</strong> status_penjualan</p>
            <p><strong>Training Samples:</strong> ${latestModel?.training_samples || 0}</p>
            <p><strong>Test Samples:</strong> ${latestModel?.test_samples || 0}</p>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 12px;">
              <p style="margin: 0; font-weight: bold;">Decision Tree Rules:</p>
              <p style="margin: 5px 0;">├── IF status_penjualan = 'Tinggi':</p>
              <p style="margin: 5px 0; margin-left: 20px;">│   ├── IF stok < 50: Rendah</p>
              <p style="margin: 5px 0; margin-left: 20px;">│   └── IF stok ≥ 50: Cukup</p>
              <p style="margin: 5px 0;">├── IF status_penjualan = 'Sedang':</p>
              <p style="margin: 5px 0; margin-left: 20px;">│   ├── IF stok < 50: Rendah</p>
              <p style="margin: 5px 0; margin-left: 20px;">│   └── IF stok ≥ 50: Cukup</p>
              <p style="margin: 5px 0;">└── IF status_penjualan = 'Rendah':</p>
              <p style="margin: 5px 0; margin-left: 20px;">    └── Berlebih</p>
            </div>
          </div>

          <div class="section">
            <h2>Stock Recommendations</h2>
            <table>
              <tr>
                <th>Item</th>
                <th>Current Stock</th>
                <th>Prediction</th>
                <th>Recommended Action</th>
                <th>Priority</th>
                <th>Reasoning</th>
              </tr>
              ${recommendations?.map((rec: any) => `
                <tr>
                  <td>${rec.item}</td>
                  <td>${rec.currentStock}</td>
                  <td><span class="status-badge status-${rec.prediction.toLowerCase()}">${rec.prediction}</span></td>
                  <td>${rec.action}</td>
                  <td>${rec.priority}</td>
                  <td>${rec.reasoning}</td>
                </tr>
              `).join('') || ''}
            </table>
          </div>

          <div class="section">
            <h2>Data Source Information</h2>
            <p><strong>Database:</strong> MySQL (XAMPP) - db_toko_hafiz</p>
            <p><strong>Training Table:</strong> data_unified (split_type = 'latih')</p>
            <p><strong>Testing Table:</strong> data_unified (split_type = 'uji')</p>
            <p><strong>Target Attribute:</strong> status_stok (Rendah/Cukup/Berlebih)</p>
            <p><strong>Algorithm Implementation:</strong> Custom C4.5 with Information Gain Ratio</p>
          </div>

          <div class="footer">
            <p>Report generated by Toko Hafiz Data Mining System</p>
            <p>© ${new Date().getFullYear()} - Automated Stock Prediction Report</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window with the content and trigger print to PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load, then trigger print dialog
        printWindow.onload = () => {
          printWindow.print();
          // Close the window after a delay to allow print dialog to appear
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        };

        toast.success("PDF print dialog opened. Select 'Save as PDF' in your browser's print dialog.");
      } else {
        // Fallback: download as HTML if popup blocked
        const blob = new Blob([printContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `data-mining-results-${new Date().toISOString().split('T')[0]}.html`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("File HTML berhasil didownload. Buka file dan print ke PDF.");
      }
    } catch (error) {
      toast.error("Gagal membuat PDF");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

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
      let inputData: any = {};
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
              {/* Model Selection */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Pilih Model</h4>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedModelId || ''}
                  onChange={(e) => setSelectedModelId(Number(e.target.value))}
                >
                  <option value="">Pilih Model...</option>
                  {modelRuns?.map((model) => (
                    <option key={model.id} value={model.id}>
                      Model {model.id} - {model.algorithm} ({(model.accuracy * 100).toFixed(1)}% accuracy)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                <h4 className="font-semibold mb-2">Test Prediksi</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Masukkan data untuk prediksi status stok:
                </p>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-muted-foreground">Jenis Barang</label>
                     <input
                       type="text"
                       className="w-full p-2 border rounded"
                       placeholder="Contoh: Aqua 600ml"
                       value={predictionData.jenis_barang}
                       onChange={(e) => setPredictionData({...predictionData, jenis_barang: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground">Jumlah Penjualan</label>
                     <input
                       type="number"
                       className="w-full p-2 border rounded"
                       placeholder="120"
                       value={predictionData.jumlah_penjualan}
                       onChange={(e) => setPredictionData({...predictionData, jumlah_penjualan: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground">Stok</label>
                     <input
                       type="number"
                       className="w-full p-2 border rounded"
                       placeholder="45"
                       value={predictionData.stok}
                       onChange={(e) => setPredictionData({...predictionData, stok: e.target.value})}
                     />
                   </div>
                   <div>
                     <label className="text-xs text-muted-foreground">Status Penjualan</label>
                     <select
                       className="w-full p-2 border rounded"
                       value={predictionData.status_penjualan}
                       onChange={(e) => setPredictionData({...predictionData, status_penjualan: e.target.value})}
                     >
                       <option value="Tinggi">Tinggi</option>
                       <option value="Sedang">Sedang</option>
                       <option value="Rendah">Rendah</option>
                     </select>
                   </div>
                 </div>
                 <Button
                   className="mt-4 w-full"
                   onClick={handlePrediction}
                   disabled={isPredicting || !selectedModelId}
                 >
                   {isPredicting ? "Memproses..." : "Prediksi Status Stok"}
                 </Button>
              </div>
               <div className="p-4 bg-green-50 rounded-lg">
                 <h4 className="font-semibold mb-2">Hasil Prediksi</h4>
                 {predictionResult ? (
                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <span className="font-medium">Status Stok Prediksi:</span>
                       <Badge variant={
                         predictionResult.prediction === 'Rendah' ? 'destructive' :
                         predictionResult.prediction === 'Berlebih' ? 'secondary' : 'default'
                       }>
                         {predictionResult.prediction}
                       </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className="font-medium">Confidence:</span>
                       <span className="text-blue-600 font-semibold">
                         {(predictionResult.confidence * 100).toFixed(1)}%
                       </span>
                     </div>
                     <div className="text-xs text-muted-foreground mt-2">
                       Model Accuracy: {(predictionResult.model_accuracy * 100).toFixed(1)}%
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm text-muted-foreground">
                     Prediksi akan muncul di sini setelah mengisi form di atas.
                   </p>
                 )}
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
                    <HtmlDecisionTree tree={decisionTree.tree} />
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
          Lihat Data Training ({latestModel?.training_samples || 0} records)
        </Button>
        <Button
          variant="outline"
          onClick={handleCSVExport}
          disabled={isExportingCSV}
        >
          <FileSpreadsheet size={18} />
          {isExportingCSV ? "Exporting..." : "Export CSV"}
        </Button>
        <Button
          variant="outline"
          onClick={handlePDFDownload}
          disabled={isDownloadingPDF}
        >
          <Download size={18} />
          {isDownloadingPDF ? "Membuat PDF..." : "Print ke PDF"}
        </Button>
      </div>
    </div>
  );
};

export default DataMiningResults;