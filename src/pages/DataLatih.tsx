import { useState } from "react";
import { Upload, Download, FileText, Search, Eye, Edit, Trash2, Plus, RefreshCw, AlertCircle, Loader2, Database, BarChart, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

const DataLatih = () => {
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  // Fetch training data from API
  const { data: trainingData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['data-latih'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/data-latih');
      return response.data.data || [];
    },
    refetchOnWindowFocus: false,
    initialData: [],
  });

  // Add new training data mutation
  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('http://localhost:3000/api/data-latih', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-latih'] });
      toast.success("Data berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambah data: " + error.message);
    }
  });

  // Delete single data mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`http://localhost:3000/api/data-latih/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-latih'] });
      toast.success("Data berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data: " + error.message);
    }
  });

  // Reset all data mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.delete('http://localhost:3000/api/data-latih');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-latih'] });
      toast.success("Data berhasil direset");
    },
    onError: (error) => {
      toast.error("Gagal reset data: " + error.message);
    }
  });

  // Filter data based on search
  const filteredData = trainingData.filter((item: any) =>
    item.jenis_barang?.toLowerCase().includes(search.toLowerCase()) ||
    item.kategori?.toLowerCase().includes(search.toLowerCase()) ||
    item.bulan?.toLowerCase().includes(search.toLowerCase()) ||
    item.status_stok?.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate stats from real data
  const stats = [
    {
      label: "Total Data",
      value: trainingData.length.toString(),
      color: "blue" as const,
      icon: Database
    },
    {
      label: "Stok Rendah",
      value: trainingData.filter((item: any) => item.status_stok === 'Rendah').length.toString(),
      color: "danger" as const,
      icon: AlertCircle
    },
    {
      label: "Stok Cukup",
      value: trainingData.filter((item: any) => item.status_stok === 'Cukup').length.toString(),
      color: "warning" as const,
      icon: Target
    },
    {
      label: "Stok Berlebih",
      value: trainingData.filter((item: any) => item.status_stok === 'Berlebih').length.toString(),
      color: "success" as const,
      icon: TrendingUp
    },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Pilih file CSV terlebih dahulu");
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:3000/api/data/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data && response.data.data.success) {
        toast.success(`Data berhasil diimport: ${response.data.data.imported_count} records`);
        refetch();
        setSelectedFile(null);
      } else {
        toast.error("Gagal import data: " + (response.data.data?.message || response.data.message));
      }
    } catch (error: any) {
      toast.error("Error uploading file: " + error.message);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/data/export?format=csv', {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data_latih.csv';
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

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data? Tindakan ini tidak dapat dibatalkan!')) {
      resetMutation.mutate();
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Rendah': return 'destructive';
      case 'Cukup': return 'default';
      case 'Berlebih': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title flex items-center gap-3">
          <FileText className="text-primary" size={36} />
          Data Latih
        </h1>
        <p className="page-subtitle">Upload dan kelola data training untuk proses data mining</p>
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
        <h2 className="text-lg font-semibold mb-4">Upload Data Training</h2>
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
              <p className="text-sm text-green-600 mt-1">
                File dipilih: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={!selectedFile} className="flex items-center gap-2">
              <Upload size={16} />
              Upload CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/data/template_data_latih.csv';
                link.download = 'template_data_latih.csv';
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
              placeholder="Cari data..."
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
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="flex items-center gap-2"
          >
            {resetMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Reset All Data
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Data Training ({filteredData.length} records)</h2>
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
                  <th className="text-left p-3 font-medium">ID</th>
                  <th className="text-left p-3 font-medium">Jenis Barang</th>
                  <th className="text-left p-3 font-medium">Kategori</th>
                  <th className="text-left p-3 font-medium">Harga</th>
                  <th className="text-left p-3 font-medium">Stok</th>
                  <th className="text-left p-3 font-medium">Penjualan</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Status Penjualan</th>
                  <th className="text-left p-3 font-medium">Status Stok</th>
                  <th className="text-left p-3 font-medium">Bulan</th>
                  <th className="text-left p-3 font-medium">Split Type</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item: any) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{item.id}</td>
                    <td className="p-3 text-sm font-medium">{item.jenis_barang}</td>
                    <td className="p-3 text-sm">{item.kategori}</td>
                    <td className="p-3 text-sm">Rp {item.harga?.toLocaleString()}</td>
                    <td className="p-3 text-sm">{item.stok}</td>
                    <td className="p-3 text-sm">{item.jumlah_penjualan}</td>
                    <td className="p-3 text-sm">{item.status}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={getStatusBadgeColor(item.status_penjualan)}>
                        {item.status_penjualan}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      <Badge variant={getStatusBadgeColor(item.status_stok)}>
                        {item.status_stok}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{item.bulan}</td>
                    <td className="p-3 text-sm">
                      <Badge variant={item.split_type === 'latih' ? 'default' : 'secondary'}>
                        {item.split_type === 'latih' ? 'Training' : item.split_type === 'uji' ? 'Testing' : 'Unsplit'}
                      </Badge>
                    </td>
                   <td className="p-3">
                     <div className="flex gap-2">
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
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>Belum ada data training</p>
              <p className="text-sm">Upload file CSV untuk memulai</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DataLatih;