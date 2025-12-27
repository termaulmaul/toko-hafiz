import { useState } from "react";
import { Upload, Download, Package, Search, Plus, Edit, Trash2, RefreshCw, AlertCircle, Loader2, Database, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

const DataStok = () => {
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data stok from API
  const { data: stokData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['data-stok'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/data-stok');
      return response.data.data || [];
    },
    refetchOnWindowFocus: false,
    initialData: [],
  });

  // Delete single data mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`http://localhost:3000/api/data-stok/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-stok'] });
      toast.success("Data berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    }
  });

  // Filter data based on search
  const filteredData = stokData.filter((item: any) =>
    item.nama_barang?.toLowerCase().includes(search.toLowerCase()) ||
    item.kode_barang?.toLowerCase().includes(search.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats from real data
  const stats = [
    { 
      label: "Total Barang", 
      value: stokData.length.toString(), 
      color: "blue" as const,
      icon: Database
    },
    { 
      label: "Stok Rendah", 
      value: stokData.filter((item: any) => item.stok_sekarang < item.stok_minimum).length.toString(), 
      color: "danger" as const,
      icon: AlertTriangle
    },
    { 
      label: "Stok Normal", 
      value: stokData.filter((item: any) => 
        item.stok_sekarang >= item.stok_minimum && item.stok_sekarang <= item.stok_maksimum
      ).length.toString(), 
      color: "warning" as const,
      icon: CheckCircle
    },
    { 
      label: "Stok Berlebih", 
      value: stokData.filter((item: any) => item.stok_sekarang > item.stok_maksimum).length.toString(), 
      color: "success" as const,
      icon: TrendingUp
    },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-validate when file is selected
      await validateFile(file);
    }
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    setValidationResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3000/api/data/validate-stok-template', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setValidationResult(response.data.data);
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        issues: [`Validation failed: ${error.response?.data?.message || error.message}`]
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Pilih file CSV terlebih dahulu");
      return;
    }

    // Check validation first
    if (!validationResult?.isValid) {
      toast.error("File CSV tidak valid. Perbaiki masalah yang terdeteksi sebelum upload.");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:3000/api/data/upload-stok', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data && response.data.data.success) {
        toast.success(`Data berhasil diimport: ${response.data.data.imported_count} records`);
        refetch();
        setSelectedFile(null);
        setValidationResult(null);
      } else {
        toast.error("Gagal import data: " + (response.data.data?.message || response.data.message));
      }
    } catch (error: any) {
      toast.error("Error uploading file: " + error.message);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/data-stok/export', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data_stok.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Data berhasil didownload");
    } catch (error) {
      toast.error("Gagal download data");
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStokStatusBadge = (item: any) => {
    if (item.stok_sekarang < item.stok_minimum) {
      return <Badge variant="destructive">Stok Rendah</Badge>;
    } else if (item.stok_sekarang > item.stok_maksimum) {
      return <Badge variant="secondary">Stok Berlebih</Badge>;
    } else {
      return <Badge variant="default">Normal</Badge>;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'Aktif' ? 'default' : 'secondary';
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <Package className="text-primary" size={36} />
          Data Stok
        </h1>
        <p className="page-subtitle">Kelola data stok barang untuk monitoring inventori</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Upload Section */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Upload Data Stok</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <div className="flex-1">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Format: CSV. Download template di bawah ini untuk format yang benar.
            </p>
            {selectedFile && (
              <div className="mt-2">
                <p className="text-sm text-green-600">
                  File dipilih: {selectedFile.name}
                </p>

                {/* Validation Status */}
                {isValidating && (
                  <div className="flex items-center gap-2 mt-2 text-blue-600">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-sm">Memvalidasi file...</span>
                  </div>
                )}

                {validationResult && (
                  <div className="mt-3 p-3 rounded-lg border">
                    {validationResult.isValid ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">File Valid</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 mb-2">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">File Tidak Valid</span>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Total baris: {validationResult.totalRows}</p>
                      <p>Baris data: {validationResult.dataRows}</p>
                      {validationResult.summary && (
                        <p>Valid: {validationResult.summary.validRows}, Invalid: {validationResult.summary.invalidRows}</p>
                      )}
                    </div>

                    {validationResult.issues && validationResult.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-600 mb-1">Masalah ditemukan:</p>
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                          {validationResult.issues.slice(0, 5).map((issue: string, index: number) => (
                            <li key={index}>• {issue}</li>
                          ))}
                          {validationResult.issues.length > 5 && (
                            <li className="text-muted-foreground">
                              ... dan {validationResult.issues.length - 5} masalah lainnya
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !validationResult?.isValid}
              className="flex items-center gap-2"
            >
              <Upload size={16} />
              Upload CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/data/template_data_stok.csv';
                link.download = 'template_data_stok.csv';
                link.click();
              }}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Download Template
            </Button>
          </div>
        </div>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Cari barang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw size={16} />
            Refresh
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} className="flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </Button>
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            Tambah Barang
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Data Stok ({filteredData.length} barang)</h2>
          {isLoading && <Loader2 className="animate-spin" size={20} />}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-red-700">Error loading data: {error.message}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Kode</th>
                <th className="text-left p-3 font-medium">Nama Barang</th>
                <th className="text-left p-3 font-medium">Kategori</th>
                <th className="text-left p-3 font-medium">Harga</th>
                <th className="text-left p-3 font-medium">Stok Sekarang</th>
                <th className="text-left p-3 font-medium">Stok Min</th>
                <th className="text-left p-3 font-medium">Stok Max</th>
                <th className="text-left p-3 font-medium">Status Stok</th>
                <th className="text-left p-3 font-medium">Status Barang</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item: any) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-mono">{item.kode_barang}</td>
                  <td className="p-3 text-sm font-medium">{item.nama_barang}</td>
                  <td className="p-3 text-sm">{item.kategori}</td>
                  <td className="p-3 text-sm">Rp {item.harga_satuan?.toLocaleString()}</td>
                  <td className="p-3 text-sm font-medium">{item.stok_sekarang}</td>
                  <td className="p-3 text-sm">{item.stok_minimum}</td>
                  <td className="p-3 text-sm">{item.stok_maksimum}</td>
                  <td className="p-3 text-sm">
                    {getStokStatusBadge(item)}
                  </td>
                  <td className="p-3 text-sm">
                    <Badge variant={getStatusBadgeColor(item.status_barang)}>
                      {item.status_barang}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data stok</p>
              <p className="text-sm">Upload file CSV atau tambah data manual</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DataStok;